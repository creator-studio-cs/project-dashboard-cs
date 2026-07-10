import { useState, useMemo } from "react";
import { BRAND } from "../constants/business.config";
import { label, tag, btnSecondary } from "../constants/styles";
import { initials, avatarColor } from "../utils/helpers";
import { needsFollowUp, daysSince } from "../utils/followups";

function MetricCard({ value, sub, color }) {
  return (
    <div style={{ background: BRAND.sandLight, borderRadius: 8, padding: "14px 16px", flex: 1, minWidth: 90, textAlign: "center" }}>
      <div style={{ fontSize: 22, fontWeight: 700, color: color || BRAND.navy }}>{value}</div>
      <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 3 }}>{sub}</div>
    </div>
  );
}

function BreakdownSection({ title, groups }) {
  if (!groups.length) return null;
  const max = Math.max(...groups.map(g => g.total), 1);
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ ...label, marginBottom: 10 }}>{title}</div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {groups.map(g => (
          <div key={g.name}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 4 }}>
              <span style={{ color: BRAND.black, fontWeight: 500 }}>{g.name}</span>
              <span style={{ color: BRAND.gray }}>{g.total} sent</span>
            </div>
            <div style={{ height: 6, background: BRAND.border, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${Math.round((g.total / max) * 100)}%`, background: BRAND.navy, borderRadius: 99 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function groupBy(recipients, getKey) {
  const map = {};
  for (const { contact } of recipients) {
    const k = getKey(contact) || "Unknown";
    if (!map[k]) map[k] = { name: k, total: 0 };
    map[k].total++;
  }
  return Object.values(map).sort((a, b) => b.total - a.total);
}

export default function CampaignDetail({ campaign, onBack, onDeleteCampaign, onSelectContact }) {
  const [confirming, setConfirming] = useState(false);
  const [recipientSort, setRecipientSort] = useState("name");

  const { recipients } = campaign;
  const total       = recipients.length;
  const needsFU     = recipients.filter(r => needsFollowUp(r.entry)).length;
  const followedUp  = recipients.filter(r => r.entry.followUpSentAt).length;
  const days        = campaign.sentAt ? daysSince(campaign.sentAt) : null;

  const bySegment = useMemo(() => groupBy(recipients, c => c.segment), [recipients]);
  const byIsland  = useMemo(() => groupBy(recipients, c => c.island),  [recipients]);
  const byStage   = useMemo(() => groupBy(recipients, c => c.stage),   [recipients]);

  const sortedRecipients = useMemo(() => [...recipients].sort((a, b) => {
    if (recipientSort === "name")   return `${a.contact.firstName} ${a.contact.lastName}`.localeCompare(`${b.contact.firstName} ${b.contact.lastName}`);
    if (recipientSort === "status") {
      const score = x => x.entry.followUpSentAt ? 2 : needsFollowUp(x.entry) ? 0 : 1;
      return score(a) - score(b);
    }
    return 0;
  }), [recipients, recipientSort]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 18, flexShrink: 0 }}>
        <button onClick={onBack} style={{ ...btnSecondary, padding: "5px 10px", fontSize: 12, flexShrink: 0 }}>← Back</button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 15, color: BRAND.black, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {campaign.label}
          </div>
          <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 3, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {campaign.sentAt && <span>{new Date(campaign.sentAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}</span>}
            {days !== null && <span>· {days} days ago</span>}
            {campaign.isBulk && <span>· Bulk send</span>}
            {campaign.journeyType && <span>· {campaign.journeyType}</span>}
          </div>
        </div>
        {!confirming ? (
          <button
            onClick={() => setConfirming(true)}
            style={{ ...btnSecondary, fontSize: 11, color: BRAND.red, borderColor: `color-mix(in srgb, ${BRAND.red} 27%, transparent)`, flexShrink: 0 }}
          >
            Delete from CRM
          </button>
        ) : (
          <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 11, color: BRAND.red }}>Remove {total} record{total > 1 ? "s" : ""}?</span>
            <button onClick={() => { onDeleteCampaign(campaign); onBack(); }} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: BRAND.red, color: BRAND.white, fontSize: 11, cursor: "pointer" }}>Yes, delete</button>
            <button onClick={() => setConfirming(false)} style={{ padding: "4px 8px", borderRadius: 6, border: `1px solid ${BRAND.border}`, background: BRAND.white, color: BRAND.gray, fontSize: 11, cursor: "pointer" }}>Cancel</button>
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Metric cards */}
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          <MetricCard value={total}       sub="Recipients" />
          {needsFU > 0 && <MetricCard value={needsFU} sub="Need Follow-up" color={BRAND.amber} />}
          {followedUp > 0 && <MetricCard value={followedUp} sub="Followed Up" color={BRAND.green} />}
        </div>

        {/* Breakdown sections */}
        {bySegment.length > 1 && <BreakdownSection title="Sent by Segment" groups={bySegment} />}
        {byIsland.length  > 1 && <BreakdownSection title="Sent by Location"  groups={byIsland}  />}
        {byStage.length   > 1 && <BreakdownSection title="Sent by Pipeline Stage" groups={byStage} />}

        {/* Recipient table */}
        <div style={{ marginBottom: 6, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={label}>All Recipients ({total})</div>
          <div style={{ display: "flex", gap: 4 }}>
            {[["name","Name"],["status","Status"]].map(([k, lbl]) => (
              <button
                key={k}
                onClick={() => setRecipientSort(k)}
                style={{ padding: "2px 8px", borderRadius: 99, border: "1px solid", fontSize: 11, cursor: "pointer",
                  borderColor: recipientSort === k ? BRAND.navy : BRAND.border,
                  background:  recipientSort === k ? BRAND.navyLight : BRAND.white,
                  color:       recipientSort === k ? BRAND.navy : BRAND.gray,
                }}
              >
                {lbl}
              </button>
            ))}
          </div>
        </div>

        <div style={{ background: BRAND.white, border: `1px solid ${BRAND.border}`, borderRadius: 10, overflow: "hidden" }}>
          {/* Table header */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8, padding: "8px 14px 6px", borderBottom: `1px solid ${BRAND.border}` }}>
            <span style={label}>Contact</span>
            <span style={label}>Status</span>
          </div>

          {sortedRecipients.map(({ contact, entry }) => {
            const fu   = needsFollowUp(entry);
            const dSent = entry.sentAt ? daysSince(entry.sentAt) : null;
            return (
              <div
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                style={{ display: "grid", gridTemplateColumns: "1fr 110px", gap: 8, padding: "9px 14px", alignItems: "center", cursor: "pointer", borderTop: `1px solid ${BRAND.border}`, transition: "background 0.1s" }}
                onMouseEnter={e => e.currentTarget.style.background = BRAND.grayLight}
                onMouseLeave={e => e.currentTarget.style.background = "transparent"}
              >
                <div style={{ display: "flex", gap: 8, alignItems: "center", minWidth: 0 }}>
                  <div style={{ width: 28, height: 28, borderRadius: "50%", background: avatarColor(contact.id), display: "flex", alignItems: "center", justifyContent: "center", color: BRAND.white, fontSize: 11, fontWeight: 500, flexShrink: 0 }}>
                    {initials(contact.firstName, contact.lastName)}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 500, color: BRAND.black, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {contact.firstName} {contact.lastName}
                    </div>
                    <div style={{ fontSize: 11, color: BRAND.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{contact.org}</div>
                  </div>
                </div>
                <div>
                  {entry.followUpSentAt ? (
                    <span style={{ ...tag, background: BRAND.greenLight, color: BRAND.green }}>Followed up</span>
                  ) : entry.followUpDismissed ? (
                    <span style={tag}>Dismissed</span>
                  ) : fu ? (
                    <span style={{ ...tag, background: BRAND.amberLight, color: BRAND.amber, border: `0.5px solid color-mix(in srgb, ${BRAND.amber} 27%, transparent)` }}>
                      {dSent}d — needs FU
                    </span>
                  ) : (
                    <span style={{ fontSize: 11, color: BRAND.gray }}>{dSent !== null ? `${dSent}d ago` : "—"}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
