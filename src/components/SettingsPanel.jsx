import { useState, useMemo } from "react";
import { BRAND } from "../constants/business.config";
import { inputStyle, btnPrimary, btnSecondary, label, card } from "../constants/styles";
import { useSettings } from "../hooks/useSettings";
import { useToast } from "./Toast";

const COLOR_PRESETS = [
  { name: "Neutral",  primary: "#2B2B2B", accent: "#8C8C8C" },
  { name: "Slate",    primary: "#1B2A4A", accent: "#B5A48A" },
  { name: "Forest",   primary: "#26382E", accent: "#8AA891" },
  { name: "Plum",     primary: "#3A2A3F", accent: "#A98CA6" },
  { name: "Ocean",    primary: "#12313B", accent: "#7FA8AE" },
  { name: "Espresso", primary: "#2E2622", accent: "#B79A7D" },
];

const TABS = [
  { key: "identity",   label: "Identity" },
  { key: "appearance", label: "Appearance" },
  { key: "categories", label: "Categories" },
];

// deep-ish clone that's fine for our plain settings shape
const clone = (o) => JSON.parse(JSON.stringify(o));

export default function SettingsPanel({ onClose, onManageCustomFields }) {
  const { settings, saveSettings, previewColors, resetColors, configured } = useSettings();
  const { addToast } = useToast();
  const [tab, setTab] = useState("identity");
  const [draft, setDraft] = useState(() => clone(settings));
  const [saving, setSaving] = useState(false);

  function setIdentity(field, value) {
    setDraft(d => ({ ...d, identity: { ...d.identity, [field]: value } }));
  }
  function setColor(field, value) {
    setDraft(d => {
      const next = { ...d, colors: { ...d.colors, [field]: value } };
      previewColors(next.colors); // live preview, not saved yet
      return next;
    });
  }
  function applyPreset(p) {
    setDraft(d => {
      const next = { ...d, colors: { primary: p.primary, accent: p.accent } };
      previewColors(next.colors);
      return next;
    });
  }
  function setList(key, arr) {
    setDraft(d => ({ ...d, [key]: arr }));
  }

  function cancel() {
    resetColors();   // undo any live color preview
    onClose();
  }

  async function handleSave() {
    setSaving(true);
    const res = await saveSettings(draft);
    setSaving(false);
    if (res.ok) {
      addToast(res.local ? "Settings applied (not synced — connect a database to share)" : "Settings saved", "success");
      onClose();
    } else {
      addToast("Couldn't save settings. Check your connection and try again.", "error");
    }
  }

  return (
    <div
      className="crm-modal-backdrop"
      onClick={cancel}
      style={{ position: "fixed", inset: 0, background: "rgba(20,20,20,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 300, padding: "32px 16px", overflowY: "auto" }}
    >
      <div
        className="crm-modal"
        onClick={e => e.stopPropagation()}
        style={{ ...card, width: "100%", maxWidth: 620, padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", maxHeight: "calc(100vh - 64px)" }}
      >
        {/* Header */}
        <div style={{ padding: "18px 22px", borderBottom: `1px solid ${BRAND.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 17, color: BRAND.navy }}>Workspace Settings</div>
            <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 2 }}>
              {configured ? "Changes are shared with your whole workspace." : "Not connected to a database — changes apply on this device only."}
            </div>
          </div>
          <button onClick={cancel} aria-label="Close settings" style={{ background: "none", border: "none", fontSize: 22, color: BRAND.gray, cursor: "pointer", lineHeight: 1 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, padding: "10px 22px 0", flexShrink: 0, flexWrap: "wrap" }}>
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              style={{
                padding: "7px 14px", borderRadius: "8px 8px 0 0", border: "none", cursor: "pointer",
                fontSize: 13, fontWeight: tab === t.key ? 600 : 400,
                background: tab === t.key ? BRAND.navyLight : "transparent",
                color: tab === t.key ? BRAND.navy : BRAND.gray,
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px", overflowY: "auto", flex: 1 }}>
          {tab === "identity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <Field label="Business name" value={draft.identity.name} onChange={v => setIdentity("name", v)} placeholder="Your Business Name" />
              <Field label="Tagline" value={draft.identity.tagline} onChange={v => setIdentity("tagline", v)} placeholder="One-line description of what you do" />
              <Field label="From name (emails)" value={draft.identity.fromName} onChange={v => setIdentity("fromName", v)} placeholder="Your Name" />
              <Field label="From email" value={draft.identity.fromEmail} onChange={v => setIdentity("fromEmail", v)} placeholder="you@yourbusiness.com" />
              <Field label="Website" value={draft.identity.website} onChange={v => setIdentity("website", v)} placeholder="yourbusiness.com" />
            </div>
          )}

          {tab === "appearance" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              <div>
                <div style={label}>Presets</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {COLOR_PRESETS.map(p => {
                    const active = draft.colors.primary?.toLowerCase() === p.primary.toLowerCase() && draft.colors.accent?.toLowerCase() === p.accent.toLowerCase();
                    return (
                      <button key={p.name} onClick={() => applyPreset(p)} title={p.name}
                        style={{ display: "flex", alignItems: "center", gap: 7, padding: "6px 10px", borderRadius: 8, cursor: "pointer",
                          border: `1.5px solid ${active ? BRAND.navy : BRAND.border}`, background: BRAND.white, fontSize: 12, color: BRAND.gray }}>
                        <span style={{ display: "flex" }}>
                          <span style={{ width: 14, height: 14, borderRadius: "50% 0 0 50%", background: p.primary }} />
                          <span style={{ width: 14, height: 14, borderRadius: "0 50% 50% 0", background: p.accent }} />
                        </span>
                        {p.name}
                      </button>
                    );
                  })}
                </div>
              </div>
              <ColorField label="Primary color" hint="Header, buttons, active items" value={draft.colors.primary} onChange={v => setColor("primary", v)} />
              <ColorField label="Accent color" hint="Secondary highlights & tags" value={draft.colors.accent} onChange={v => setColor("accent", v)} />
              <div style={{ fontSize: 12, color: BRAND.gray, background: BRAND.grayLight, borderRadius: 8, padding: "10px 12px", lineHeight: 1.6 }}>
                Tip: pick a <strong>dark</strong> primary color — the header uses white text on top of it. Status colors (won / lost / warning) stay fixed for readability. The browser-tab icon updates only when the app is rebuilt.
              </div>
            </div>
          )}

          {tab === "categories" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
              <ListEditor title="Pipeline stages" hint="Order matters — this is your deal flow, left to right." items={draft.stages} onChange={a => setList("stages", a)} />
              <ListEditor title="Segments" hint="The types of leads/relationships you track." items={draft.segments} onChange={a => setList("segments", a)} />
              <ListEditor title="Locations / regions" items={draft.locations} onChange={a => setList("locations", a)} />
              <ListEditor title="Deal types" items={draft.dealTypes} onChange={a => setList("dealTypes", a)} />
              <ListEditor title="Journey types" hint="Outreach sequences." items={draft.journeyTypes} onChange={a => setList("journeyTypes", a)} />
              <ListEditor title="Intake: “how did you hear about us?”" items={draft.howMet} onChange={a => setList("howMet", a)} />
              <ListEditor title="Team members" hint="Shown when assigning tasks." items={draft.teamMembers} onChange={a => setList("teamMembers", a)} placeholder="Team member name" />
              {onManageCustomFields && (
                <div>
                  <div style={label}>Custom fields</div>
                  <button style={{ ...btnSecondary }} onClick={() => { resetColors(); onManageCustomFields(); }}>Manage custom fields →</button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "14px 22px", borderTop: `1px solid ${BRAND.border}`, display: "flex", justifyContent: "flex-end", gap: 10, flexShrink: 0 }}>
          <button style={btnSecondary} onClick={cancel} disabled={saving}>Cancel</button>
          <button style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }} onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label: lbl, value, onChange, placeholder }) {
  return (
    <div>
      <label style={label}>{lbl}</label>
      <input style={inputStyle} value={value || ""} onChange={e => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function ColorField({ label: lbl, hint, value, onChange }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value || "") ? value : "#2B2B2B";
  return (
    <div>
      <label style={label}>{lbl}</label>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <input type="color" value={safe} onChange={e => onChange(e.target.value)}
          style={{ width: 44, height: 38, padding: 0, border: `1.5px solid ${BRAND.border}`, borderRadius: 8, cursor: "pointer", background: "none" }} />
        <input style={{ ...inputStyle, width: 130, fontFamily: "monospace" }} value={value || ""} onChange={e => onChange(e.target.value)} placeholder="#2B2B2B" />
        {hint && <span style={{ fontSize: 12, color: BRAND.gray }}>{hint}</span>}
      </div>
    </div>
  );
}

// Editable string list: rename inline, remove, add.
function ListEditor({ title, hint, items, onChange, placeholder = "Add an option…" }) {
  const list = useMemo(() => items || [], [items]);
  function update(i, val) { const next = [...list]; next[i] = val; onChange(next); }
  function remove(i) { onChange(list.filter((_, idx) => idx !== i)); }
  function add() { onChange([...list, ""]); }
  return (
    <div>
      <div style={label}>{title}</div>
      {hint && <div style={{ fontSize: 12, color: BRAND.gray, marginTop: -3, marginBottom: 8 }}>{hint}</div>}
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {list.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
            <input style={{ ...inputStyle, flex: 1 }} value={item} onChange={e => update(i, e.target.value)} placeholder={placeholder} />
            <button onClick={() => remove(i)} aria-label={`Remove ${item}`}
              style={{ width: 34, height: 34, flexShrink: 0, borderRadius: 8, border: `1px solid ${BRAND.border}`, background: BRAND.white, color: BRAND.gray, cursor: "pointer", fontSize: 16, lineHeight: 1 }}>×</button>
          </div>
        ))}
        <button onClick={add} style={{ ...btnSecondary, alignSelf: "flex-start", fontSize: 12, marginTop: 2 }}>+ Add</button>
      </div>
    </div>
  );
}
