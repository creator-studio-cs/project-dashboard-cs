import { BRAND } from "./business.config";

// ── Design tokens ──────────────────────────────────────────
export const inputStyle = {
  width:"100%", padding:"9px 12px", borderRadius:8,
  border:`1.5px solid ${BRAND.border}`, background:BRAND.white,
  color:BRAND.black, fontSize:13, boxSizing:"border-box",
  fontFamily:"'Inter', system-ui, sans-serif", outline:"none",
  transition:"border-color 0.15s ease, box-shadow 0.15s ease",
};

export const selectStyle = {
  padding:"9px 12px", borderRadius:8, border:`1.5px solid ${BRAND.border}`,
  background:BRAND.white, color:BRAND.black, fontSize:13,
  cursor:"pointer", fontFamily:"'Inter', system-ui, sans-serif",
  transition:"border-color 0.15s ease",
};

export const btnPrimary = {
  padding:"9px 18px", borderRadius:8, border:"none",
  background:BRAND.navy, color:BRAND.white, cursor:"pointer",
  fontSize:13, fontWeight:600, fontFamily:"'Inter', system-ui, sans-serif",
  transition:"background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease",
  boxShadow:`0 1px 3px color-mix(in srgb, ${BRAND.navy} 20%, transparent)`,
};

export const btnSecondary = {
  padding:"8px 16px", borderRadius:8, border:`1.5px solid ${BRAND.border}`,
  background:BRAND.white, color:BRAND.navy, cursor:"pointer",
  fontSize:13, fontWeight:500, fontFamily:"'Inter', system-ui, sans-serif",
  transition:"background 0.15s ease, border-color 0.15s ease",
};

export const pill = (color, bg) => ({
  display:"inline-flex", alignItems:"center", padding:"3px 10px",
  borderRadius:99, fontSize:11, fontWeight:600, color, background:bg,
  letterSpacing:"0.01em",
});

export const tag = {
  display:"inline-flex", padding:"3px 9px", borderRadius:99,
  fontSize:11, fontWeight:500, background:BRAND.sandLight, color:BRAND.sand,
  border:`1px solid ${BRAND.sandMid}`,
};

export const label = {
  fontSize:11, color:BRAND.gray, fontWeight:600, marginBottom:5,
  display:"block", textTransform:"uppercase", letterSpacing:"0.06em",
};

export const card = {
  background:BRAND.white, border:`1px solid ${BRAND.border}`,
  borderRadius:12, padding:"16px 18px",
  boxShadow:"0 1px 4px rgba(0,0,0,0.04)",
};

export const metricCard = {
  background:BRAND.sandLight, borderRadius:10,
  padding:"16px 18px", minWidth:110,
};
