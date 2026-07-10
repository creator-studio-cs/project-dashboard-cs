import { useState } from "react";
import { BRAND, JOURNEY_TYPES, JOURNEY_TYPE_COLORS, JOURNEY_TYPE_BG, JOURNEY_TYPE_DESC, JOURNEY_TEMPLATES, BUSINESS } from "../constants/business.config";
import { inputStyle, btnPrimary, btnSecondary, label } from "../constants/styles";

export default function EmailModal({ emailContact, emailDraft, setEmailDraft, emailLoading, onClose, generateEmail, onMarkSent, onUpdateContact }) {
  const [sending, setSending]           = useState(false);
  const [sendFeedback, setSendFeedback] = useState(null);
  const [activeJourney, setActiveJourney] = useState(null);
  const [journeyLoading, setJourneyLoading] = useState(false);

  async function loadJourneyTemplate(jt) {
    if (journeyLoading) return;
    setActiveJourney(jt);
    setJourneyLoading(true);
    const tmpl = JOURNEY_TEMPLATES[jt];
    const personalizedBody = tmpl.body.replace(/\{firstName\}/g, emailContact?.firstName || "there");
    setEmailDraft({ subject: tmpl.subject, body: personalizedBody });
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `You are writing on behalf of ${BUSINESS.fromName} at ${BUSINESS.name}. ${BUSINESS.tagline}\n\nContact: ${emailContact?.firstName} ${emailContact?.lastName}, ${emailContact?.org}\nJourney type: ${jt} — ${JOURNEY_TYPE_DESC[jt]}\n\nImprove this draft to feel personal and specific to this contact. Keep it under 120 words. Plain text only. No subject line.\n\nDraft:\n${personalizedBody}`,
          }],
        }),
      });
      const data = await res.json();
      const aiBody = data.content?.find(b => b.type === "text")?.text;
      if (aiBody) setEmailDraft(d => ({ ...d, body: aiBody }));
    } catch (e) {}
    setJourneyLoading(false);
  }

  async function handleMarkSent() {
    setSending(true);
    setSendFeedback(null);
    const result = await onMarkSent(emailDraft.subject, emailDraft.body);
    setSendFeedback(result);
    setSending(false);
  }

  return (
    <div
      className="crm-modal-backdrop" style={{position:"absolute", top:0, left:0, right:0, bottom:0, minHeight:"100%", background:"rgba(20,20,20,0.6)", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:200, padding:"32px 16px"}}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{width:560, maxWidth:"95%", background:BRAND.white, border:`1px solid ${BRAND.border}`, borderRadius:12, padding:"22px 24px", boxShadow:"0 12px 48px rgba(0,0,0,0.2)"}}>
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16}}>
          <div>
            <div style={{fontWeight:500, fontSize:15, color:BRAND.navy}}>✉ Draft reply</div>
            <div style={{fontSize:12, color:BRAND.gray, marginTop:2}}>To: {emailContact?.firstName} {emailContact?.lastName} · {emailContact?.email}</div>
            <div style={{display:"flex", gap:5, marginTop:8, flexWrap:"wrap", alignItems:"center"}}>
              {JOURNEY_TYPES.map(jt => {
                const active = activeJourney === jt;
                return (
                  <button
                    key={jt}
                    onClick={() => loadJourneyTemplate(jt)}
                    disabled={journeyLoading}
                    style={{
                      padding:"3px 10px", borderRadius:99, border:"1px solid", fontSize:11,
                      cursor: journeyLoading ? "default" : "pointer",
                      fontWeight: active ? 500 : 400,
                      borderColor: active ? JOURNEY_TYPE_COLORS[jt] : BRAND.border,
                      background:  active ? JOURNEY_TYPE_BG[jt] : BRAND.white,
                      color:       active ? JOURNEY_TYPE_COLORS[jt] : BRAND.gray,
                      opacity: journeyLoading && !active ? 0.5 : 1,
                    }}
                  >
                    {jt}
                  </button>
                );
              })}
              {journeyLoading && (
                <div style={{width:14, height:14, borderRadius:"50%", border:`2px solid ${BRAND.navyLight}`, borderTopColor:BRAND.navy, animation:"spin 0.8s linear infinite", flexShrink:0}}/>
              )}
            </div>
          </div>
          <button onClick={onClose} style={{...btnSecondary, padding:"3px 10px", fontSize:12}}>✕</button>
        </div>

        {emailLoading ? (
          <div style={{textAlign:"center", padding:"48px 0", color:BRAND.gray, fontSize:13}}>
            <div style={{width:32, height:32, borderRadius:"50%", border:`2px solid ${BRAND.navyLight}`, borderTopColor:BRAND.navy, animation:"spin 0.8s linear infinite", margin:"0 auto 12px"}}/>
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            <div>Drafting personalized email…</div>
          </div>
        ) : (
          <>
            <div style={{marginBottom:12}}>
              <div style={label}>Subject</div>
              <input value={emailDraft.subject} onChange={e => setEmailDraft(d => ({...d, subject: e.target.value}))} style={inputStyle}/>
            </div>
            <div style={{marginBottom:16}}>
              <div style={label}>Body</div>
              <textarea value={emailDraft.body} onChange={e => setEmailDraft(d => ({...d, body: e.target.value}))} rows={14} style={{...inputStyle, resize:"vertical", lineHeight:1.65}}/>
            </div>
            <div style={{display:"flex", gap:8, marginBottom:8}}>
              <button
                style={{...btnPrimary, flex:1}}
                onClick={() => { navigator.clipboard?.writeText("Subject: " + emailDraft.subject + "\n\n" + emailDraft.body); alert("Copied!"); }}
              >
                Copy
              </button>
              <button
                style={{...btnPrimary, flex:1, background:BRAND.sand}}
                onClick={() => { window.open("mailto:" + emailContact?.email + "?subject=" + encodeURIComponent(emailDraft.subject) + "&body=" + encodeURIComponent(emailDraft.body)); }}
              >
                Open in Mail
              </button>
              <button style={btnSecondary} onClick={() => generateEmail(emailContact)}>↺ Regenerate</button>
            </div>
            <button
              style={{
                ...btnPrimary, width:"100%",
                background: sendFeedback?.success ? BRAND.green : sending ? BRAND.gray : BRAND.navy,
                opacity: sending ? 0.75 : 1,
              }}
              onClick={handleMarkSent}
              disabled={sending || !!sendFeedback?.success}
            >
              {sending
                ? "Marking sent…"
                : sendFeedback?.success
                  ? "✓ Marked as sent"
                  : sendFeedback?.error
                    ? `✕ ${sendFeedback.error}`
                    : "Mark as sent"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
