// Thin wrapper over Supabase Auth. Sessions are persisted + auto-refreshed by
// supabase-js in localStorage, so "stay signed in" is automatic and the app
// never talks to the database without a valid session (see AUTH_SETUP.sql —
// RLS only grants access `to authenticated`).
import { supabase } from "./supabase";

// Current session (or null). Resolves once supabase-js has read localStorage.
export async function getSession() {
  const { data } = await supabase.auth.getSession();
  return data.session || null;
}

// Sign in with email + password. Returns { ok, error }.
export async function signIn(email, password) {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });
  return { ok: !error, error };
}

export async function signOut() {
  await supabase.auth.signOut();
}

// Subscribe to auth changes (sign in, sign out, token refresh). Returns an
// unsubscribe function. The callback receives the current session (or null).
export function onAuthChange(cb) {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    cb(session || null);
  });
  return () => data.subscription.unsubscribe();
}
