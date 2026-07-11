import { useState, useEffect } from "react";
import { toast } from "../components/Toast";
import { supabase, isConfigured } from "../lib/supabase";

// Projects are first-class engagements linked to a single primary client
// (contact_id). The Gantt timeline reads start_date/end_date; everything else
// mirrors the useTasks/useContacts patterns (realtime sync + optimistic edits).

// Map the DB row (snake_case + join) to the camelCase shape the UI uses.
function normalizeOne(row) {
  return {
    id: row.id,
    name: row.name,
    status: row.status,
    notes: row.notes,
    value: row.value || 0,
    contactId: row.contact_id,
    startDate: row.start_date,
    endDate: row.end_date,
    client: row.contacts || null, // { firstName, lastName, org } via join
  };
}
function normalize(rows) { return (rows || []).map(normalizeOne); }

// Convert camelCase updates back to DB column names.
function toRow(p) {
  const row = {};
  if ("name" in p)      row.name       = p.name;
  if ("status" in p)    row.status     = p.status;
  if ("notes" in p)     row.notes      = p.notes;
  if ("value" in p)     row.value      = p.value || 0;
  if ("contactId" in p) row.contact_id = p.contactId || null;
  if ("startDate" in p) row.start_date = p.startDate || null;
  if ("endDate" in p)   row.end_date   = p.endDate || null;
  return row;
}

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    let cancelled = false;

    async function init() {
      try {
        const { data, error } = await supabase
          .from("projects")
          .select("*, contacts(firstName, lastName, org)")
          .order("start_date", { ascending: true });
        if (error) throw error;
        if (!cancelled) setProjects(normalize(data));
      } catch (error) {
        console.error("[useProjects] fetch failed:", error.message);
        toast.error("Failed to load projects.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    // Realtime rows arrive without the joined contact, so we keep any client
    // info we already had for that row on updates.
    const channel = supabase
      .channel("projects-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, (payload) => {
        if (cancelled) return;
        setProjects(ps => {
          if (payload.eventType === "INSERT") return [...ps, normalizeOne(payload.new)];
          if (payload.eventType === "UPDATE") {
            return ps.map(p => p.id === payload.new.id
              ? { ...normalizeOne(payload.new), client: p.client }
              : p);
          }
          if (payload.eventType === "DELETE") return ps.filter(p => p.id !== payload.old.id);
          return ps;
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  async function addProject(project) {
    try {
      const { data, error } = await supabase
        .from("projects")
        .insert(toRow(project))
        .select("*, contacts(firstName, lastName, org)")
        .single();
      if (error) throw error;
      return normalizeOne(data);
    } catch (error) {
      console.error("addProject:", error.message);
      toast.error("Failed to add project — check your connection.");
      return null;
    }
  }

  async function updateProject(id, updates) {
    setProjects(ps => ps.map(p => p.id === id ? { ...p, ...updates } : p));
    try {
      const { error } = await supabase.from("projects").update(toRow(updates)).eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("updateProject:", error.message);
      toast.error("Failed to save project.");
    }
  }

  async function deleteProject(id) {
    try {
      const { error } = await supabase.from("projects").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("deleteProject:", error.message);
      toast.error("Failed to delete project.");
    }
  }

  return { projects, loading, addProject, updateProject, deleteProject };
}
