import { useMemo } from "react";
import { BRAND, PROJECT_STATUS_COLORS } from "../constants/business.config";

// A lightweight, dependency-free Gantt timeline. Each project with a
// start + end date becomes a horizontal bar positioned on a month grid, so
// overlaps and durations read at a glance. Bars are colored by status and
// click through to the edit modal.

const MONTH_W = 120; // px per month column
const ROW_H = 40;
const LABEL_W = 210; // sticky left label column

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const parse = s => (s ? new Date(s + "T00:00:00") : null);
const daysInMonth = (y, m) => new Date(y, m + 1, 0).getDate();

function fmtDate(d) {
  return `${MONTH_NAMES[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export default function GanttChart({ projects, contactName, onSelectProject }) {
  const dated = useMemo(
    () => projects
      .filter(p => p.startDate && p.endDate)
      .sort((a, b) => a.startDate.localeCompare(b.startDate)),
    [projects]
  );

  const model = useMemo(() => {
    if (!dated.length) return null;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Range spans the earliest start to the latest end, always including today
    // so the "today" marker is visible, snapped to whole months.
    let minD = today, maxD = today;
    dated.forEach(p => {
      const s = parse(p.startDate), e = parse(p.endDate);
      if (s < minD) minD = s;
      if (e > maxD) maxD = e;
    });
    const rangeStart = new Date(minD.getFullYear(), minD.getMonth(), 1);
    const rangeEnd = new Date(maxD.getFullYear(), maxD.getMonth() + 1, 0);

    const months = [];
    let cur = new Date(rangeStart);
    while (cur <= rangeEnd) {
      months.push({ year: cur.getFullYear(), month: cur.getMonth() });
      cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }

    const toX = (date) => {
      const md = (date.getFullYear() - rangeStart.getFullYear()) * 12 + (date.getMonth() - rangeStart.getMonth());
      const dim = daysInMonth(date.getFullYear(), date.getMonth());
      return (md + (date.getDate() - 1) / dim) * MONTH_W;
    };

    const totalWidth = months.length * MONTH_W;
    const todayX = toX(today);

    const bars = dated.map(p => {
      const s = parse(p.startDate), e = parse(p.endDate);
      const left = toX(s);
      // Extend the bar to cover the full end day (inclusive).
      const endX = toX(e) + MONTH_W / daysInMonth(e.getFullYear(), e.getMonth());
      const width = Math.max(endX - left, 6);
      const days = Math.round((e - s) / 86400000) + 1;
      return { project: p, left, width, start: s, end: e, days };
    });

    return { months, totalWidth, todayX, bars };
  }, [dated]);

  if (!model) {
    return (
      <div style={{ padding: "48px 20px", textAlign: "center", color: BRAND.gray }}>
        <div style={{ fontSize: 30, marginBottom: 10 }}>📅</div>
        <div style={{ fontSize: 14, fontWeight: 500, color: BRAND.navy, marginBottom: 4 }}>No dated projects yet</div>
        <div style={{ fontSize: 12 }}>Add a project with a start and end date to see it on the timeline.</div>
      </div>
    );
  }

  const { months, totalWidth, todayX, bars } = model;

  return (
    <div style={{ overflowX: "auto", border: `1px solid ${BRAND.border}`, borderRadius: 12, background: BRAND.white }} className="crm-gantt-wrap">
      <div style={{ minWidth: LABEL_W + totalWidth }}>

        {/* Header: month columns */}
        <div style={{ display: "flex", height: 34, borderBottom: `1px solid ${BRAND.border}`, position: "sticky", top: 0, zIndex: 3, background: BRAND.white }}>
          <div style={{ width: LABEL_W, flexShrink: 0, position: "sticky", left: 0, zIndex: 4, background: BRAND.grayLight, borderRight: `1px solid ${BRAND.border}`, display: "flex", alignItems: "center", padding: "0 14px", fontSize: 11, fontWeight: 600, color: BRAND.gray, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Project
          </div>
          <div style={{ position: "relative", width: totalWidth, background: BRAND.grayLight }}>
            {months.map((m, i) => (
              <div key={i} style={{ position: "absolute", left: i * MONTH_W, width: MONTH_W, height: "100%", borderRight: `1px solid ${BRAND.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 600, color: m.month === 0 ? BRAND.navy : BRAND.gray }}>
                {MONTH_NAMES[m.month]}{m.month === 0 ? ` ${m.year}` : ""}
              </div>
            ))}
          </div>
        </div>

        {/* Rows */}
        {bars.map(({ project, left, width, start, end, days }, ri) => (
          <div key={project.id} style={{ display: "flex", height: ROW_H, borderBottom: ri < bars.length - 1 ? `1px solid ${BRAND.grayLight}` : "none" }}>
            {/* Sticky label */}
            <div
              onClick={() => onSelectProject(project)}
              title="Edit project"
              style={{ width: LABEL_W, flexShrink: 0, position: "sticky", left: 0, zIndex: 2, background: BRAND.white, borderRight: `1px solid ${BRAND.border}`, padding: "0 14px", display: "flex", flexDirection: "column", justifyContent: "center", cursor: "pointer", overflow: "hidden" }}
            >
              <div style={{ fontSize: 12.5, fontWeight: 600, color: BRAND.navy, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{project.name}</div>
              <div style={{ fontSize: 10.5, color: BRAND.gray, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{contactName(project) || "No client"}</div>
            </div>

            {/* Timeline cell */}
            <div style={{ position: "relative", width: totalWidth, backgroundImage: `repeating-linear-gradient(to right, transparent, transparent ${MONTH_W - 1}px, ${BRAND.border} ${MONTH_W - 1}px, ${BRAND.border} ${MONTH_W}px)` }}>
              {/* Today marker */}
              <div style={{ position: "absolute", left: todayX, top: 0, bottom: 0, width: 2, background: `color-mix(in srgb, ${BRAND.red} 55%, transparent)`, zIndex: 1 }} />
              {/* Bar */}
              <div
                onClick={() => onSelectProject(project)}
                title={`${project.name} · ${fmtDate(start)} → ${fmtDate(end)} (${days} day${days === 1 ? "" : "s"})`}
                style={{
                  position: "absolute", left, width, top: 8, height: ROW_H - 16,
                  background: PROJECT_STATUS_COLORS[project.status] || BRAND.navy,
                  borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center",
                  padding: "0 8px", overflow: "hidden", zIndex: 2,
                  boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: BRAND.white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {project.name}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
