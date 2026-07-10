import { BRAND } from "../constants/business.config";

// Generic, unbranded mark: three "contact rows" (a node + a line each),
// reading as a neutral contacts/CRM glyph. Colors come from CSS variables via
// the `style` prop (SVG presentation attributes don't resolve CSS vars, but the
// CSS fill/stroke properties do), so the mark re-themes with the accent color.
export default function LogoMark({ size = 28 }) {
  const dot = { fill: BRAND.white };
  const line = { stroke: BRAND.sandMid };
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
      <circle cx="7" cy="7"  r="2" style={dot}/>
      <circle cx="7" cy="14" r="2" style={dot}/>
      <circle cx="7" cy="21" r="2" style={dot}/>
      <line x1="12" y1="7"  x2="22" y2="7"  style={line} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="12" y1="14" x2="22" y2="14" style={line} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="12" y1="21" x2="19" y2="21" style={line} strokeWidth="1.8" strokeLinecap="round"/>
    </svg>
  );
}
