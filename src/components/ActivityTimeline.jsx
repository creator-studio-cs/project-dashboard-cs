import { useState } from "react";
import { useActivity, logActivity } from "../hooks/useActivity";
import { BRAND } from "../constants/business.config";
import { inputStyle, btnPrimary } from "../constants/styles";

const TYPE_META = {
  note:               { icon: "📝", color: BRAND.navy },
  email:              { icon: "✉",  color: BRAND.green },
  stage_change:       { icon: "→",  color: BRAND.amber },
  tier_change:        { icon: "◆",  color: BRAND.sand },
  journey_change:     { icon: "↻",  color: BRAND.navy },
  quote_status_change:{ icon: "$",  color: BRAND.green },
  deal_type_change:   { icon: "▤",  color: BRAND.gray },
  file:               { icon: "📎", color: BRAND.gray },
  task_completed:     { icon: "✓",  color: BRAND.green },
  created:            { icon: "★",  color: BRAND.navy },
};

export default function ActivityTimeline({ contactId }) {
  const { activity, loading } = useActivity(contactId);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAddNote() {
    if (!note.trim()) return;
    setSaving(true);
    await logActivity(contactId, "note", note.trim());
    setNote("");
    setSaving(false);
  }

  return (
    <div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={2}
          placeholder="Add a note…"
          style={{ ...inputStyle, resize: "vertical", flex: 1 }}
        />
        <button style={{ ...btnPrimary, alignSelf: "flex-end", flexShrink: 0 }} onClick={handleAddNote} disabled={!note.trim() || saving}>
          {saving ? "…" : "Add"}
        </button>
      </div>

      {loading ? (
        <div style={{ fontSize: 12, color: BRAND.gray }}>Loading…</div>
      ) : activity.length === 0 ? (
        <div style={{ fontSize: 12, color: BRAND.gray }}>No activity yet.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {activity.map(a => {
            const meta = TYPE_META[a.type] || { icon: "•", color: BRAND.gray };
            return (
              <div key={a.id} style={{ display: "flex", gap: 8, padding: "7px 0", borderBottom: `1px solid ${BRAND.border}` }}>
                <div style={{ width: 18, textAlign: "center", flexShrink: 0, color: meta.color, fontSize: 12 }}>{meta.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, color: BRAND.black, whiteSpace: "pre-wrap", lineHeight: 1.5 }}>{a.text}</div>
                  <div style={{ fontSize: 10, color: BRAND.gray, marginTop: 2 }}>{new Date(a.created).toLocaleString()}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
