import { useState, useMemo, useRef } from "react";
import { BRAND, SEGMENTS, STAGES, DEFAULT_INTAKE_SEGMENT } from "../constants/business.config";
import { inputStyle, selectStyle, btnPrimary, btnSecondary, label, card } from "../constants/styles";

// Maps CSV column headers → contact field names
const FIELD_ALIASES = {
  firstName: ["first name", "first_name", "firstname", "given name"],
  lastName:  ["last name",  "last_name",  "lastname",  "surname", "family name"],
  name:      ["name", "full name", "full_name", "your name", "contact name"],
  email:     ["email", "email address", "e-mail", "your email"],
  phone:     ["phone", "phone number", "telephone", "mobile", "cell"],
  org:       ["organization", "org", "company", "business", "affiliation", "employer"],
  message:   ["message", "inquiry", "comments", "how can we help", "your message", "question", "inquiry message"],
  island:    ["island", "which island", "island/region", "location"],
};

function detectField(header) {
  const h = header.toLowerCase().trim();
  for (const [field, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.some(a => h === a || h.includes(a))) return field;
  }
  return null;
}

function parseCSV(text) {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").trim().split("\n");
  if (lines.length < 2) return { headers: [], rows: [] };

  function parseLine(line) {
    const result = [];
    let cur = "", inQuote = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && !inQuote)             { inQuote = true; }
      else if (ch === '"' && inQuote)         { if (line[i+1] === '"') { cur += '"'; i++; } else { inQuote = false; } }
      else if (ch === "," && !inQuote)        { result.push(cur); cur = ""; }
      else                                    { cur += ch; }
    }
    result.push(cur);
    return result;
  }

  const headers = parseLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).filter(l => l.trim()).map(l => {
    const vals = parseLine(l);
    const row = {};
    headers.forEach((h, i) => { row[h] = (vals[i] || "").trim(); });
    return row;
  });
  return { headers, rows };
}

function buildMapping(headers) {
  const mapping = {};
  headers.forEach(h => {
    const field = detectField(h);
    if (field && !mapping[field]) mapping[field] = h;
  });
  return mapping;
}

function rowToContact(row, mapping, defaults) {
  const get = field => (mapping[field] ? (row[mapping[field]] || "").trim() : "");

  let firstName = get("firstName");
  let lastName  = get("lastName");
  if (!firstName && mapping.name) {
    const parts = (row[mapping.name] || "").trim().split(/\s+/);
    firstName = parts[0] || "";
    lastName  = parts.slice(1).join(" ");
  }

  return {
    firstName,
    lastName,
    email:    get("email").toLowerCase(),
    phone:    get("phone"),
    org:      get("org"),
    message:  get("message"),
    island:   get("island"),
    notes:    "",
    value:    0,
    tags:     [],
    segment:  defaults.segment,
    tier:     defaults.tier,
    stage:    defaults.stage,
    source:   defaults.source || "CSV Import",
    createdOn: new Date().toLocaleDateString("en-US", { month:"long", day:"numeric", year:"numeric" }),
  };
}

