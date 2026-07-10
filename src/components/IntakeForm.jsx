import { useState } from "react";
import { supabase } from "../lib/supabase";
import { BRAND, SEGMENTS, LOCATIONS, HOW_MET_OPTIONS, DEFAULT_INTAKE_SEGMENT, BUSINESS } from "../constants/business.config";
import { inputStyle, selectStyle, btnPrimary, label } from "../constants/styles";
import BrandLogo from "./BrandLogo";

const EMPTY = {
  firstName: "", lastName: "", email: "", phone: "", org: "",
  segment: DEFAULT_INTAKE_SEGMENT, island: "",
  message: "", notes: "",
  addedBy: "", howMet: "", howMetOther: "",
};

export default function IntakeForm() {
  const [form, setForm]           = useState(EMPTY);
  const [saving, setSaving]       = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError]         = useState("");

  function set(field, value) {
    setForm(f => ({ ...f, [field]: value }));
  }

  function isValid() {
    return form.firstName.trim() && form.email.trim() && form.addedBy.trim() && form.howMet;
  }

  async function handleSubmit() {
    if (!isValid()) return;
    setSaving(true);
    setError("");

    const howMetFinal = form.howMet === "Other" ? form.howMetOther || "Other" : form.howMet;
    const { error: err } = await supabase.from("contacts").insert({
      firstName:  form.firstName.trim(),
      lastName:   form.lastName.trim(),
      email:      form.email.trim(),
      phone:      form.phone.trim(),
      org:        form.org.trim(),
      segment:    form.segment,
      island:     form.island,
      message:    form.message.trim(),
      notes:      `[Submitted by ${form.addedBy} via ${howMetFinal}]\n${form.notes.trim()}`,
      tier:       "Warm",
      stage:      "Lead",
      source:     howMetFinal,
      tags:       ["Intake"],
      pending:    true,
      createdOn:  new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
    });

    setSaving(false);
    if (err) {
      setError("Something went wrong. Check your connection and try again.");
      console.error(err);
    } else {
      setSubmitted(true);
    }
  }

  if (submitted) {
    return (
      <div style={{ minHeight: "100vh", background: BRAND.grayLight, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ background: BRAND.white, borderRadius: 12, padding: "32px 28px", maxWidth: 420, width: "100%", textAlign: "center", border: `1px solid ${BRAND.border}`, boxShadow: "0 12px 48px rgba(0,0,0,0.12)" }}>
          <div style={{ width: 44, height: 44, borderRadius: "50%", background: BRAND.navyLight, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px", fontSize: 20 }}>✓</div>
          <div style={{ fontWeight: 500, fontSize: 16, color: BRAND.navy, marginBottom: 6 }}>Contact submitted!</div>
          <div style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.6, marginBottom: 24 }}>
            <strong style={{ color: BRAND.navy }}>{form.firstName} {form.lastName}</strong> has been added to the review queue. An admin will confirm and activate the contact in the CRM.
          </div>
          <button
            style={{ ...btnPrimary, width: "100%", padding: "9px 0" }}
            onClick={() => { setForm(EMPTY); setSubmitted(false); }}
          >
            Add another contact
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BRAND.grayLight, display: "flex", flexDirection: "column", fontFamily: "system-ui, sans-serif" }}>
      {/* Header — matches CRM nav bar */}
      <div style={{ background: BRAND.navy, padding: "0 20px", display: "flex", alignItems: "center", gap: 10, height: 52, flexShrink: 0 }}>
        <BrandLogo size={22} boxSize={32} />
        <div>
          <span style={{ fontWeight: 500, fontSize: 14, color: BRAND.white, letterSpacing: "0.01em" }}>{BUSINESS.name}</span>
          <span style={{ fontSize: 11, color: BRAND.sand, marginLeft: 5, letterSpacing: "0.05em" }}>new contact</span>
        </div>
      </div>

      {/* Form card — matches AddModal container style */}
      <div style={{ flex: 1, display: "flex", justifyContent: "center", padding: "24px 16px 40px" }}>
        <div style={{ width: 480, maxWidth: "100%", background: BRAND.white, border: `1px solid ${BRAND.border}`, borderRadius: 12, padding: "22px 24px 24px", boxShadow: "0 12px 48px rgba(0,0,0,0.08)", display: "flex", flexDirection: "column", gap: 0 }}>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontWeight: 500, fontSize: 16, color: BRAND.navy }}>Log a new contact</div>
            <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 3 }}>Fill this out after meeting someone in the field. The contact will appear in the CRM review queue for an admin to activate.</div>
          </div>

          {/* Divider */}
          <div style={{ height: 1, background: BRAND.border, marginBottom: 20 }} />

          {/* Who's submitting */}
          <Section label="Who's submitting this?">
            <div>
              <label style={label}>Your name <Req /></label>
              <input
                style={inputStyle}
                placeholder="e.g. Jordan"
                value={form.addedBy}
                onChange={e => set("addedBy", e.target.value)}
              />
            </div>
            <div>
              <label style={label}>How did you meet them? <Req /></label>
              <select
                style={{ ...selectStyle, width: "100%" }}
                value={form.howMet}
                onChange={e => set("howMet", e.target.value)}
              >
                <option value="">Select…</option>
                {HOW_MET_OPTIONS.map(opt => <option key={opt}>{opt}</option>)}
              </select>
            </div>
            {form.howMet === "Other" && (
              <div>
                <label style={label}>Describe how you met</label>
                <input
                  style={inputStyle}
                  placeholder="e.g. met at a community meeting…"
                  value={form.howMetOther}
                  onChange={e => set("howMetOther", e.target.value)}
                />
              </div>
            )}
          </Section>

          <Divider />

          {/* Contact info */}
          <Section label="Contact info">
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>First name <Req /></label>
                <input style={inputStyle} placeholder="e.g. Jordan" value={form.firstName} onChange={e => set("firstName", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Last name</label>
                <input style={inputStyle} placeholder="e.g. Smith" value={form.lastName} onChange={e => set("lastName", e.target.value)} />
              </div>
            </div>
            <div>
              <label style={label}>Email <Req /></label>
              <input type="email" style={inputStyle} placeholder="email@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={label}>Phone</label>
                <input type="tel" style={inputStyle} placeholder="555-0100" value={form.phone} onChange={e => set("phone", e.target.value)} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={label}>Location</label>
                <select style={{ ...selectStyle, width: "100%" }} value={form.island} onChange={e => set("island", e.target.value)}>
                  <option value="">Select…</option>
                  {LOCATIONS.map(i => <option key={i}>{i}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={label}>Organization</label>
              <input style={inputStyle} placeholder="e.g. Acme Co." value={form.org} onChange={e => set("org", e.target.value)} />
            </div>
          </Section>

          <Divider />

          {/* Segment */}
          <Section label="Segment">
            <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 2 }}>
              {SEGMENTS.map(sg => (
                <button
                  key={sg}
                  onClick={() => set("segment", sg)}
                  style={{ padding: "6px 13px", borderRadius: 99, border: "1px solid", fontSize: 12, cursor: "pointer", fontFamily: "inherit", fontWeight: form.segment === sg ? 500 : 400, borderColor: form.segment === sg ? BRAND.navy : BRAND.border, background: form.segment === sg ? BRAND.navyLight : BRAND.white, color: form.segment === sg ? BRAND.navy : BRAND.gray }}
                >
                  {sg}
                </button>
              ))}
            </div>
          </Section>

          <Divider />

          {/* Context */}
          <Section label="Context">
            <div>
              <label style={label}>What did they say / ask about?</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, minHeight: 76 }}
                placeholder="Their question, request, or what they're working on…"
                value={form.message}
                onChange={e => set("message", e.target.value)}
              />
            </div>
            <div>
              <label style={label}>Your notes (internal)</label>
              <textarea
                style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6, minHeight: 64 }}
                placeholder="Action items, urgency, relationship context…"
                value={form.notes}
                onChange={e => set("notes", e.target.value)}
              />
            </div>
          </Section>

          {error && (
            <div style={{ padding: "10px 12px", borderRadius: 6, background: "#fef2f2", color: BRAND.red, fontSize: 12, marginTop: 4, marginBottom: 8 }}>
              {error}
            </div>
          )}

          {/* Footer matches AddModal */}
          <div style={{ display: "flex", gap: 8, paddingTop: 16, borderTop: `1px solid ${BRAND.border}`, marginTop: 8 }}>
            <button
              style={{ ...btnPrimary, flex: 1, opacity: isValid() && !saving ? 1 : 0.5, cursor: isValid() && !saving ? "pointer" : "not-allowed" }}
              disabled={!isValid() || saving}
              onClick={handleSubmit}
            >
              {saving ? "Submitting…" : "Submit contact →"}
            </button>
          </div>
          <div style={{ textAlign: "center", fontSize: 11, color: BRAND.gray, marginTop: 10 }}>
            Added as a draft — not visible in the pipeline until an admin approves.
          </div>
        </div>
      </div>
    </div>
  );
}

function Req() {
  return <span style={{ color: BRAND.red }}>*</span>;
}

function Divider() {
  return <div style={{ height: 1, background: BRAND.border, margin: "4px 0 20px" }} />;
}

function Section({ label: sectionLabel, children }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ fontSize: 11, color: BRAND.gray, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
        {sectionLabel}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {children}
      </div>
    </div>
  );
}
