import { useState } from "react";
import { BRAND } from "../constants/business.config";
import { inputStyle, selectStyle, btnPrimary, btnSecondary, card } from "../constants/styles";

const TYPE_LABELS = { text: "Text", number: "Number", date: "Date", select: "Dropdown", checkbox: "Yes/No" };

export default function FieldDefsManager({ fieldDefs, addFieldDef, updateFieldDef, deleteFieldDef, onClose }) {
  const [newLabel, setNewLabel] = useState("");
  const [newType, setNewType] = useState("text");
  const [newOptions, setNewOptions] = useState("");

  function handleAdd() {
    if (!newLabel.trim()) return;
    const options = newType === "select" ? newOptions.split(",").map(o => o.trim()).filter(Boolean) : [];
    addFieldDef(newLabel.trim(), newType, options);
    setNewLabel("");
    setNewOptions("");
    setNewType("text");
  }

  return (
    <div
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, minHeight: "100%", background: "rgba(20,20,20,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 200, padding: "32px 16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 520, maxWidth: "95%", background: BRAND.white, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "22px 24px", boxShadow: "0 12px 48px rgba(0,0,0,0.2)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 15, color: BRAND.navy }}>Custom Fields</div>
            <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 2 }}>Add fields specific to your business — they'll show up on every contact.</div>
          </div>
          <button onClick={onClose} style={{ ...btnSecondary, padding: "3px 10px", fontSize: 12 }}>✕</button>
        </div>

        {/* Existing fields */}
        {fieldDefs.length === 0 ? (
          <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 16 }}>No custom fields yet.</div>
        ) : (
          <div style={{ marginBottom: 16 }}>
            {fieldDefs.map(fd => (
              <div key={fd.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8, padding: "10px 12px" }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: BRAND.navy }}>{fd.label}</div>
                  <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 1 }}>
                    {TYPE_LABELS[fd.type]}{fd.type === "select" && fd.options?.length ? ` — ${fd.options.join(", ")}` : ""}
                  </div>
                </div>
                <button
                  onClick={() => { if (window.confirm(`Delete "${fd.label}"? Existing values on contacts won't be shown anymore.`)) deleteFieldDef(fd.id); }}
                  style={{ background: "none", border: "none", color: BRAND.red, cursor: "pointer", fontSize: 12 }}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new field */}
        <div style={{ borderTop: `1px solid ${BRAND.border}`, paddingTop: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 500, color: BRAND.navy, marginBottom: 10 }}>Add a field</div>
          <div style={{ display: "flex", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
            <input
              value={newLabel}
              onChange={e => setNewLabel(e.target.value)}
              placeholder="Field name, e.g. Referral Source"
              style={{ ...inputStyle, flex: "2 1 180px" }}
            />
            <select value={newType} onChange={e => setNewType(e.target.value)} style={{ ...selectStyle, flex: "1 1 120px" }}>
              {Object.entries(TYPE_LABELS).map(([val, lbl]) => <option key={val} value={val}>{lbl}</option>)}
            </select>
          </div>
          {newType === "select" && (
            <input
              value={newOptions}
              onChange={e => setNewOptions(e.target.value)}
              placeholder="Options, comma-separated, e.g. Small, Medium, Large"
              style={{ ...inputStyle, marginBottom: 8 }}
            />
          )}
          <button style={{ ...btnPrimary, width: "100%" }} onClick={handleAdd} disabled={!newLabel.trim()}>
            + Add field
          </button>
        </div>
      </div>
    </div>
  );
}
