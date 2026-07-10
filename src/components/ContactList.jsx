import { BRAND, STAGES, SEGMENTS, TIER_COLORS, TIER_BG, STAGE_COLORS, STAGE_BG, JOURNEY_TYPES, JOURNEY_TYPE_COLORS, JOURNEY_TYPE_BG, JOURNEY_TYPE_DESC } from "../constants/business.config";
import { inputStyle, selectStyle, btnPrimary, btnSecondary, pill, tag, card } from "../constants/styles";
import { initials, avatarColor } from "../utils/helpers";

export default function ContactList({
  filtered, selected, setSelected,
  search, setSearch,
  filterTier, setFilterTier,
  filterSeg, setFilterSeg,
  filterStage, setFilterStage,
  onOpenAdd, onOpenImport, generateEmail,
  checkedIds, onToggleCheck, onSelectAll, onToggleJourneyType, onBulkEdit, contacts, onOpenBulkEmail,
  hasMore, loadMore,
}) {
  const allChecked  = filtered.length > 0 && filtered.every(c => checkedIds.has(c.id));
  const someChecked = filtered.some(c => checkedIds.has(c.id));
  const anyChecked  = checkedIds.size > 0;

  // For each journey type: count of contacts and whether all are selected
  const journeyPills = JOURNEY_TYPES.map(jt => {
    const ofType = (contacts || []).filter(c => c.journeyType === jt);
    const active  = ofType.length > 0 && ofType.every(c => checkedIds.has(c.id));
    return { jt, count: ofType.length, active };
  }).filter(p => p.count > 0);

  return (
    <div style={{display:"flex", flexDirection:"column", height:"100%", overflow:"hidden"}}>

      {/* Sticky filter bar */}
      <div style={{...card, marginBottom:12, flexShrink:0}}>
        <div style={{display:"flex", gap:8, alignItems:"center", flexWrap:"wrap"}}>
          {/* Select-all checkbox */}
          <input
            type="checkbox"
            ref={el => { if (el) el.indeterminate = someChecked && !allChecked; }}
            checked={allChecked}
            onChange={e => onSelectAll(e.target.checked)}
            title={allChecked ? "Deselect all" : "Select all filtered"}
            style={{width:16, height:16, cursor:"pointer", flexShrink:0}}
          />
          <input className="crm-search-input" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, org, email… ( / )" style={{...inputStyle, flex:1, minWidth:180}}/>
          <select value={filterTier} onChange={e => setFilterTier(e.target.value)} style={selectStyle}>
            <option value="All">All Tiers</option>
            {["Hot","Warm","Cold"].map(t => <option key={t}>{t}</option>)}
          </select>
          <select value={filterSeg} onChange={e => setFilterSeg(e.target.value)} style={selectStyle}>
            <option value="All">All Segments</option>
            {SEGMENTS.map(sg => <option key={sg}>{sg}</option>)}
          </select>
          <select value={filterStage} onChange={e => setFilterStage(e.target.value)} style={selectStyle}>
            <option value="All">All Stages</option>
            {STAGES.map(st => <option key={st}>{st}</option>)}
          </select>
          <button className="crm-icon-btn" style={{...btnSecondary, color:BRAND.sand, borderColor:BRAND.sandMid}} onClick={onOpenImport}>↑ Import CSV</button>
          <button style={btnPrimary} onClick={onOpenAdd}>+ Add contact</button>
        </div>
      </div>

      {/* Journey Type quick-select pills */}
      {journeyPills.length > 0 && (
        <div style={{display:"flex", gap:6, flexWrap:"wrap", marginBottom:10, paddingLeft:2}}>
          {journeyPills.map(({ jt, count, active }) => (
            <button
              key={jt}
              onClick={() => onToggleJourneyType(jt)}
              title={JOURNEY_TYPE_DESC[jt]}
              style={{
                padding:"4px 12px", borderRadius:99, border:"1px solid", fontSize:12, cursor:"pointer",
                fontWeight: active ? 500 : 400,
                borderColor: active ? JOURNEY_TYPE_COLORS[jt] : BRAND.border,
                background:  active ? JOURNEY_TYPE_BG[jt] : BRAND.white,
                color:       active ? JOURNEY_TYPE_COLORS[jt] : BRAND.gray,
                transition:"all 0.12s",
              }}
            >
              {jt} <span style={{opacity:0.65}}>({count})</span>
            </button>
          ))}
        </div>
      )}

      {/* Scrollable contact list */}
      <div style={{overflowY:"auto", flex:1}}>
        <div style={{fontSize:12, color:BRAND.gray, marginBottom:8, paddingLeft:2}}>
          {filtered.length} contact{filtered.length !== 1 ? "s" : ""} shown
          {anyChecked && <span style={{color:BRAND.navy, fontWeight:500, marginLeft:6}}>· {checkedIds.size} selected</span>}
        </div>

        {filtered.map(c => (
          <div
            key={c.id}
            className={`crm-card${selected?.id === c.id ? " active" : ""}`}
            onClick={() => setSelected(selected?.id === c.id ? null : c)}
            style={{...card, marginBottom:8, display:"flex", gap:10, alignItems:"flex-start"}}
          >
            {/* Checkbox + avatar */}
            <div style={{display:"flex", alignItems:"center", gap:8, flexShrink:0, paddingTop:1}}>
              <input
                type="checkbox"
                className="contact-check"
                checked={checkedIds.has(c.id)}
                onChange={e => { e.stopPropagation(); onToggleCheck(c.id); }}
                onClick={e => e.stopPropagation()}
                style={{
                  width:16, height:16, cursor:"pointer", flexShrink:0,
                  opacity: 1,
                }}
              />
              <div style={{width:36, height:36, borderRadius:"50%", background:avatarColor(c.id), display:"flex", alignItems:"center", justifyContent:"center", color:BRAND.white, fontWeight:500, fontSize:13, flexShrink:0}}>
                {initials(c.firstName, c.lastName)}
              </div>
            </div>

            <div style={{flex:1, minWidth:0}}>
              <div style={{display:"flex", justifyContent:"space-between", flexWrap:"wrap", gap:4}}>
                <span style={{fontWeight:500, fontSize:14, color:BRAND.black}}>{c.firstName} {c.lastName}</span>
                <span style={{fontSize:12, color:BRAND.gray}}>{c.createdOn}</span>
              </div>
              <div style={{fontSize:13, color:BRAND.gray, marginTop:1}}>{c.org}{c.island ? " · " + c.island : ""}</div>
              {c.message && (
                <div style={{fontSize:12, color:BRAND.gray, marginTop:4, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap", maxWidth:420, opacity:0.85}}>{c.message}</div>
              )}
              <div style={{display:"flex", gap:5, marginTop:7, flexWrap:"wrap"}}>
                <span style={pill(TIER_COLORS[c.tier], TIER_BG[c.tier])}>{c.tier}</span>
                <span style={pill(STAGE_COLORS[c.stage], STAGE_BG[c.stage])}>{c.stage}</span>
                <span style={tag}>{c.segment}</span>
                {c.journeyType && (
                  <span style={pill(JOURNEY_TYPE_COLORS[c.journeyType], JOURNEY_TYPE_BG[c.journeyType])}>{c.journeyType}</span>
                )}
                {c.tags?.slice(0,2).map(t => <span key={t} style={tag}>{t}</span>)}
                {c.emailHistory?.length > 0 && (
                  <span style={{...tag, background:BRAND.greenLight, color:BRAND.green, borderColor:`color-mix(in srgb, ${BRAND.green} 20%, transparent)`}}>
                    ✉ {c.emailHistory.length}
                  </span>
                )}
              </div>
            </div>
            <button
              className="crm-icon-btn"
              onClick={e => { e.stopPropagation(); generateEmail(c); }}
              style={{...btnSecondary, padding:"5px 10px", fontSize:12, flexShrink:0, color:BRAND.sand, borderColor:BRAND.sandMid}}
            >
              ✉
            </button>
          </div>
        ))}

        {filtered.length === 0 && (
          <div style={{...card, textAlign:"center", color:BRAND.gray, fontSize:13, padding:40}}>
            No contacts match your filters.
          </div>
        )}

        {hasMore && (
          <div style={{textAlign:"center", padding:"12px 0"}}>
            <button style={{...btnSecondary, fontSize:12}} onClick={loadMore}>Load more contacts…</button>
          </div>
        )}

        <div style={{height: anyChecked ? 72 : 16}}/>
      </div>

      {/* Bulk action bar */}
      {anyChecked && (
        <div style={{
          flexShrink:0, background:BRAND.navy, borderRadius:10,
          padding:"10px 14px", display:"flex", gap:8, alignItems:"center",
          boxShadow:"0 -4px 16px rgba(43,43,43,0.18)",
        }}>
          <span style={{fontSize:13, color:BRAND.white, fontWeight:500, flexShrink:0}}>
            {checkedIds.size} selected
          </span>
          <div style={{display:"flex", gap:5, flex:1, flexWrap:"wrap"}}>
            {JOURNEY_TYPES.map(jt => {
              const ofType = (contacts || []).filter(c => c.journeyType === jt);
              if (!ofType.length) return null;
              const active = ofType.every(c => checkedIds.has(c.id));
              return (
                <button
                  key={jt}
                  onClick={() => onToggleJourneyType(jt)}
                  style={{
                    padding:"3px 11px", borderRadius:99, border:"1px solid", fontSize:12, cursor:"pointer",
                    fontWeight: active ? 500 : 400,
                    borderColor: active ? JOURNEY_TYPE_COLORS[jt] : "rgba(255,255,255,0.3)",
                    background:  active ? JOURNEY_TYPE_BG[jt] : "transparent",
                    color:       active ? JOURNEY_TYPE_COLORS[jt] : BRAND.white,
                  }}
                >
                  {jt}
                </button>
              );
            })}
          </div>
          {[
            { label:"Set Tier…",    field:"tier",        options:["Hot","Warm","Cold"] },
            { label:"Set Stage…",   field:"stage",       options:STAGES },
            { label:"Set Journey…", field:"journeyType", options:JOURNEY_TYPES },
          ].map(({ label, field, options }) => (
            <select
              key={field}
              value=""
              onChange={e => { onBulkEdit(field, e.target.value); e.target.value = ""; }}
              style={{
                padding:"4px 8px", borderRadius:6, fontSize:12, cursor:"pointer", flexShrink:0,
                border:"1px solid rgba(255,255,255,0.3)", background:"rgba(255,255,255,0.12)",
                color:BRAND.white, outline:"none",
              }}
            >
              <option value="" disabled style={{color:BRAND.black}}>{label}</option>
              {options.map(o => <option key={o} value={o} style={{color:BRAND.black}}>{o}</option>)}
            </select>
          ))}
          <button
            style={{...btnPrimary, background:BRAND.sand, flexShrink:0, fontSize:13}}
            onClick={onOpenBulkEmail}
          >
            ✉ Send Bulk Email
          </button>
          <button
            style={{...btnSecondary, fontSize:12, flexShrink:0, padding:"5px 10px"}}
            onClick={() => onSelectAll(false)}
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
}
