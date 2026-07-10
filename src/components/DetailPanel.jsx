import { useState, useEffect } from "react";
import { BRAND, STAGES, TIER_COLORS, TIER_BG, STAGE_COLORS, STAGE_BG, DEAL_TYPES, QUOTE_STATUSES, QUOTE_STATUS_COLORS, QUOTE_STATUS_BG, JOURNEY_TYPES, JOURNEY_TYPE_COLORS, JOURNEY_TYPE_BG, JOURNEY_TYPE_DESC, LOCATIONS } from "../constants/business.config";
import { inputStyle, selectStyle, btnPrimary, btnSecondary, pill, tag, label } from "../constants/styles";
import { initials, avatarColor, fmt$ } from "../utils/helpers";
import PricingCalculator from "./PricingCalculator";
import TaskList from "./TaskList";
import FileAttachments from "./FileAttachments";
import ActivityTimeline from "./ActivityTimeline";
import CustomFieldsSection from "./CustomFieldsSection";
import { useTasks } from "../hooks/useTasks";
import { logActivity } from "../hooks/useActivity";

export default function DetailPanel({ c, onClose, updateContact, generateEmail, deleteContact, fieldDefs = [] }) {
  const [showCalc, setShowCalc] = useState(false);
  const [scopeNotes, setScopeNotes] = useState(c.scopeNotes || "");
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState({});
  const { tasks, addTask, toggleTask, deleteTask } = useTasks(c.id);

  const startEdit = () => {
    setDraft({
      firstName: c.firstName || "",
      lastName:  c.lastName  || "",
      org:       c.org       || "",
      email:     c.email     || "",
      phone:     c.phone     || "",
      island:    c.island    || "",
      source:    c.source    || "",
    });
    setEditing(true);
  };

  const saveEdit = () => {
    updateContact(c.id, draft);
    setEditing(false);
  };

  useEffect(() => {
    setScopeNotes(c.scopeNotes || "");
  }, [c.id]);

  const valueLabel = "Deal Value";
  const valueAmt   = c.value || 0;

  const qs = c.quoteStatus || "No Quote Sent";

  return (
    <div style={{padding:"20px", minHeight:"100%", boxSizing:"border-box"}}>
      {/* Header */}
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14}}>
        <div style={{display:"flex", gap:10, alignItems:"center"}}>
          <div style={{width:40, height:40, borderRadius:"50%", background:avatarColor(c.id), display:"flex", alignItems:"center", justifyContent:"center", color:BRAND.white, fontWeight:500, fontSize:14, flexShrink:0}}>
            {initials(c.firstName, c.lastName)}
          </div>
          <div>
            <div style={{fontWeight:500, fontSize:14, color:BRAND.black}}>{c.firstName} {c.lastName}</div>
            <div style={{fontSize:12, color:BRAND.gray, marginTop:1}}>{c.org}</div>
          </div>
        </div>
        <div style={{display:"flex", gap:5}}>
          {!editing && (
            <button onClick={startEdit} style={{...btnSecondary, padding:"3px 9px", fontSize:12}}>Edit</button>
          )}
          <button onClick={onClose} style={{...btnSecondary, padding:"3px 9px", fontSize:12}}>✕</button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{background:BRAND.sandLight, borderRadius:8, padding:"12px 14px", marginBottom:14, border:`1px solid ${BRAND.border}`}}>
          <div style={{fontSize:11, fontWeight:500, color:BRAND.navy, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:10}}>Edit Contact</div>
          <div style={{display:"flex", gap:8, marginBottom:8}}>
            <div style={{flex:1}}>
              <div style={label}>First Name</div>
              <input value={draft.firstName} onChange={e => setDraft(d => ({...d, firstName: e.target.value}))} style={inputStyle} />
            </div>
            <div style={{flex:1}}>
              <div style={label}>Last Name</div>
              <input value={draft.lastName} onChange={e => setDraft(d => ({...d, lastName: e.target.value}))} style={inputStyle} />
            </div>
          </div>
          <div style={{marginBottom:8}}>
            <div style={label}>Organization</div>
            <input value={draft.org} onChange={e => setDraft(d => ({...d, org: e.target.value}))} style={inputStyle} />
          </div>
          <div style={{marginBottom:8}}>
            <div style={label}>Email</div>
            <input type="email" value={draft.email} onChange={e => setDraft(d => ({...d, email: e.target.value}))} style={inputStyle} />
          </div>
          <div style={{marginBottom:8}}>
            <div style={label}>Phone</div>
            <input type="tel" value={draft.phone} onChange={e => setDraft(d => ({...d, phone: e.target.value}))} style={inputStyle} />
          </div>
          <div style={{display:"flex", gap:8, marginBottom:12}}>
            <div style={{flex:1}}>
              <div style={label}>Location</div>
              <select value={draft.island} onChange={e => setDraft(d => ({...d, island: e.target.value}))} style={{...selectStyle, width:"100%"}}>
                <option value="">—</option>
                {LOCATIONS.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <div style={{flex:1}}>
              <div style={label}>Source</div>
              <input value={draft.source} onChange={e => setDraft(d => ({...d, source: e.target.value}))} style={inputStyle} />
            </div>
          </div>
          <div style={{display:"flex", gap:6}}>
            <button onClick={saveEdit} style={{...btnPrimary, flex:1}}>Save</button>
            <button onClick={() => setEditing(false)} style={{...btnSecondary, flex:1}}>Cancel</button>
          </div>
        </div>
      )}

      <div style={{display:"flex", gap:5, flexWrap:"wrap", marginBottom:12}}>
        <span style={pill(TIER_COLORS[c.tier], TIER_BG[c.tier])}>{c.tier}</span>
        <span style={pill(STAGE_COLORS[c.stage], STAGE_BG[c.stage])}>{c.stage}</span>
        <span style={tag}>{c.segment}</span>
        <span style={pill(QUOTE_STATUS_COLORS[qs], QUOTE_STATUS_BG[qs])}>{qs}</span>
      </div>

      {/* Info rows */}
      <div style={{borderTop:`1px solid ${BRAND.border}`, paddingTop:12, marginBottom:12}}>
        {[
          ["Location",    c.island||"—"],
          [valueLabel,    fmt$(valueAmt)],
          ["Date",        c.createdOn||"—"],
          ["Source",      c.source||"—"],
          ["Email",       c.email||"—"],
          ["Phone",       c.phone||"—"],
        ].map(([k, v]) => (
          <div key={k} style={{display:"flex", justifyContent:"space-between", fontSize:13, marginBottom:7}}>
            <span style={{color:BRAND.gray}}>{k}</span>
            <span style={{color:BRAND.black, textAlign:"right", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:"60%"}}>{v}</span>
          </div>
        ))}
      </div>

      {/* Journey Type selector */}
      <div style={{marginBottom:12}}>
        <div style={label}>Journey Type</div>
        <div style={{display:"flex", gap:5, flexWrap:"wrap", marginTop:4}}>
          {JOURNEY_TYPES.map(jt => {
            const active = c.journeyType === jt;
            return (
              <button
                key={jt}
                onClick={() => {
                  const next = active ? null : jt;
                  updateContact(c.id, { journeyType: next });
                  logActivity(c.id, "journey_change", next ? `Journey type set to ${next}` : "Journey type cleared");
                }}
                title={JOURNEY_TYPE_DESC[jt]}
                style={{
                  padding:"4px 12px", borderRadius:99, border:"1px solid", fontSize:12, cursor:"pointer",
                  fontWeight: active ? 500 : 400,
                  borderColor: active ? JOURNEY_TYPE_COLORS[jt] : BRAND.border,
                  background:  active ? JOURNEY_TYPE_BG[jt] : BRAND.white,
                  color:       active ? JOURNEY_TYPE_COLORS[jt] : BRAND.gray,
                }}
              >
                {jt}
              </button>
            );
          })}
        </div>
        {c.journeyType && (
          <div style={{fontSize:11, color:BRAND.gray, marginTop:4}}>{JOURNEY_TYPE_DESC[c.journeyType]}</div>
        )}
      </div>

      {/* Revenue Type toggle */}
      <div style={{marginBottom:12}}>
        <div style={label}>Deal Type</div>
        <div style={{display:"flex", gap:6, marginTop:4}}>
          {DEAL_TYPES.map(rt => {
            const active = c.revenueType === rt;
            return (
              <button
                key={rt}
                onClick={() => {
                  const next = active ? null : rt;
                  updateContact(c.id, { revenueType: next });
                  logActivity(c.id, "deal_type_change", next ? `Deal type set to ${next}` : "Deal type cleared");
                }}
                style={{
                  padding:"5px 12px", borderRadius:99, border:"1px solid", fontSize:12, cursor:"pointer",
                  fontWeight: active ? 500 : 400,
                  borderColor: active ? BRAND.navy : BRAND.border,
                  background:  active ? BRAND.navyLight : BRAND.white,
                  color:       active ? BRAND.navy : BRAND.gray,
                }}
              >
                {rt}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tasks */}
      <div style={{marginBottom:12}}>
        <div style={label}>Tasks</div>
        <TaskList tasks={tasks} addTask={addTask} toggleTask={toggleTask} deleteTask={deleteTask} contactId={c.id} />
      </div>

      {/* Files */}
      <div style={{marginBottom:12}}>
        <div style={label}>Files</div>
        <FileAttachments contact={c} updateContact={updateContact} />
      </div>

      {/* Custom fields (business-specific, defined via the ⚙ settings button) */}
      {fieldDefs.length > 0 && (
        <div style={{marginBottom:12}}>
          <CustomFieldsSection
            fieldDefs={fieldDefs}
            values={c.customFields}
            onChange={(key, val) => updateContact(c.id, { customFields: { ...(c.customFields || {}), [key]: val } })}
          />
        </div>
      )}

      {/* Quote / proposal tracking */}
      <div style={{background:BRAND.navyLight, borderRadius:8, padding:"12px 14px", marginBottom:12, border:`1px solid color-mix(in srgb, ${BRAND.navy} 13%, transparent)`}}>
        <div style={{fontSize:11, fontWeight:500, color:BRAND.navy, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:12}}>Quote / Proposal</div>

        <div style={{marginBottom:10}}>
          <div style={label}>Quote Status</div>
          <select
            value={qs}
            onChange={e => { updateContact(c.id, { quoteStatus: e.target.value }); logActivity(c.id, "quote_status_change", `Quote status set to ${e.target.value}`); }}
            style={{...selectStyle, width:"100%"}}
          >
            {QUOTE_STATUSES.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>

        <div>
          <div style={label}>Scope Notes</div>
          <textarea
            value={scopeNotes}
            onChange={e => setScopeNotes(e.target.value)}
            onBlur={() => { if (scopeNotes !== (c.scopeNotes || "")) updateContact(c.id, { scopeNotes }); }}
            rows={3}
            placeholder="Project scope, deliverables, timeline…"
            style={{...inputStyle, resize:"vertical", lineHeight:1.6}}
          />
        </div>
      </div>

      {/* Original message */}
      {c.message && (
        <div style={{marginBottom:12}}>
          <div style={{fontSize:11, color:BRAND.gray, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:4}}>Original message</div>
          <div style={{fontSize:12, color:BRAND.gray, lineHeight:1.6, background:BRAND.sandLight, borderRadius:6, padding:"8px 10px", maxHeight:90, overflowY:"auto"}}>{c.message}</div>
        </div>
      )}

      <div style={{marginBottom:10}}>
        <div style={label}>Stage</div>
        <select value={c.stage} onChange={e => { updateContact(c.id, {stage: e.target.value}); logActivity(c.id, "stage_change", `Stage: ${c.stage} → ${e.target.value}`); }} style={{...selectStyle, width:"100%"}}>
          {STAGES.map(st => <option key={st}>{st}</option>)}
        </select>
      </div>

      <div style={{marginBottom:12}}>
        <div style={label}>Tier</div>
        <select value={c.tier} onChange={e => { updateContact(c.id, {tier: e.target.value}); logActivity(c.id, "tier_change", `Tier: ${c.tier} → ${e.target.value}`); }} style={{...selectStyle, width:"100%"}}>
          {["Hot","Warm","Cold"].map(t => <option key={t}>{t}</option>)}
        </select>
      </div>

      {c.tags?.length > 0 && (
        <div style={{display:"flex", gap:4, flexWrap:"wrap", marginBottom:12}}>
          {c.tags.map(t => <span key={t} style={tag}>{t}</span>)}
        </div>
      )}

      {c.notes && (
        <div style={{marginBottom:12}}>
          <div style={label}>Original notes <span style={{fontWeight:400, textTransform:"none", letterSpacing:0}}>(imported/legacy)</span></div>
          <div style={{fontSize:12, color:BRAND.gray, lineHeight:1.6, whiteSpace:"pre-wrap"}}>{c.notes}</div>
        </div>
      )}

      {/* Pricing calculator */}
      <div style={{marginBottom:12}}>
          <button
            onClick={() => setShowCalc(s => !s)}
            style={{...btnSecondary, width:"100%", fontSize:12, textAlign:"left", display:"flex", justifyContent:"space-between"}}
          >
            <span>⊕ Estimate deal value</span>
            <span style={{color:BRAND.gray}}>{showCalc ? "▲" : "▼"}</span>
          </button>
          {showCalc && (
            <div style={{marginTop:8}}>
              <PricingCalculator
                currentValue={c.value}
                onApply={val => updateContact(c.id, {value: val})}
              />
            </div>
          )}
        </div>

      {/* Activity — unified notes, emails, and field-change feed */}
      <div style={{marginBottom:12}}>
        <div style={label}>Activity</div>
        <ActivityTimeline contactId={c.id} />
      </div>

      <button style={{...btnPrimary, width:"100%", marginBottom:6, background:BRAND.sand}} onClick={() => generateEmail(c)}>
        ✉ Draft reply email
      </button>
      <button onClick={() => deleteContact(c)} style={{...btnSecondary, width:"100%", fontSize:12, color:BRAND.red, borderColor:`color-mix(in srgb, ${BRAND.red} 27%, transparent)`}}>
        Remove contact
      </button>
    </div>
  );
}
