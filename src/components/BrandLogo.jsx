import { LOGO, BRAND } from "../constants/business.config";
import LogoMark from "./LogoMark";

// Renders the uploaded logo (data URL in settings) if present, otherwise the
// default generic mark on a tinted tile. Reads the live LOGO binding, so it
// updates when settings change (parent re-renders on settings version bump).
export default function BrandLogo({ size = 22, boxSize = 32 }) {
  if (LOGO) {
    return (
      <div style={{
        width: boxSize, height: boxSize, borderRadius: 8, background: BRAND.white,
        display: "flex", alignItems: "center", justifyContent: "center",
        overflow: "hidden", flexShrink: 0, border: `1px solid ${BRAND.border}`,
      }}>
        <img src={LOGO} alt="Logo" style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
      </div>
    );
  }
  return (
    <div style={{
      width: boxSize, height: boxSize, borderRadius: 8, background: BRAND.navyMid,
      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
    }}>
      <LogoMark size={size} />
    </div>
  );
}
