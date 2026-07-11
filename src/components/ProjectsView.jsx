import { useState, useMemo } from "react";
import { BRAND, PROJECT_STATUSES, PROJECT_STATUS_COLORS, PROJECT_STATUS_BG } from "../constants/business.config";
import { btnPrimary, pill, card } from "../constants/styles";
import { fmt$ } from "../utils/helpers";
import GanttChart from "./GanttChart";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
function fmtShort(s) {
  if (!s) return "—";
  const d = new Date(s + "T00:00:00");
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}`;
}
function durationDays(a, b) {
  if (!a || !b) return null;
  return Math.round((new Date(b) - new Date(a)) / 86400000) + 1;
}

// The Projects tab: a Gantt timeline (default) and a list view, sharing a
// status filter. Clicking any project opens the edit modal (owned by App).
export default function ProjectsView({ projects, contacts, onAddProject, onEditProject, onSelectContact }) {
  const [sub, setSub] = useState("timeline"); // timeline | list
  const [filterStatus, setFilterStatus] = useState("All");

  const contactsById = useMemo(() => {
    const m = {};
    contacts.forEach(c => { m[c.id] = c; });
    return m;
  }, [contacts]);

  // Prefer the joined client name; fall back to the live contacts list.
  const contactName = (p) => {
    const c = p.client || contactsById[p.contactId];
    if (!c) return "";
    const name = `${c.firstName || ""} ${c.lastName || ""}`.trim();
    return c.org ? `${name || c.org}` : name;
  };

  const filtered = useMemo(
    () => projects.filter(p => filterStatus === "All" || p.status === filterStatus),
    [projects, filterStatus]
  );

  const counts = useMemo(() => {
    const m = { All: projects.length };
    PROJECT_STATUSES.forEach(s => { m[s] = 0; });
    projects.forEach(p => { if (m[p.status] != null) m[p.status]++; });
    return m;
  }, [projects]);

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14, flexShrink: 0, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[["timeline", "Timeline"], ["list", "List"]].map(([key, lbl]) => (
            <button
              key={key}
              onClick={() => setSub(key)}
              style={{
                padding: "6px 16px", borderRadius: 99, border: "1px solid", fontSize: 12, cursor: "pointer",
                fontWeight: sub === key ? 500 : 400,
                borderColor: sub === key ? BRAND.navy : BRAND.border,
                background: sub === key ? BRAND.navy : BRAND.white,
                color: sub === key ? BRAND.white : BRAND.gray,
              }}
            >
              {lbl}
            </button>
          ))}
        </div>

        {/* Status filter */}
        <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginLeft: 4 }}>
          {["All", ...PROJECT_STATUSES].map(s => {
            const active = filterStatus === s;
            const color = s === "All" ? BRAND.navy : PROJECT_STATUS_COLORS[s];
            const bg = s === "All" ? BRAND.navyLight : PROJECT_STATUS_BG[s];
            return (
              <button
                key={s}
                onClick={() => setFilterStatus(s)}
                style={{
                  padding: "5px 11px", borderRadius: 99, border: "1px solid", fontSize: 11.5, cursor: "pointer",
                  fontWeight: active ? 600 : 400,
                  borderColor: active ? color : BRAND.border,
                  background: active ? bg : BRAND.white,
                  color: active ? color : BRAND.gray,
                }}
              >
                {s} <span style={{ opacity: 0.7 }}>{counts[s] ?? 0}</span>
              </button>
            );
          })}
        </div>

        <button style={{ ...btnPrimary, marginLeft: "auto" }} onClick={onAddProject}>+ New project</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflowY: "auto", minHeight: 0 }}>
        {projects.length === 0 ? (
          <div style={{ maxWidth: 460, margin: "60px auto", textAlign: "center" }}>
            <div style={{ fontSize: 40, marginBottom: 14 }}>🗂️</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: BRAND.navy, marginBottom: 8 }}>No projects yet</div>
            <div style={{ fontSize: 13, color: BRAND.gray, lineHeight: 1.7, marginBottom: 20 }}>
              Projects track the work you're doing — each linked to a client, with a start and end date so you can see everything on a timeline.
            </div>
            <button style={btnPrimary} onClick={onAddProject}>+ Create your first project</button>
          </div>
        ) : sub === "timeline" ? (
          <GanttChart projects={filtered} contactName={contactName} onSelectProject={onEditProject} />
        ) : (
          <div style={{ ...card, padding: 0, overflow: "hidden" }}>
            {/* List header */}
            <div style={{ display: "flex", padding: "10px 16px", borderBottom: `1px solid ${BRAND.border}`, background: BRAND.grayLight, fontSize: 11, fontWeight: 600, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              <div style={{ flex: 2, minWidth: 140 }}>Project</div>
              <div style={{ flex: 1.5, minWidth: 120 }}>Client</div>
              <div style={{ width: 120 }}>Status</div>
              <div style={{ width: 150 }}>Timeline</div>
              <div style={{ width: 70, textAlign: "right" }}>Value</div>
            </div>
            {filtered.map(p => {
              const loaded = contactsById[p.contactId]; // full contact (clickable)
              const c = loaded || p.client;             // joined fallback (display only)
              const dur = durationDays(p.startDate, p.endDate);
              return (
                <div
                  key={p.id}
                  onClick={() => onEditProject(p)}
                  className="crm-project-row"
                  style={{ display: "flex", alignItems: "center", padding: "12px 16px", borderBottom: `1px solid ${BRAND.grayLight}`, cursor: "pointer", fontSize: 13 }}
                >
                  <div style={{ flex: 2, minWidth: 140, fontWeight: 600, color: BRAND.navy, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 10 }}>{p.name}</div>
                  <div style={{ flex: 1.5, minWidth: 120, color: BRAND.gray, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 10 }}>
                    {c ? (
                      loaded ? (
                        <span
                          onClick={e => { e.stopPropagation(); onSelectContact(loaded); }}
                          style={{ color: BRAND.navy, cursor: "pointer", textDecoration: "underline", textDecorationColor: BRAND.border }}
                          title="Open contact"
                        >
                          {`${c.firstName || ""} ${c.lastName || ""}`.trim() || c.org}
                        </span>
                      ) : (
                        <span>{`${c.firstName || ""} ${c.lastName || ""}`.trim() || c.org}</span>
                      )
                    ) : "—"}
                  </div>
                  <div style={{ width: 120 }}>
                    <span style={pill(PROJECT_STATUS_COLORS[p.status], PROJECT_STATUS_BG[p.status])}>{p.status}</span>
                  </div>
                  <div style={{ width: 150, color: BRAND.gray, fontSize: 12 }}>
                    {fmtShort(p.startDate)} → {fmtShort(p.endDate)}
                    {dur != null && <span style={{ opacity: 0.7 }}> · {dur}d</span>}
                  </div>
                  <div style={{ width: 70, textAlign: "right", color: BRAND.black, fontWeight: 500 }}>{fmt$(p.value)}</div>
                </div>
              );
            })}
            {filtered.length === 0 && (
              <div style={{ padding: "28px 16px", textAlign: "center", fontSize: 13, color: BRAND.gray }}>No projects match this filter.</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
