import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { supabase, isConfigured } from "../lib/supabase";
import { applyRuntimeSettings, applyColorVars, getDefaultSettings } from "../constants/business.config";

// Shared workspace settings: loaded from the `workspace_settings` table (single
// row of JSON), applied to the running app, and synced live between users.
// Falls back to defaults if the table is missing/empty or Supabase isn't set up,
// so the app never breaks before the settings table exists.
const SettingsContext = createContext(null);

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within <SettingsProvider>");
  return ctx;
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => getDefaultSettings());
  const [version, setVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const rowIdRef = useRef(null);

  // Apply a full settings object to the running app + bump version (re-render).
  const apply = useCallback((next) => {
    applyRuntimeSettings(next);
    setSettings(next);
    setVersion(v => v + 1);
  }, []);

  useEffect(() => {
    // Apply defaults immediately so colors/lists are correct on first paint.
    applyRuntimeSettings(getDefaultSettings());

    if (!isConfigured) { setLoading(false); return; }

    let active = true;
    (async () => {
      const { data, error } = await supabase.from("workspace_settings").select("*").order("id").limit(1);
      if (!active) return;
      if (error) {
        // Table probably doesn't exist yet — stay on defaults, no crash.
        setLoading(false);
        return;
      }
      if (data && data.length) {
        rowIdRef.current = data[0].id;
        apply({ ...getDefaultSettings(), ...(data[0].data || {}) });
      } else {
        // Seed the single settings row.
        const { data: created } = await supabase
          .from("workspace_settings").insert({ data: {} }).select().single();
        if (created) rowIdRef.current = created.id;
      }
      setLoading(false);
    })();

    const channel = supabase
      .channel("workspace_settings_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "workspace_settings" }, payload => {
        const row = payload.new;
        if (row) {
          rowIdRef.current = row.id;
          apply({ ...getDefaultSettings(), ...(row.data || {}) });
        }
      })
      .subscribe();

    return () => { active = false; supabase.removeChannel(channel); };
  }, [apply]);

  // Persist + apply. Optimistically applies locally, then writes to Supabase.
  const saveSettings = useCallback(async (next) => {
    apply(next);
    if (!isConfigured) return { ok: true, local: true };
    try {
      if (rowIdRef.current == null) {
        const { data: created, error } = await supabase
          .from("workspace_settings").insert({ data: next }).select().single();
        if (error) return { ok: false, error };
        if (created) rowIdRef.current = created.id;
        return { ok: true };
      }
      const { error } = await supabase
        .from("workspace_settings")
        .update({ data: next, updated_at: new Date().toISOString() })
        .eq("id", rowIdRef.current);
      return { ok: !error, error };
    } catch (error) {
      return { ok: false, error };
    }
  }, [apply]);

  // Live color preview (used by the Settings UI while editing) without saving.
  const previewColors = useCallback((colors) => applyColorVars(colors), []);
  const resetColors = useCallback(() => applyColorVars(settings.colors), [settings]);

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, previewColors, resetColors, loading, version, configured: isConfigured }}>
      {children}
    </SettingsContext.Provider>
  );
}
