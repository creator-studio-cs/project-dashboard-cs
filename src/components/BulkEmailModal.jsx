import { useState, useEffect } from "react";
import { BRAND, JOURNEY_TYPES, JOURNEY_TYPE_DESC, JOURNEY_TEMPLATES, BUSINESS } from "../constants/business.config";
import { inputStyle, btnPrimary, btnSecondary, label } from "../constants/styles";
import { logActivity } from "../hooks/useActivity";

// No bulk email provider is wired up by default — this logs the send against
// each contact's history and gives you a CSV export (name, email, personalized
// body) to paste into whatever tool you actually send through. Wire up a real
// provider later if you want one-click sending.

export default function BulkEmailModal({ selectedContacts, updateContact, onClose, onDone }) {
  const [journeyType, setJourneyType] = useState(JOURNEY_TYPES[0]);
  const [draft, setDraft]             = useState(JOURNEY_TEMPLATES[JOURNEY_TYPES[0]]);
  const [generating, setGenerating]   = useState(false);
  const [stage, setStage]             = useState("compose"); // compose | done

  useEffect(() => { loadTemplate(journeyType); }, [journeyType]);

  async function loadTemplate(jt) {
    setDraft(JOURNEY_TEMPLATES[jt]);
    setGenerating(true);
    try {
      // NOTE: calls api.anthropic.com directly with no key — only works
      // inside Claude's Artifact preview. Route through your own backend
      // with a server-side key before deploying this standalone.
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 500,
          messages: [{
            role: "user",
            content: `You are writing a bulk outreach email for ${BUSINESS.fromName} at ${BUSINESS.name}. ${BUSINESS.tagline}\n\nJourney type: ${jt}\nContext: ${JOURNEY_TYPE_DESC[jt]}\n\nWrite a short, warm email (under 120 words). Use {firstName} as the greeting placeholder. Sign off as ${BUSINESS.fromName}, ${BUSINESS.name} | ${BUSINESS.website}. No markdown. Plain text only. Do not include the subject line.`,
          }],
        }),
      });
      const data = await res.json();
      const aiBody = data.content?.find(b => b.type === "text")?.text;
      if (aiBody) setDraft(d => ({ ...d, body: aiBody }));
    } catch (e) {}
    setGenerating(false);
  }

  function personalize(body, contact) {
    return body.replace(/\{firstName\}/g, contact.firstName || "there");
  }

  function downloadCSV() {
    const rows = [["First Name", "Last Name", "Email", "Subject", "Body"]];
    selectedContacts.forEach(c => {
      rows.push([c.firstName, c.lastName, c.email, draft.subject, personalize(draft.body, c)]);
    });
    const csv = rows.map(r => r.map(v => `"${String(v || "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${journeyType.toLowerCase().replace(/\s+/g, "-")}-outreach.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleLogAsSent() {
    const now = new Date();
    const monthYear = now.toLocaleDateString("en-US", { month: "long", year: "numeric" });
    const bulkId    = `bulk-${journeyType}-${Date.now()}`;
    const bulkLabel = `${journeyType} Outreach — ${monthYear}`;

    await Promise.all(selectedContacts.map(contact => {
      logActivity(contact.id, "email", `Sent (bulk): ${draft.subject}`);
      return updateContact(contact.id, {
        emailHistory: [
          ...(contact.emailHistory || []),
          {
            campaignId: bulkId,
            subject:    draft.subject,
            sentAt:     now.toISOString(),
            opened:     null,
            clicked:    null,
            bulkId,
            bulkLabel,
            journeyType,
          },
        ],
      });
    }));
    setStage("done");
  }

  const total = selectedContacts.length;

  return (
    <div
      className="crm-modal-backdrop" style={{position:"absolute", top:0, left:0, right:0, bottom:0, minHeight:"100%", background:"rgba(20,20,20,0.6)", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:200, padding:"32px 16px"}}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{width:600, maxWidth:"95%", background:BRAND.white, border:`1px solid ${BRAND.border}`, borderRadius:12, padding:"22px 24px", boxShadow:"0 12px 48px rgba(0,0,0,0.2)"}}>

        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:16}}>
          <div>
            <div style={{fontWeight:500, fontSize:15, color:BRAND.navy}}>Bulk Email — {total} contact{total !== 1 ? "s" : ""}</div>
            <div style={{fontSize:12, color:BRAND.gray, marginTop:2}}>
              Export a personalized CSV to send through your own email tool
            </div>
          </div>
          <button onClick={onClose} style={{...btnSecondary, padding:"3px 10px", fontSize:12}}>✕</button>
        </div>

        {stage === "compose" && (
          <>
            <div style={{marginBottom:14}}>
              <div style={label}>Journey Type</div>
              <div style={{display:"flex", gap:6, marginTop:4, flexWrap:"wrap"}}>
                {JOURNEY_TYPES.map(jt => (
                  <button
                    key={jt}
                    onClick={() => setJourneyType(jt)}
                    style={{
                      padding:"6px 14px", borderRadius:99, border:"1px solid", fontSize:12, cursor:"pointer",
                      fontWeight: journeyType === jt ? 500 : 400,
                      borderColor: journeyType === jt ? BRAND.navy : BRAND.border,
                      background:  journeyType === jt ? BRAND.navyLight : BRAND.white,
                      color:       journeyType === jt ? BRAND.navy : BRAND.gray,
                    }}
                  >
                    {jt}
                  </button>
                ))}
              </div>
              <div style={{fontSize:11, color:BRAND.gray, marginTop:5}}>{JOURNEY_TYPE_DESC[journeyType]}</div>
            </div>

            {generating ? (
              <div style={{textAlign:"center", padding:"36px 0", color:BRAND.gray, fontSize:13}}>
                <div style={{width:28, height:28, borderRadius:"50%", border:`2px solid ${BRAND.navyLight}`, borderTopColor:BRAND.navy, animation:"spin 0.8s linear infinite", margin:"0 auto 10px"}}/>
                <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                Generating email…
              </div>
            ) : (
              <>
                <div style={{marginBottom:10}}>
                  <div style={label}>Subject</div>
                  <input value={draft.subject} onChange={e => setDraft(d => ({...d, subject: e.target.value}))} style={inputStyle}/>
                </div>
                <div style={{marginBottom:12}}>
                  <div style={label}>Body — use {"{firstName}"} for the first name</div>
                  <textarea value={draft.body} onChange={e => setDraft(d => ({...d, body: e.target.value}))} rows={11} style={{...inputStyle, resize:"vertical", lineHeight:1.65}}/>
                </div>
                <div style={{marginBottom:14, padding:"10px 12px", background:BRAND.sandLight, borderRadius:8, fontSize:12, color:BRAND.gray, border:`1px solid ${BRAND.sandMid}`}}>
                  <strong style={{color:BRAND.navy}}>"{draft.subject}"</strong> personalized for{" "}
                  <strong style={{color:BRAND.navy}}>{total} contact{total !== 1 ? "s" : ""}</strong>. Export as CSV to send through your email tool, then log it here so it shows up in each contact's history.
                </div>
                <div style={{display:"flex", gap:8}}>
                  <button style={{...btnSecondary, fontSize:12}} onClick={() => loadTemplate(journeyType)}>↺ Regenerate</button>
                  <button
                    style={{...btnSecondary, flex:1}}
                    onClick={downloadCSV}
                    disabled={!draft.subject.trim() || !draft.body.trim()}
                  >
                    ⬇ Export CSV
                  </button>
                  <button
                    style={{...btnPrimary, flex:1}}
                    onClick={handleLogAsSent}
                    disabled={!draft.subject.trim() || !draft.body.trim()}
                  >
                    Log as sent to {total}
                  </button>
                </div>
              </>
            )}
          </>
        )}

        {stage === "done" && (
          <div style={{textAlign:"center", padding:"24px 0"}}>
            <div style={{fontSize:32, marginBottom:12, color:BRAND.green}}>✓</div>
            <div style={{fontSize:18, fontWeight:500, color:BRAND.navy, marginBottom:4}}>
              Logged for {total} contact{total !== 1 ? "s" : ""}
            </div>
            <div style={{fontSize:13, color:BRAND.gray, marginBottom:16}}>
              Don't forget to actually send it through your email tool if you haven't yet.
            </div>
            <button style={{...btnPrimary}} onClick={() => { onDone(); onClose(); }}>
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
