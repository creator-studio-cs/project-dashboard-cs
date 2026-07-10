import { useMemo } from "react";
import { BRAND } from "../constants/business.config";
import { btnPrimary, btnSecondary, tag } from "../constants/styles";
import { initials, avatarColor } from "../utils/helpers";
import { getFollowUpQueue, daysSince } from "../utils/followups";

export default function FollowUpQueue({ contacts, updateContact, onGenerateFollowUp }) {
  const queue = useMemo(() => getFollowUpQueue(contacts.filter(c => !c.pending)), [contacts]);

  function dismiss(contact, entry) {
    const history = (contact.emailHistory || []).map(e =>
      e.campaignId === entry.campaignId ? { ...e, followUpDismissed: true } : e
    );
    updateContact(contact.id, { emailHistory: history });
  }

  if (!queue.length) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px", color: BRAND.gray }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
        <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>All caught up</div>
        <div style={{ fontSize: 12 }}>No contacts need a follow-up right now. Check back in a few days.</div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 4 }}>
        {queue.length} contact{queue.length > 1 ? "s" : ""} haven't opened an email after 4+ days.
      </div>

      {queue.map(({ contact, entry }) => {
        const days = daysSince(entry.sentAt);
        return (
          <div key={`${contact.id}-${entry.campaignId}`} style={{ background: BRAND.white, border: `1px solid color-mix(in srgb, ${BRAND.amber} 33%, transparent)`, borderLeft: `3px solid ${BRAND.amber}`, borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
              {/* Avatar */}
              <div style={{ width: 36, height: 36, borderRadius: "50%", background: avatarColor(contact.id), display: "flex", alignItems: "center", justifyContent: "center", color: BRAND.white, fontSize: 13, fontWeight: 500, flexShrink: 0 }}>
                {initials(contact.firstName, contact.lastName)}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 500, fontSize: 13, color: BRAND.black }}>
                  {contact.firstName} {contact.lastName}
                </div>
                <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 1 }}>{contact.org}</div>
                <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 5, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                  <span style={{ ...tag, background: BRAND.amberLight, color: BRAND.amber, border: `0.5px solid color-mix(in srgb, ${BRAND.amber} 27%, transparent)` }}>
                    {days} days since send
                  </span>
                  {entry.journeyType && <span style={tag}>{entry.journeyType}</span>}
                </div>
                <div style={{ marginTop: 6, fontSize: 12, color: BRAND.gray }}>
                  <span style={{ fontWeight: 500, color: BRAND.navy }}>Original subject:</span> {entry.subject}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button
                onClick={() => onGenerateFollowUp(contact, entry)}
                style={{ ...btnPrimary, flex: 1, fontSize: 12 }}
              >
                Draft Follow-up
              </button>
              <button
                onClick={() => dismiss(contact, entry)}
                style={{ ...btnSecondary, fontSize: 12, color: BRAND.gray }}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
