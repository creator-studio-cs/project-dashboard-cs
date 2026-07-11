// Lightweight workspace password gate.
//
// IMPORTANT — this is a *deterrent*, not real security. The app is a static
// site with a public Supabase anon key, so the password hash (stored in the
// shared workspace_settings row) is readable by anyone, and the data itself is
// reachable directly through Supabase. This only stops a casual visitor who
// opens the URL from seeing the workspace UI. For real protection, use Supabase
// Auth + row-level security (the login item on the roadmap).
//
// We still salt + stretch the password with PBKDF2 (150k iterations) so the
// stored hash can't be trivially reversed and a weak password isn't instantly
// readable to anyone who queries the settings row.

const UNLOCK_KEY = "crm-workspace-unlock";
const ITERATIONS = 150000;

function bufToHex(buf) {
  return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("");
}
function hexToBytes(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}

// Web Crypto is only available in a secure context (https or localhost).
// GitHub Pages is https and local dev is localhost, so this is fine in practice.
const subtle = typeof crypto !== "undefined" ? crypto.subtle : undefined;

export function randomSaltHex() {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return bufToHex(bytes.buffer);
}

async function derive(password, saltHex, iterations) {
  const enc = new TextEncoder();
  const keyMaterial = await subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await subtle.deriveBits(
    { name: "PBKDF2", salt: hexToBytes(saltHex), iterations, hash: "SHA-256" },
    keyMaterial,
    256
  );
  return bufToHex(bits);
}

// Build a fresh access record { hash, salt, iterations } from a plaintext password.
export async function createAccess(password) {
  const salt = randomSaltHex();
  const hash = await derive(password, salt, ITERATIONS);
  return { hash, salt, iterations: ITERATIONS };
}

// Constant-time-ish comparison of two hex strings.
function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyPassword(password, access) {
  if (!isProtected(access)) return true; // nothing set → always "correct"
  if (!subtle) return false;
  try {
    const h = await derive(password, access.salt, access.iterations || ITERATIONS);
    return safeEqual(h, access.hash);
  } catch {
    return false;
  }
}

export function isProtected(access) {
  return !!(access && access.hash);
}

// This device counts as unlocked if it has previously stored the *current*
// password hash — so changing the password re-locks every device.
export function isUnlockedLocally(access) {
  if (!isProtected(access)) return true;
  try {
    return safeEqual(localStorage.getItem(UNLOCK_KEY) || "", access.hash);
  } catch {
    return false;
  }
}

export function rememberUnlock(access) {
  try {
    if (isProtected(access)) localStorage.setItem(UNLOCK_KEY, access.hash);
  } catch { /* storage unavailable — user just re-enters next time */ }
}

export function clearUnlock() {
  try { localStorage.removeItem(UNLOCK_KEY); } catch { /* ignore */ }
}
