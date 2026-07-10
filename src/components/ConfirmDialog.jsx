import { useEffect, useRef } from "react";
import { BRAND } from "../constants/business.config";
import { btnPrimary, btnSecondary } from "../constants/styles";

export default function ConfirmDialog({ title, message, confirmLabel = "Delete", confirmColor, onConfirm, onCancel }) {
  const confirmRef = useRef(null);

  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    }
    window.addEventListener("keydown", handleKey);
    confirmRef.current?.focus();
    return () => window.removeEventListener("keydown", handleKey);
  }, [onConfirm, onCancel]);

  return (
    <div className="crm-confirm-overlay" onClick={e => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="crm-confirm-box">
        <div style={{ fontSize: 16, fontWeight: 600, color: BRAND.black, marginBottom: 8 }}>{title}</div>
        <div style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.6, marginBottom: 20 }}>{message}</div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button style={btnSecondary} onClick={onCancel}>Cancel</button>
          <button
            ref={confirmRef}
            style={{ ...btnPrimary, background: confirmColor || BRAND.red }}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
