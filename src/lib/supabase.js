import { createClient } from "@supabase/supabase-js";

const url = process.env.REACT_APP_SUPABASE_URL || "";
const key = process.env.REACT_APP_SUPABASE_ANON_KEY || "";

// Check if real credentials are configured (not placeholders or empty)
export const isConfigured = !!(
  url &&
  key &&
  !url.includes("placeholder") &&
  !url.includes("your-project-id") &&
  key !== "placeholder" &&
  key.length > 20
);

// Create the client — if credentials are missing/fake, pass a dummy URL
// so the SDK doesn't throw on import and crash the entire app.
// The hooks will see `isConfigured === false` and skip API calls.
export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  key || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
);
