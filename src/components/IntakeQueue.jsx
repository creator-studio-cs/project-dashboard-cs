import { useState, useEffect } from "react";
import { supabase, isConfigured } from "../lib/supabase";
import { BRAND } from "../constants/business.config";
import { btnPrimary, btnSecondary, pill, card } from "../constants/styles";

export default function IntakeQueue({ onApprove }) {
  const [pending, setPending]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);

  useEffect(() => {
    if (!isConfigured) { setLoading(false); return; }
    fetchPending();

    const channel = supabase
      .channel("intake-queue")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "contacts" },
        ({ new: row }) => { if (row.pending) setPending(p => [row, ...p]); })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "contacts" },
        ({ new: row }) => {
          if (!row.pending) setPending(p => p.filter(c => c.id !== row.id));
          else setPending(p => p.map(c => c.id === row.id ? row : c));
        })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "contacts" },
        ({ old: row }) => setPending(p => p.filter(c => c.id !== row.id)))
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  async function fetchPending() {
    setLoading(true);
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("pending", true)
      .order("id", { ascending: false });
    setPending(data ?? []);
    setLoading(false);
  }

  async function approve(contact) {
    setActing(contact.id);
    const { error } = await supabase
      .from("contacts")
      .update({ pending: false })
      .eq("id", contact.id);
    if (!error) {
      setPending(p => p.filter(c => c.id !== contact.id));
      if (onApprove) onApprove({ ...contact, pending: false });
    }
    setActing(null);
  }

  async function reject(id) {
    setActing(id);
    const { error } = await supabase.from("contacts").delete().eq("id", id);
    if (!error) setPending(p => p.filter(c => c.id !== id));
    setActing(null);
  }

  return (
    <div style={{ height: "100%", overflowY: "auto", padding: "0 0 32px" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 16, color: BRAND.navy }}>Intake Queue</div>
          <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 2 }}>
            Contacts submitted by the team — review and approve to add to the pipeline.
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ ...pill(BRAND.amber, BRAND.amberLight), fontSize: 12 }}>
            {pending.length} pending
          </span>
          <button style={{ ...btnSecondary, fontSize: 12, padding: "5px 12px" }} onClick={fetchPending}>
            Refresh
          </button>
        </div>
      </div>

      <ShareLink />

      {!loading && pending.length === 0 && (
        <div style={{ textAlign: "center", padding: "48px 24px", color: BRAND.gray }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>📭</div>
          <div style={{ fontWeight: 500, fontSize: 14, color: BRAND.navy, marginBottom: 6 }}>Queue is clear</div>
          <div style={{ fontSize: 13 }}>No pending contacts right now. Share the intake link with your team to start collecting.</div>
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: 48, color: BRAND.gray, fontSize: 13 }}>Loading…</div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {pending.map(c => (
          <PendingCard
            key={c.id}
            contact={c}
            acting={acting === c.id}
            onApprove={() => approve(c)}
            onReject={() => reject(c.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PendingCard({ contact: c, acting, onApprove, onReject }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div style={{ ...card, borderLeft: `3px solid ${BRAND.amber}` }}>
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: "50%", background: BRAND.sandLight, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14, fontWeight: 600, color: BRAND.navy }}>
          {c.firstName?.[0]}{c.lastName?.[0]}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: BRAND.navy }}>
            {c.firstName} {c.lastName}
          </div>
          <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 1 }}>
            {c.org || "No org"} · {c.island || "Location TBD"}
          </div>
          <div style={{ fontSize: 12, color: BRAND.gray, marginTop: 2 }}>
            {c.email}{c.phone ? ` · ${c.phone}` : ""}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 8 }}>
            <span style={{ ...pill(BRAND.amber, BRAND.amberLight), fontSize: 11 }}>Pending</span>
            <span style={{ ...pill(BRAND.gray, BRAND.grayLight), fontSize: 11 }}>{c.segment}</span>
            {c.island && <span style={{ ...pill(BRAND.navy, BRAND.navyLight), fontSize: 11 }}>{c.island}</span>}
          </div>
        </div>
        <button
          onClick={() => setExpanded(e => !e)}
          style={{ ...btnSecondary, padding: "4px 10px", fontSize: 11, flexShrink: 0 }}
        >
          {expanded ? "Less ▲" : "More ▼"}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 8, background: BRAND.grayLight, fontSize: 12, color: BRAND.black, lineHeight: 1.65 }}>
          {c.message && (
            <div style={{ marginBottom: 10 }}>
              <span style={{ fontWeight: 600, color: BRAND.navy }}>Their message: </span>
              {c.message}
            </div>
          )}
          {c.notes && (
            <div>
              <span style={{ fontWeight: 600, color: BRAND.navy }}>Notes: </span>
              {c.notes}
            </div>
          )}
          {!c.message && !c.notes && (
            <span style={{ color: BRAND.gray }}>No additional context provided.</span>
          )}
        </div>
      )}

      <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
        <button
          style={{ ...btnPrimary, flex: 2, opacity: acting ? 0.6 : 1, cursor: acting ? "not-allowed" : "pointer" }}
          disabled={acting}
          onClick={onApprove}
        >
          {acting ? "…" : "✓ Approve & add to pipeline"}
        </button>
        <button
          style={{ ...btnSecondary, flex: 1, color: BRAND.red, borderColor: BRAND.red, opacity: acting ? 0.6 : 1, cursor: acting ? "not-allowed" : "pointer" }}
          disabled={acting}
          onClick={onReject}
        >
          Discard
        </button>
      </div>
    </div>
  );
}

function ShareLink() {
  const [copied, setCopied] = useState(false);
  const link = `${window.location.origin}${window.location.pathname}#intake`;

  function copy() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ background: BRAND.navyLight, border: `1px solid ${BRAND.border}`, borderRadius: 10, padding: "12px 16px", marginBottom: 20, display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <div style={{ flex: 1, minWidth: 200 }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: BRAND.navy, marginBottom: 3 }}>📋 Team intake link</div>
        <div style={{ fontSize: 11, color: BRAND.gray, wordBreak: "break-all" }}>{link}</div>
      </div>
      <button
        style={{ ...btnPrimary, fontSize: 12, padding: "7px 14px", flexShrink: 0, background: copied ? BRAND.green : BRAND.navy }}
        onClick={copy}
      >
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}
