import { useState } from "react";
import { BRAND, STAGES, STAGE_COLORS, STAGE_BG, TIER_COLORS, TIER_BG } from "../constants/business.config";
import { pill, card } from "../constants/styles";
import { fmt$ } from "../utils/helpers";
import { logActivity } from "../hooks/useActivity";
import { toast } from "./Toast";

export default function PipelineView({ pipelineByStage, onSelectContact, updateContact }) {
  const [dragId, setDragId] = useState(null);
  const [overStage, setOverStage] = useState(null);

  function handleDragStart(e, contact) {
    setDragId(contact.id);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ id: contact.id, stage: contact.stage }));
  }

  function handleDragOver(e, stage) {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setOverStage(stage);
  }

  function handleDragLeave() {
    setOverStage(null);
  }

  // Shared move logic — used by both desktop drag-and-drop and the
  // touch-friendly stage dropdown on each card.
  function moveTo(id, oldStage, newStage) {
    if (oldStage === newStage) return;
    updateContact(id, { stage: newStage });
    logActivity(id, "stage_change", `Stage: ${oldStage} → ${newStage}`);
    toast.success(`Moved to ${newStage}`);
  }

  function handleDrop(e, newStage) {
    e.preventDefault();
    setOverStage(null);
    setDragId(null);
    try {
      const { id, stage: oldStage } = JSON.parse(e.dataTransfer.getData("text/plain"));
      moveTo(id, oldStage, newStage);
    } catch (_) {}
  }

  function handleDragEnd() {
    setDragId(null);
    setOverStage(null);
  }

  return (
    <div style={{height:"100%", overflowX:"auto"}} className="crm-pipeline-wrap">
      <div style={{display:"flex", gap:10, minWidth:960, height:"100%"}}>
        {STAGES.map(stage => {
          const cs = pipelineByStage[stage];
          const sv = cs.reduce((s, c) => s + c.value, 0);
          const isDragOver = overStage === stage;
          return (
            <div
              key={stage}
              className={`crm-pipeline-col ${isDragOver ? "drag-over" : ""}`}
              style={{flex:1, minWidth:128, display:"flex", flexDirection:"column", height:"100%", borderRadius:12, padding:4}}
              onDragOver={e => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, stage)}
            >
              <div style={{...card, marginBottom:8, padding:"10px 14px", background:STAGE_BG[stage], borderColor:`color-mix(in srgb, ${STAGE_COLORS[stage]} 27%, transparent)`, flexShrink:0}}>
                <div style={{display:"flex", justifyContent:"space-between", alignItems:"center"}}>
                  <span style={{fontSize:11, fontWeight:600, color:STAGE_COLORS[stage], textTransform:"uppercase", letterSpacing:"0.05em"}}>{stage}</span>
                  <span style={{fontSize:11, color:BRAND.gray, background:BRAND.white, borderRadius:99, padding:"2px 8px", border:`1px solid ${BRAND.border}`, fontWeight:600}}>{cs.length}</span>
                </div>
                <div style={{fontSize:11, color:BRAND.gray, marginTop:4}}>{sv > 0 ? fmt$(sv) : "—"}</div>
              </div>
              <div style={{overflowY:"auto", flex:1, paddingBottom:8}}>
                {cs.map(c => (
                  <div
                    key={c.id}
                    className={`crm-pipeline-card ${dragId === c.id ? "dragging" : ""}`}
                    draggable
                    onDragStart={e => handleDragStart(e, c)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onSelectContact(c)}
                    style={{...card, marginBottom:8, padding:"10px 14px"}}
                  >
                    <div style={{fontWeight:600, fontSize:13, color:BRAND.navy, marginBottom:2}}>{c.firstName} {c.lastName}</div>
                    <div style={{fontSize:11, color:BRAND.gray, marginBottom:7, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{c.org}</div>
                    <div style={{display:"flex", gap:4, flexWrap:"wrap", alignItems:"center"}}>
                      <span style={pill(TIER_COLORS[c.tier], TIER_BG[c.tier])}>{c.tier}</span>
                      {c.value > 0 && <span style={{fontSize:11, color:BRAND.gray, fontWeight:500}}>{fmt$(c.value)}</span>}
                    </div>
                    {/* Touch-only: move between stages without drag-and-drop
                        (native HTML5 DnD doesn't fire from touch input).
                        Hidden on mouse/pointer:fine devices via global.css. */}
                    <select
                      className="crm-pipeline-move"
                      value={stage}
                      onClick={e => e.stopPropagation()}
                      onChange={e => { e.stopPropagation(); moveTo(c.id, c.stage, e.target.value); }}
                      aria-label={`Move ${c.firstName} ${c.lastName} to another stage`}
                      style={{
                        marginTop:8, width:"100%", fontSize:11, padding:"6px 8px",
                        borderRadius:6, border:`1px solid ${BRAND.border}`,
                        background:BRAND.white, color:BRAND.gray, cursor:"pointer", outline:"none",
                      }}
                    >
                      {STAGES.map(s => <option key={s} value={s}>{s === stage ? `● ${s}` : `Move to ${s}`}</option>)}
                    </select>
                  </div>
                ))}
                {cs.length === 0 && (
                  <div style={{padding:"20px 12px", textAlign:"center", fontSize:12, color:BRAND.gray, opacity:0.6}}>
                    Drop here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
