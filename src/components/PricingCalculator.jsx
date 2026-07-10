import { useState } from "react";
import { BRAND, PRICING_PACKAGES, VOLUME_THRESHOLD, VOLUME_DISCOUNT } from "../constants/business.config";
import { btnPrimary, label, inputStyle } from "../constants/styles";

export default function PricingCalculator({ currentValue, onApply }) {
  const [pkgId, setPkgId] = useState("");
  const [qty,   setQty]   = useState(1);

  const pkg       = PRICING_PACKAGES.find(p => p.id === pkgId);
  const unitPrice = pkg?.price ?? 0;
  const hasDiscount = qty >= VOLUME_THRESHOLD;
  const subtotal  = unitPrice * qty;
  const discount  = hasDiscount ? Math.round(subtotal * VOLUME_DISCOUNT) : 0;
  const total     = subtotal - discount;
  const discountPct = Math.round(VOLUME_DISCOUNT * 100);

  if (PRICING_PACKAGES.length === 0) return null; // hidden until packages are configured

  return (
    <div style={{borderRadius:8, border:`1px solid ${BRAND.border}`, overflow:"hidden"}}>
      <div style={{background:BRAND.navyLight, padding:"8px 12px"}}>
        <span style={{fontSize:11, fontWeight:500, color:BRAND.navy, textTransform:"uppercase", letterSpacing:"0.05em"}}>Estimate Deal Value</span>
      </div>

      <div style={{padding:"12px"}}>
        <div style={{marginBottom:10}}>
          <div style={label}>Package</div>
          <select
            value={pkgId}
            onChange={e => setPkgId(e.target.value)}
            style={{...inputStyle, cursor:"pointer"}}
          >
            <option value="">Select a package…</option>
            {PRICING_PACKAGES.map(p => (
              <option key={p.id} value={p.id}>{p.name} — ${p.price}</option>
            ))}
          </select>
          {pkg && (
            <div style={{fontSize:11, color:BRAND.gray, marginTop:4, lineHeight:1.5}}>{pkg.desc}</div>
          )}
        </div>

        <div style={{marginBottom:12}}>
          <div style={label}>Quantity</div>
          <div style={{display:"flex", alignItems:"center", gap:8}}>
            <input
              type="number"
              min={1}
              max={500}
              value={qty}
              onChange={e => setQty(Math.max(1, +e.target.value || 1))}
              style={{...inputStyle, width:80}}
            />
            {qty >= VOLUME_THRESHOLD && (
              <span style={{fontSize:11, color:BRAND.green, fontWeight:500}}>{discountPct}% volume discount applied</span>
            )}
            {qty > 0 && qty < VOLUME_THRESHOLD && (
              <span style={{fontSize:11, color:BRAND.gray}}>{VOLUME_THRESHOLD - qty} more for {discountPct}% off</span>
            )}
          </div>
        </div>

        {pkg && (
          <div style={{background:BRAND.grayLight, borderRadius:6, padding:"10px 12px", marginBottom:10}}>
            <div style={{display:"flex", justifyContent:"space-between", fontSize:12, color:BRAND.gray, marginBottom:4}}>
              <span>${pkg.price} × {qty}</span>
              <span>${subtotal.toLocaleString()}</span>
            </div>
            {hasDiscount && (
              <div style={{display:"flex", justifyContent:"space-between", fontSize:12, color:BRAND.green, marginBottom:4}}>
                <span>Volume discount ({discountPct}%)</span>
                <span>−${discount.toLocaleString()}</span>
              </div>
            )}
            <div style={{display:"flex", justifyContent:"space-between", fontSize:14, fontWeight:500, color:BRAND.navy, borderTop:`1px solid ${BRAND.border}`, paddingTop:6, marginTop:2}}>
              <span>Estimated total</span>
              <span>${total.toLocaleString()}</span>
            </div>
          </div>
        )}

        <div style={{display:"flex", gap:6, alignItems:"center"}}>
          <button
            style={{...btnPrimary, flex:1, opacity:!pkg ? 0.4 : 1, cursor:!pkg ? "not-allowed" : "pointer"}}
            disabled={!pkg}
            onClick={() => pkg && onApply(total)}
          >
            Apply ${total.toLocaleString()} to deal value
          </button>
          {currentValue > 0 && (
            <span style={{fontSize:11, color:BRAND.gray, whiteSpace:"nowrap"}}>current: ${currentValue.toLocaleString()}</span>
          )}
        </div>
      </div>
    </div>
  );
}
