import { useState, useEffect } from "react";
import { BRAND, BUSINESS } from "../constants/business.config";
import { inputStyle, btnPrimary } from "../constants/styles";
import { getSession, signIn, onAuthChange } from "../lib/auth";
import { isConfigured } from "../lib/supabase";
import BrandLogo from "./BrandLogo";

// Wraps the app. The workspace requires a signed-in Supabase user before
// anything renders — this isn't a client-side deterrent, it's real auth:
// row-level security (AUTH_SETUP.sql) means the database returns nothing
// without a valid session, so there's no bypass. The public intake form
// (#intake) is exempt: anon users get INSERT-only on contacts.
export default function AuthGate({ children }) {
  const [session, setSession] = useState(undefined); // undefined = still resolving
  const [isIntake, setIsIntake] = useState(() => window.location.hash === "#intake");

  useEffect(() => {
    const h = () => setIsIntake(window.location.hash === "#intake");
    window.addEventListener("hashchange", h);
    return () => window.removeEventListener("hashchange", h);
  }, []);

  useEffect(() => {
    if (!isConfigured) { setSession(null); return; }
    let active = true;
    getSession().then(s => { if (active) setSession(s); });
    const unsub = onAuthChange(s => setSession(s));
    return () => { active = false; unsub(); };
  }, []);

  // Public intake form is never gated.
  if (isIntake) return children;

  // If Supabase isn't configured, there's no data to protect — let the app
  // render (hooks already no-op) rather than trapping the user on a login they
  // can never pass.
  if (!isConfigured) return children;

  // Still reading the persisted session — don't flash the login screen.
  if (session === undefined) {
    return (
      <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND.grayLight }}>
        <div style={{ color: BRAND.gray, fontSize: 13, fontFamily: "'Inter', system-ui, sans-serif" }}>Loading…</div>
      </div>
    );
  }

  if (session) return children;

  return <LoginScreen />;
}

function LoginScreen() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!email || !pw || busy) return;
    setBusy(true);
    setError("");
    const { ok, error: err } = await signIn(email, pw);
    setBusy(false);
    if (!ok) {
      // Supabase returns a generic "Invalid login credentials" for both wrong
      // email and wrong password — good (no account enumeration). Surface it plainly.
      setError(err?.message === "Email not confirmed"
        ? "Check your email and confirm your account first, then sign in."
        : "Incorrect email or password.");
      setPw("");
    }
    // On success, onAuthChange in AuthGate swaps in the app automatically.
  }

  return (
    <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: BRAND.grayLight, padding: 20, fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ width: 360, maxWidth: "100%", background: BRAND.white, border: `1px solid ${BRAND.border}`, borderRadius: 14, padding: "30px 28px", boxShadow: "0 12px 48px rgba(0,0,0,0.12)", textAlign: "center" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 14 }}>
          <BrandLogo size={30} boxSize={46} />
        </div>
        <div style={{ fontWeight: 600, fontSize: 17, color: BRAND.navy, marginBottom: 4 }}>{BUSINESS.name}</div>
        <div style={{ fontSize: 13, color: BRAND.gray, marginBottom: 22 }}>Sign in to your workspace.</div>

        <form onSubmit={submit}>
          <input
            type="email"
            autoFocus
            autoComplete="username"
            value={email}
            onChange={e => { setEmail(e.target.value); setError(""); }}
            placeholder="Email"
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          <input
            type="password"
            autoComplete="current-password"
            value={pw}
            onChange={e => { setPw(e.target.value); setError(""); }}
            placeholder="Password"
            style={{ ...inputStyle, marginBottom: 10 }}
          />
          {error && (
            <div style={{ fontSize: 12, color: BRAND.red, marginBottom: 10 }}>{error}</div>
          )}
          <button type="submit" disabled={!email || !pw || busy} style={{ ...btnPrimary, width: "100%", opacity: (!email || !pw || busy) ? 0.6 : 1 }}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <div style={{ fontSize: 11.5, color: BRAND.gray, marginTop: 18, lineHeight: 1.5 }}>
          Accounts are created by an admin. Forgot your password? Ask an admin to reset it.
        </div>
      </div>
    </div>
  );
}
