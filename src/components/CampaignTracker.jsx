import { useState, useMemo } from "react";
import { BRAND } from "../constants/business.config";
import { tag } from "../constants/styles";
import { groupByCampaign, needsFollowUp } from "../utils/followups";
import CampaignDetail from "./CampaignDetail";

export default function CampaignTracker({ contacts, onSelectContact, onDeleteCampaign }) {
  const [selected, setSelected] = useState(null);

  const campaigns = useMemo(() => groupByCampaign(contacts.filter(c => !c.pending)), [contacts]);

  // If a campaign was deleted while viewing it, fall back to the list
  const activeCampaign = selected && campaigns.find(c => c.key === selected.key)
    ? campaigns.find(c => c.key === selected.key)
    : null;

  if (activeCampaign) {
    return (
      <CampaignDetail
        campaign={activeCampaign}
        onBack={() => setSelected(null)}
        onDeleteCampaign={onDeleteCampaign}
        onSelectContact={onSelectContact}
      />
    );
  }

  if (!campaigns.length) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: BRAND.gray }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✉</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No campaigns sent yet</div>
        <div style={{ fontSize: 12 }}>Emails sent via the CRM will appear here.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {campaigns.map(campaign => {
        const total        = campaign.recipients.length;
        const pendingFU    = campaign.recipients.filter(r => needsFollowUp(r.entry)).length;

        return (
          <div
            key={campaign.key}
            onClick={() => setSelected(campaign)}
            style={{ background: BRAND.white, border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "14px 16px", cursor: "pointer", display: "flex", alignItems: "center", gap: 12, transition: "box-shadow 0.15s, border-color 0.15s" }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = BRAND.navyMid; e.currentTarget.style.boxShadow = "0 2px 10px rgba(43,43,43,0.08)"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = BRAND.border;  e.currentTarget.style.boxShadow = "none"; }}
          >
            {/* Icon */}
            <div style={{ width: 38, height: 38, borderRadius: 8, background: BRAND.navyLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <span style={{ fontSize: 17 }}>{campaign.isBulk ? "📢" : "✉"}</span>
            </div>

            {/* Name + meta */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, fontSize: 13, color: BRAND.black, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {campaign.label}
              </div>
              <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 2, display: "flex", gap: 6, flexWrap: "wrap" }}>
                {campaign.sentAt && <span>{new Date(campaign.sentAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>}
                {campaign.isBulk    && <span>· Bulk</span>}
                {campaign.journeyType && <span>· {campaign.journeyType}</span>}
                <span>· {total} recipient{total !== 1 ? "s" : ""}</span>
              </div>
            </div>

            {/* Stats */}
            <div style={{ display: "flex", gap: 12, alignItems: "center", flexShrink: 0 }}>
              {pendingFU > 0 && (
                <span style={{ ...tag, background: BRAND.amberLight, color: BRAND.amber, border: `0.5px solid color-mix(in srgb, ${BRAND.amber} 27%, transparent)` }}>
                  {pendingFU} FU needed
                </span>
              )}
            </div>

            <span style={{ color: BRAND.gray, fontSize: 12 }}>›</span>
          </div>
        );
      })}
    </div>
  );
}
