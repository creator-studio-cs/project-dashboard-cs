import { useState, useEffect } from "react";
import { toast } from "../components/Toast";
import { supabase, isConfigured } from "../lib/supabase";

export async function logActivity(contactId, type, text, meta = {}) {
  if (!contactId || !isConfigured) return;
  try {
    await supabase.from("activity_log").insert({ contact_id: contactId, type, text, meta });
  } catch (error) {
    console.error("logActivity:", error.message);
  }
}

export function useActivity(contactId) {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!contactId || !isConfigured) { setActivity([]); setLoading(false); return; }
    let cancelled = false;

    async function init() {
      try {
        const { data, error } = await supabase
          .from("activity_log")
          .select("*")
          .eq("contact_id", contactId)
          .order("created_at", { ascending: false });
        if (error) throw error;
        if (!cancelled) setActivity(normalize(data));
      } catch (error) {
        console.error("[useActivity] fetch failed:", error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    const channel = supabase
      .channel(`activity-${contactId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "activity_log" }, (payload) => {
        if (cancelled) return;
        const row = payload.new || payload.old;
        if (row.contact_id !== contactId) return;
        setActivity(a => {
          if (payload.eventType === "INSERT") return [normalizeOne(payload.new), ...a];
          if (payload.eventType === "DELETE") return a.filter(x => x.id !== payload.old.id);
          return a;
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [contactId]);

  function normalizeOne(row) {
    return { ...row, created: row.created_at };
  }
  function normalize(rows) { return (rows || []).map(normalizeOne); }

  return { activity, loading };
}
