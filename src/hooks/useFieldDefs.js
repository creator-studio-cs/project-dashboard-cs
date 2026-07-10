import { useState, useEffect } from "react";
import { toast } from "../components/Toast";
import { supabase, isConfigured } from "../lib/supabase";

function slugify(label, existingKeys) {
  let base = label.toLowerCase().trim().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "field";
  let key = base;
  let i = 1;
  while (existingKeys.includes(key)) {
    key = `${base}_${i}`;
    i++;
  }
  return key;
}

export function useFieldDefs() {
  const [fieldDefs, setFieldDefs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    let cancelled = false;

    async function init() {
      try {
        const { data, error } = await supabase
          .from("field_defs")
          .select("*")
          .order("sort_order", { ascending: true });
        if (error) throw error;
        if (!cancelled) setFieldDefs(data || []);
      } catch (error) {
        console.error("[useFieldDefs] fetch failed:", error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    const channel = supabase
      .channel("field-defs-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "field_defs" }, (payload) => {
        if (cancelled) return;
        setFieldDefs(fds => {
          if (payload.eventType === "INSERT") return [...fds, payload.new].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
          if (payload.eventType === "UPDATE") return fds.map(f => f.id === payload.new.id ? payload.new : f);
          if (payload.eventType === "DELETE") return fds.filter(f => f.id !== payload.old.id);
          return fds;
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  // type: "text" | "number" | "date" | "select" | "checkbox"
  async function addFieldDef(label, type, options = []) {
    const key = slugify(label, fieldDefs.map(f => f.key));
    try {
      const { error } = await supabase.from("field_defs").insert({
        label, key, type, options, sort_order: fieldDefs.length,
      });
      if (error) throw error;
    } catch (error) {
      console.error("addFieldDef:", error.message); toast.error("Failed to add field.");
    }
  }

  async function updateFieldDef(id, updates) {
    try {
      const { error } = await supabase.from("field_defs").update(updates).eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("updateFieldDef:", error.message);
    }
  }

  async function deleteFieldDef(id) {
    try {
      const { error } = await supabase.from("field_defs").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("deleteFieldDef:", error.message); toast.error("Failed to delete field.");
    }
  }

  return { fieldDefs, loading, addFieldDef, updateFieldDef, deleteFieldDef };
}
