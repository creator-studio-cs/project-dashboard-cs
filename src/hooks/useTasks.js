import { useState, useEffect } from "react";
import { toast } from "../components/Toast";
import { supabase, isConfigured } from "../lib/supabase";
import { logActivity } from "./useActivity";

export function useTasks(contactId) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    let cancelled = false;

    async function init() {
      try {
        let query = supabase.from("tasks").select("*, contacts(firstName, lastName)").order("due_date");
        if (contactId) query = query.eq("contact_id", contactId);
        const { data, error } = await query;
        if (error) throw error;
        if (!cancelled) setTasks(normalize(data));
      } catch (error) {
        console.error("[useTasks] fetch failed:", error.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    const channel = supabase
      .channel(`tasks-${contactId || "all"}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, (payload) => {
        if (cancelled) return;
        const row = payload.new || payload.old;
        if (contactId && row.contact_id !== contactId) return;
        setTasks(ts => {
          if (payload.eventType === "INSERT") return [...ts, normalizeOne(payload.new)];
          if (payload.eventType === "UPDATE") return ts.map(t => t.id === payload.new.id ? normalizeOne(payload.new) : t);
          if (payload.eventType === "DELETE") return ts.filter(t => t.id !== payload.old.id);
          return ts;
        });
      })
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [contactId]);

  // Normalize Supabase snake_case + join shape to what TaskList expects
  function normalizeOne(row) {
    return {
      ...row,
      dueDate: row.due_date,
      assignedTo: row.assigned_to,
      contact: row.contact_id,
      expand: row.contacts ? { contact: row.contacts } : undefined,
    };
  }
  function normalize(rows) { return (rows || []).map(normalizeOne); }

  async function addTask(task) {
    try {
      const { error } = await supabase.from("tasks").insert({
        contact_id: task.contact,
        title: task.title,
        due_date: task.dueDate || null,
        assigned_to: task.assignedTo || null,
        completed: false,
      });
      if (error) throw error;
    } catch (error) {
      console.error("addTask:", error.message); toast.error("Failed to add task.");
    }
  }

  async function toggleTask(id, completed) {
    const task = tasks.find(t => t.id === id);
    setTasks(ts => ts.map(t => t.id === id ? { ...t, completed } : t));
    try {
      const { error } = await supabase.from("tasks").update({ completed }).eq("id", id);
      if (error) throw error;
      if (completed && task) logActivity(task.contact_id || task.contact, "task_completed", `Completed task: ${task.title}`);
    } catch (error) {
      console.error("toggleTask:", error.message); toast.error("Failed to update task.");
    }
  }

  async function deleteTask(id) {
    try {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("deleteTask:", error.message); toast.error("Failed to delete task.");
    }
  }

  return { tasks, loading, addTask, toggleTask, deleteTask };
}
