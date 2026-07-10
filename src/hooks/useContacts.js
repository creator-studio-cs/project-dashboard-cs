import { useState, useEffect, useCallback } from "react";
import { toast } from "../components/Toast";
import { supabase, isConfigured } from "../lib/supabase";
import { initContacts } from "../constants/data";

const PAGE_SIZE = 200;

export function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    let cancelled = false;

    async function init() {
      try {
        const { data, error, count } = await supabase
          .from("contacts")
          .select("*", { count: "exact" })
          .order("id", { ascending: true })
          .range(0, PAGE_SIZE - 1);

        if (error) throw error;
        if (cancelled) return;

        if (data.length === 0 && initContacts.length > 0) {
          const { data: seeded } = await supabase
            .from("contacts")
            .insert(initContacts.map(({ id: _id, ...rest }) => rest))
            .select();
          if (!cancelled) setContacts(seeded || []);
        } else {
          setContacts(data);
          setHasMore(count > PAGE_SIZE);
        }
      } catch (error) {
        console.error("[useContacts] fetch failed:", error.message);
        toast.error("Failed to load contacts.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    init();

    const channel = supabase
      .channel("contacts-changes")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contacts" },
        ({ new: row }) => setContacts(cs => [...cs, row]))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contacts" },
        ({ new: row }) => setContacts(cs => cs.map(c => c.id === row.id ? row : c)))
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "contacts" },
        ({ old: row }) => setContacts(cs => cs.filter(c => c.id !== row.id)))
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, []);

  const loadMore = useCallback(async () => {
    const from = contacts.length;
    try {
      const { data, error, count } = await supabase
        .from("contacts")
        .select("*", { count: "exact" })
        .order("id", { ascending: true })
        .range(from, from + PAGE_SIZE - 1);
      if (error) throw error;
      setContacts(cs => [...cs, ...data]);
      setHasMore(from + data.length < count);
    } catch (error) {
      console.error("loadMore:", error.message);
      toast.error("Failed to load more contacts.");
    }
  }, [contacts.length]);

  async function addContact(contact) {
    const { id: _id, ...row } = contact;
    try {
      const { data, error } = await supabase.from("contacts").insert(row).select().single();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error("addContact:", error.message); toast.error("Failed to add contact — check your connection.");
      return null;
    }
  }

  async function updateContact(id, updates) {
    setContacts(cs => cs.map(c => c.id === id ? { ...c, ...updates } : c));
    try {
      const { error } = await supabase.from("contacts").update(updates).eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("updateContact:", error.message); toast.error("Failed to save changes.");
    }
  }

  async function deleteContact(id) {
    try {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    } catch (error) {
      console.error("deleteContact:", error.message); toast.error("Failed to delete contact.");
    }
  }

  async function importContacts(newContacts) {
    try {
      const { error } = await supabase
        .from("contacts")
        .insert(newContacts.map(({ id: _id, ...rest }) => rest));
      if (error) throw error;
      toast.success(`${newContacts.length} contacts imported`);
    } catch (error) {
      console.error("importContacts:", error.message); toast.error("Import failed — check your CSV and connection.");
    }
  }

  return { contacts, loading, hasMore, loadMore, addContact, updateContact, deleteContact, importContacts };
}
