import { useState } from "react";
import { BRAND, PROJECT_STATUSES, PROJECT_STATUS_COLORS, PROJECT_STATUS_BG } from "../constants/business.config";
import { inputStyle, selectStyle, btnPrimary, btnSecondary, label } from "../constants/styles";

// Add / edit a project. `project` is null when creating. Links to a single
// primary client (contactId) and drives the Gantt via startDate/endDate.
export default function ProjectModal({ project, contacts = [], onSave, onDelete, onClose }) {
  const isEdit = !!project;
  const [form, setForm] = useState({
    name:      project?.name      || "",
    contactId: project?.contactId || "",
    status:    project?.status    || PROJECT_STATUSES[0],
    startDate: project?.startDate || "",
    endDate:   project?.endDate   || "",
    value:     project?.value     || 0,
    notes:     project?.notes     || "",
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const datesValid = !form.startDate || !form.endDate || form.endDate >= form.startDate;
  const valid = form.name.trim() && form.startDate && form.endDate && datesValid;

  const sortedContacts = [...contacts]
    .filter(c => !c.pending)
    .sort((a, b) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName));

  function handleSave() {
    if (!valid) return;
    onSave({
      ...form,
      contactId: form.contactId ? Number(form.contactId) : null,
      value: Number(form.value) || 0,
    });
  }

  return (
    <div
      className="crm-modal-backdrop"
      style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(20,20,20,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 99, padding: "32px 16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ width: 480, maxWidth: "100%", background: BRAND.white, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "22px 24px 0", boxShadow: "0 12px 48px rgba(0,0,0,0.2)", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 64px)" }}>

        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18, flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 500, fontSize: 16, color: BRAND.navy }}>{isEdit ? "Edit project" : "New project"}</div>
            <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 3 }}>Track the work, its client, and its timeline.</div>
          </div>
          <button onClick={onClose} style={{ ...btnSecondary, padding: "4px 10px", fontSize: 12 }}>✕</button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", minHeight: 0, paddingBottom: 4 }}>
          <div style={{ marginBottom: 14 }}>
            <label style={label}>Project name <span style={{ color: BRAND.red }}>*</span></label>
            <input autoFocus value={form.name} onChange={e => set("name", e.target.value)} placeholder="e.g. Spring brand campaign" style={inputStyle} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>Client</label>
            <select value={form.contactId} onChange={e => set("contactId", e.target.value)} style={{ ...selectStyle, width: "100%" }}>
              <option value="">— No client linked —</option>
              {sortedContacts.map(c => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName}{c.org ? ` · ${c.org}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={label}>Status</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 4 }}>
              {PROJECT_STATUSES.map(s => {
                const active = form.status === s;
                return (
                  <button
                    key={s}
                    onClick={() => set("status", s)}
                    style={{
                      padding: "6px 13px", borderRadius: 99, border: "1px solid", fontSize: 12, cursor: "pointer",
                      fontWeight: active ? 500 : 400,
                      borderColor: active ? PROJECT_STATUS_COLORS[s] : BRAND.border,
                      background: active ? PROJECT_STATUS_BG[s] : BRAND.white,
                      color: active ? PROJECT_STATUS_COLORS[s] : BRAND.gray,
                    }}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: "flex", gap: 12, marginBottom: 6 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Start date <span style={{ color: BRAND.red }}>*</span></label>
              <input type="date" value={form.startDate} onChange={e => set("startDate", e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>End date <span style={{ color: BRAND.red }}>*</span></label>
              <input type="date" value={form.endDate} min={form.startDate || undefined} onChange={e => set("endDate", e.target.value)} style={{ ...inputStyle, width: "100%" }} />
            </div>
          </div>
          {!datesValid && (
            <div style={{ fontSize: 11, color: BRAND.red, marginBottom: 10 }}>End date must be on or after the start date.</div>
          )}

          <div style={{ marginBottom: 14, marginTop: 8 }}>
            <label style={label}>Project value ($)</label>
            <input type="number" min={0} value={form.value || ""} onChange={e => set("value", e.target.value)} placeholder="0" style={{ ...inputStyle, width: 140 }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={label}>Notes</label>
            <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={3} placeholder="Scope, deliverables, milestones…" style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", gap: 8, padding: "14px 0 20px", borderTop: `1px solid ${BRAND.border}`, flexShrink: 0 }}>
          {isEdit && (
            <button
              onClick={() => onDelete(project)}
              style={{ ...btnSecondary, color: BRAND.red, borderColor: `color-mix(in srgb, ${BRAND.red} 27%, transparent)` }}
            >
              Delete
            </button>
          )}
          <button style={{ ...btnSecondary, marginLeft: isEdit ? "auto" : 0 }} onClick={onClose}>Cancel</button>
          <button style={{ ...btnPrimary, flex: isEdit ? "none" : 1 }} disabled={!valid} onClick={handleSave}>
            {isEdit ? "Save changes" : "Add project"}
          </button>
        </div>
      </div>
    </div>
  );
}