export default function ImportModal({ existingContacts, onImport, onClose }) {
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver]     = useState(false);
  const [rawParsed, setRawParsed]   = useState(null);  // { headers, rows, mapping }
  const [defaults, setDefaults]     = useState({ segment: DEFAULT_INTAKE_SEGMENT, tier:"Warm", stage:"Lead", source:"Website" });
  const [imported, setImported]     = useState(false);

  // Re-derive preview whenever raw data or defaults change
  const preview = useMemo(() => {
    if (!rawParsed) return null;
    const all = rawParsed.rows
      .map(row => rowToContact(row, rawParsed.mapping, defaults))
      .filter(c => c.email || c.firstName);
    const existingEmails = new Set(existingContacts.map(c => c.email?.toLowerCase()));
    const newOnes = all.filter(c => !existingEmails.has(c.email?.toLowerCase()));
    const dupes   = all.filter(c =>  existingEmails.has(c.email?.toLowerCase()));
    return { all, newOnes, dupes };
  }, [rawParsed, defaults, existingContacts]);

  function handleFile(file) {
    if (!file || !file.name.endsWith(".csv")) return;
    const reader = new FileReader();
    reader.onload = e => {
      const { headers, rows } = parseCSV(e.target.result);
      const mapping = buildMapping(headers);
      setRawParsed({ headers, rows, mapping });
    };
    reader.readAsText(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleConfirm() {
    if (!preview?.newOnes.length) return;
    const withIds = preview.newOnes.map((c, i) => ({ ...c, id: Date.now() + i }));
    onImport(withIds);
    setImported(true);
  }

  const detectedFields = rawParsed
    ? Object.entries(rawParsed.mapping).map(([field, col]) => ({ field, col }))
    : [];

  return (
    <div
      className="crm-modal-backdrop" style={{position:"absolute", top:0, left:0, right:0, bottom:0, minHeight:"100%", background:"rgba(20,20,20,0.6)", display:"flex", alignItems:"flex-start", justifyContent:"center", zIndex:150, padding:"32px 16px"}}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{width:600, maxWidth:"95%", background:BRAND.white, border:`1px solid ${BRAND.border}`, borderRadius:12, padding:"22px 24px", boxShadow:"0 12px 48px rgba(0,0,0,0.2)"}}>

        {/* Header */}
        <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:18}}>
          <div>
            <div style={{fontWeight:500, fontSize:15, color:BRAND.navy}}>↑ Import CSV</div>
            <div style={{fontSize:12, color:BRAND.gray, marginTop:2}}>
              {!rawParsed ? "Drop a CSV export from your inquiry form" : imported ? "Import complete" : `${preview?.all.length || 0} rows parsed · ${preview?.newOnes.length || 0} new · ${preview?.dupes.length || 0} duplicate${preview?.dupes.length !== 1 ? "s" : ""}`}
            </div>
          </div>
          <button onClick={onClose} style={{...btnSecondary, padding:"3px 10px", fontSize:12}}>✕</button>
        </div>

        {/* Success state */}
        {imported ? (
          <div style={{textAlign:"center", padding:"32px 0"}}>
            <div style={{fontSize:32, marginBottom:12}}>✓</div>
            <div style={{fontWeight:500, fontSize:15, color:BRAND.navy, marginBottom:6}}>
              {preview?.newOnes.length} contact{preview?.newOnes.length !== 1 ? "s" : ""} imported
            </div>
            {preview?.dupes.length > 0 && (
              <div style={{fontSize:12, color:BRAND.gray}}>{preview.dupes.length} duplicate{preview.dupes.length !== 1 ? "s" : ""} skipped (already in CRM)</div>
            )}
            <button style={{...btnPrimary, marginTop:20}} onClick={onClose}>Done</button>
          </div>
        ) : !rawParsed ? (
          /* Drop zone */
          <div>
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{border:`2px dashed ${dragOver ? BRAND.navy : BRAND.border}`, borderRadius:10, padding:"40px 24px", textAlign:"center", cursor:"pointer", background:dragOver ? BRAND.navyLight : BRAND.grayLight, transition:"all 0.15s"}}
            >
              <div style={{fontSize:28, marginBottom:10}}>📄</div>
              <div style={{fontWeight:500, fontSize:14, color:BRAND.navy, marginBottom:6}}>
                {dragOver ? "Drop to import" : "Drag & drop your CSV here"}
              </div>
              <div style={{fontSize:12, color:BRAND.gray}}>or click to browse · .csv files only</div>
            </div>
            <input ref={fileInputRef} type="file" accept=".csv" style={{display:"none"}} onChange={e => handleFile(e.target.files[0])}/>

            <div style={{marginTop:16, padding:"12px 14px", borderRadius:8, background:BRAND.sandLight, border:`1px solid ${BRAND.border}`}}>
              <div style={{fontSize:11, color:BRAND.gray, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6}}>Expected columns (any order)</div>
              <div style={{fontSize:12, color:BRAND.gray, lineHeight:1.8}}>
                Name <em>or</em> First Name + Last Name · Email · Phone · Organization · Message · Location
              </div>
            </div>
          </div>
        ) : (
          /* Preview + defaults */
          <div>
            {/* Detected field mapping */}
            {detectedFields.length > 0 && (
              <div style={{marginBottom:16, padding:"10px 14px", borderRadius:8, background:BRAND.navyLight, border:`1px solid ${BRAND.border}`}}>
                <div style={{fontSize:11, color:BRAND.navy, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:6}}>Auto-detected columns</div>
                <div style={{display:"flex", flexWrap:"wrap", gap:5}}>
                  {detectedFields.map(({ field, col }) => (
                    <span key={field} style={{fontSize:11, padding:"2px 8px", borderRadius:99, background:BRAND.white, border:`1px solid ${BRAND.border}`, color:BRAND.navy}}>
                      {col} → {field}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Defaults */}
            <div style={{display:"flex", gap:10, flexWrap:"wrap", marginBottom:16}}>
              <div style={{flex:1, minWidth:130}}>
                <div style={label}>Segment</div>
                <select value={defaults.segment} onChange={e => setDefaults(d => ({...d, segment:e.target.value}))} style={{...selectStyle, width:"100%"}}>
                  {SEGMENTS.map(sg => <option key={sg}>{sg}</option>)}
                </select>
              </div>
              <div>
                <div style={label}>Tier</div>
                <select value={defaults.tier} onChange={e => setDefaults(d => ({...d, tier:e.target.value}))} style={selectStyle}>
                  {["Hot","Warm","Cold"].map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <div style={label}>Stage</div>
                <select value={defaults.stage} onChange={e => setDefaults(d => ({...d, stage:e.target.value}))} style={selectStyle}>
                  {STAGES.map(st => <option key={st}>{st}</option>)}
                </select>
              </div>
              <div style={{flex:1, minWidth:110}}>
                <div style={label}>Source</div>
                <input value={defaults.source} onChange={e => setDefaults(d => ({...d, source:e.target.value}))} style={inputStyle} placeholder="Website"/>
              </div>
            </div>

            {/* Preview table */}
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11, color:BRAND.gray, fontWeight:500, textTransform:"uppercase", letterSpacing:"0.05em", marginBottom:8}}>
                New contacts to import ({preview?.newOnes.length})
              </div>
              {preview?.newOnes.length === 0 ? (
                <div style={{...card, textAlign:"center", color:BRAND.gray, fontSize:13, padding:20}}>
                  All contacts in this file already exist in the CRM.
                </div>
              ) : (
                <div style={{maxHeight:240, overflowY:"auto", border:`1px solid ${BRAND.border}`, borderRadius:8}}>
                  <table style={{width:"100%", borderCollapse:"collapse", fontSize:12}}>
                    <thead>
                      <tr style={{background:BRAND.grayLight, position:"sticky", top:0}}>
                        {["Name","Email","Org","Location"].map(h => (
                          <th key={h} style={{padding:"6px 10px", textAlign:"left", color:BRAND.gray, fontWeight:500, borderBottom:`1px solid ${BRAND.border}`}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {preview.newOnes.map((c, i) => (
                        <tr key={i} style={{borderBottom:`1px solid ${BRAND.border}`}}>
                          <td style={{padding:"7px 10px", color:BRAND.black, fontWeight:500}}>{c.firstName} {c.lastName}</td>
                          <td style={{padding:"7px 10px", color:BRAND.gray}}>{c.email}</td>
                          <td style={{padding:"7px 10px", color:BRAND.gray}}>{c.org || "—"}</td>
                          <td style={{padding:"7px 10px", color:BRAND.gray}}>{c.island || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {preview?.dupes.length > 0 && (
                <div style={{marginTop:8, fontSize:12, color:BRAND.gray}}>
                  {preview.dupes.length} duplicate{preview.dupes.length !== 1 ? "s" : ""} will be skipped: {preview.dupes.map(c => c.email).join(", ")}
                </div>
              )}
            </div>

            <div style={{display:"flex", gap:8}}>
              <button style={btnSecondary} onClick={() => setRawParsed(null)}>← Back</button>
              <button
                style={{...btnPrimary, flex:1}}
                disabled={!preview?.newOnes.length}
                onClick={handleConfirm}
              >
                Import {preview?.newOnes.length || 0} contact{preview?.newOnes.length !== 1 ? "s" : ""}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
