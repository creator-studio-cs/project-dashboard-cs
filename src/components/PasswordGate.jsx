import { useState, useEffect } from "react";
import { useSettings } from "../hooks/useSettings";
import { BRAND, BUSINESS } from "../constants/business.config";
import { inputStyle, btnPrimary } from "../constants/styles";
import { isProtected, isUnlockedLocally, verifyPassword, rememberUnlock } from "../utils/access";
import BrandLogo from "./BrandLogo";

// Wraps the app. If the workspace has a password set and this device hasn't
// unlocked with the current password, show a lock screen. The public intake
// form (#intake) always bypasses the gate so external people can still submit.
export default function PasswordGate({ children }) {
  const { settings, loading } = useSettings();
  const access = settings.access;

  const [unlocked, setUnlocked] = useState(() => isUnlockedLocally(access));
  const [pw, setPw] = useState("");
  const [remember, setRemember] = useState(true);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [isIntake, setIsIntake] = useState(() => window.location.hash === "#intake");

  useEffect(() => {
    const h = () => setIsIntake(window.location.hash === "#intake");
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  // Re-evaluate whenever the password changes (loaded from DB, or updated by
  // another user) — a new password re-locks this device.
  useEffect(() => {
    setUnlocked(isUnlockedLocally(access));
  }, [access?.hash]);

  // Public intake form is never gated.
  if (isIntake) return children;

  // Wait for settings so we never flash the app before knowing it's protected.
  if (loading) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND.grayLight }}>
        <div style={{ color: BRAND.gray, fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif" }}>Loading…</div>
      </div>
    );
  }

  if (!isProtected(access) || unlocked) return children;

  async function submit(e) {
    e.preventDefault();
    if (!pw || checking) return;
    setChecking(true);
    setError("");
    const ok = await verifyPassword(pw, access);
    setChecking(false);
    if (ok) {
      if (remember) rememberUnlock(access);
      setUnlocked(true);
    } else {
      setError("Incorrect password. Please try again.");
      setPw("");
    }
  }

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND.grayLight, padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: 360, maxWidth: "100%", background: BRAND.white, border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "30px 28px", boxShadow: "0 12px 48px rgba(0,0,0,0.12)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <BrandLogo size={30} boxSize={46} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 17, color: BRAND.navy, marginBottom: 4 }}>{BUSINESS.name}</div>
        <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 22 }}>This workspace is password-protected.</div>

        <form onSubmit={submit}>
          <input
            type="password"
            autoFocus
            value={pw}
            onChange={e => { setPw(e.target.value); setError(""); }}
            placeholder="Enter workspace password"
            style={{ ...inputStyle, textAlign: "center", marginBottom: 10 }}
          />
          {error && (
            <div style={{ fontSize: 12, color: BRAND.red, marginBottom: 10 }}>{error}</div>
          )}
          <label style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 7, fontSize: 12, color: BRAND.gray, marginBottom: 16, cursor: "pointer" }}>
            <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} />
            Remember this device
          </label>
          <button type="submit" disabled={!pw || checking} style={{ ...btnPrimary, width: "100%", opacity: (!pw || checking) ? 0.6 : 1 }}>
            {checking ? "Checking…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
