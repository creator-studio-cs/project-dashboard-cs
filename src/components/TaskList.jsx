import { useState } from "react";
import { BRAND, TEAM_MEMBERS } from "../constants/business.config";
import { inputStyle, selectStyle, btnPrimary, btnSecondary } from "../constants/styles";

function isOverdue(t) {
  return t.dueDate && !t.completed && new Date(t.dueDate) < new Date(new Date().toDateString());
}
function isToday(t) {
  if (!t.dueDate) return false;
  return new Date(t.dueDate).toDateString() === new Date().toDateString();
}

export function taskBadgeCount(tasks) {
  return tasks.filter(t => !t.completed && (isOverdue(t) || isToday(t))).length;
}

// contactId: scope the add-form to one contact (DetailPanel usage).
// showContactName: render each task's contact name + let you jump to it (global Tasks view).
export default function TaskList({ tasks, addTask, toggleTask, deleteTask, contactId, showContactName, onSelectContact }) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [assignedTo, setAssignedTo] = useState("");
  const [showCompleted, setShowCompleted] = useState(false);

  function handleAdd() {
    if (!title.trim()) return;
    addTask({ title: title.trim(), dueDate: dueDate || null, assignedTo: assignedTo.trim(), contact: contactId });
    setTitle("");
    setDueDate("");
  }

  const open = tasks.filter(t => !t.completed);
  const done = tasks.filter(t => t.completed);
  const canAdd = !!contactId;

  const groups = showContactName
    ? [
        { label: "Overdue",     items: open.filter(isOverdue), color: BRAND.red },
        { label: "Due Today",   items: open.filter(t => isToday(t) && !isOverdue(t)), color: BRAND.amber },
        { label: "Upcoming",    items: open.filter(t => t.dueDate && !isToday(t) && !isOverdue(t)), color: BRAND.navy },
        { label: "No Due Date", items: open.filter(t => !t.dueDate), color: BRAND.gray },
      ]
    : [{ label: null, items: open, color: null }];

  return (
    <div>
      {/* Add task — only when scoped to a single contact */}
      {canAdd && (
        <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
          <input
            value={title}
            onChange={e => setTitle(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleAdd()}
            placeholder="New task…"
            style={{ ...inputStyle, flex: "2 1 160px" }}
          />
          <input
            type="date"
            value={dueDate}
            onChange={e => setDueDate(e.target.value)}
            style={{ ...inputStyle, flex: "1 1 130px" }}
          />
          {TEAM_MEMBERS.length > 0 ? (
            <select
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              style={{ ...selectStyle, flex: "1 1 120px" }}
            >
              <option value="">Unassigned</option>
              {TEAM_MEMBERS.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
            </select>
          ) : (
            <input
              value={assignedTo}
              onChange={e => setAssignedTo(e.target.value)}
              placeholder="Assigned to (optional)"
              style={{ ...inputStyle, flex: "1 1 120px" }}
            />
          )}
          <button style={{ ...btnPrimary, flexShrink: 0 }} onClick={handleAdd} disabled={!title.trim()}>Add</button>
        </div>
      )}

      {open.length === 0 && (
        <div style={{ fontSize: 12, color: BRAND.gray, marginBottom: 12 }}>No open tasks.</div>
      )}

      {groups.map(group => group.items.length > 0 && (
        <div key={group.label || "all"} style={{ marginBottom: 14 }}>
          {group.label && (
            <div style={{ fontSize: 11, fontWeight: 500, color: group.color, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6 }}>
              {group.label} ({group.items.length})
            </div>
          )}
          {group.items.map(t => (
            <TaskRow key={t.id} task={t} toggleTask={toggleTask} deleteTask={deleteTask} showContactName={showContactName} onSelectContact={onSelectContact} />
          ))}
        </div>
      ))}

      {done.length > 0 && (
        <div>
          <button
            onClick={() => setShowCompleted(s => !s)}
            style={{ ...btnSecondary, fontSize: 11, padding: "4px 10px", marginBottom: 8 }}
          >
            {showCompleted ? "Hide" : "Show"} {done.length} completed
          </button>
          {showCompleted && done.map(t => (
            <TaskRow key={t.id} task={t} toggleTask={toggleTask} deleteTask={deleteTask} showContactName={showContactName} onSelectContact={onSelectContact} />
          ))}
        </div>
      )}
    </div>
  );
}

function TaskRow({ task: t, toggleTask, deleteTask, showContactName, onSelectContact }) {
  const contactName = t.expand?.contact ? `${t.expand.contact.firstName} ${t.expand.contact.lastName}` : null;
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "7px 0", borderBottom: `1px solid ${BRAND.border}` }}>
      <input type="checkbox" checked={!!t.completed} onChange={e => toggleTask(t.id, e.target.checked)} style={{ marginTop: 3, cursor: "pointer" }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13, color: t.completed ? BRAND.gray : BRAND.black, textDecoration: t.completed ? "line-through" : "none" }}>
          {t.title}
        </div>
        <div style={{ fontSize: 11, color: BRAND.gray, marginTop: 1, display: "flex", gap: 8, flexWrap: "wrap" }}>
          {t.dueDate && <span>{new Date(t.dueDate).toLocaleDateString()}</span>}
          {t.assignedTo && <span>· {t.assignedTo}</span>}
          {showContactName && contactName && (
            <button
              onClick={() => onSelectContact?.(t.expand.contact)}
              style={{ background: "none", border: "none", padding: 0, color: BRAND.navy, cursor: "pointer", fontSize: 11, textDecoration: "underline" }}
            >
              {contactName}
            </button>
          )}
        </div>
      </div>
      <button onClick={() => deleteTask(t.id)} style={{ background: "none", border: "none", color: BRAND.gray, cursor: "pointer", fontSize: 12, padding: 2, flexShrink: 0 }}>✕</button>
    </div>
  );
}
