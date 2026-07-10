import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { BRAND } from "../constants/business.config";

const ToastContext = createContext();
export const useToast = () => useContext(ToastContext);

// Global emitter — hooks (which can't use React context) call toast.error()
// and the ToastProvider picks it up via a listener.
const listeners = new Set();
export const toast = {
  success: (msg) => listeners.forEach(fn => fn(msg, "success")),
  error:   (msg) => listeners.forEach(fn => fn(msg, "error")),
  info:    (msg) => listeners.forEach(fn => fn(msg, "info")),
};

const TYPES = {
  success: { bg: BRAND.greenLight, border: BRAND.green, color: BRAND.green, icon: "✓" },
  error:   { bg: BRAND.redLight,   border: BRAND.red,   color: BRAND.red,   icon: "✕" },
  info:    { bg: BRAND.navyLight,  border: BRAND.navy,  color: BRAND.navy,  icon: "ℹ" },
  undo:    { bg: BRAND.amberLight, border: BRAND.amber,  color: BRAND.amber, icon: "↩" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const addToast = useCallback((message, type = "info", options = {}) => {
    const id = ++idRef.current;
    const duration = options.duration ?? (type === "error" ? 6000 : 3500);
    setToasts(ts => [...ts, { id, message, type, onUndo: options.onUndo }]);
    if (duration > 0) setTimeout(() => dismiss(id), duration);
    return id;
  }, []);

  const dismiss = useCallback((id) => {
    setToasts(ts => ts.filter(t => t.id !== id));
  }, []);

  // Wire global emitter to the React-based addToast
  useEffect(() => {
    const handler = (msg, type) => addToast(msg, type);
    listeners.add(handler);
    return () => listeners.delete(handler);
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ addToast, dismiss }}>
      {children}
      <div className="crm-toast-container">
        {toasts.map(t => {
          const s = TYPES[t.type] || TYPES.info;
          return (
            <div key={t.id} className="crm-toast" style={{ background: s.bg, borderLeft: `3px solid ${s.border}`, color: s.color }}>
              <span className="crm-toast-icon">{s.icon}</span>
              <span className="crm-toast-msg">{t.message}</span>
              {t.onUndo && (
                <button className="crm-toast-undo" onClick={() => { t.onUndo(); dismiss(t.id); }}>
                  Undo
                </button>
              )}
              <button className="crm-toast-close" onClick={() => dismiss(t.id)}>✕</button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
