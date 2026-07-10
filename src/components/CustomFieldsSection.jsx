import { BRAND } from "../constants/business.config";
import { inputStyle, selectStyle, label } from "../constants/styles";

// fieldDefs: [{ key, label, type, options }]
// values: { [key]: value } — the contact's customFields object
// onChange: (key, value) => void
export default function CustomFieldsSection({ fieldDefs, values = {}, onChange }) {
  if (!fieldDefs || fieldDefs.length === 0) return null;

  return (
    <div>
      {fieldDefs.map(fd => (
        <div key={fd.id} style={{ marginBottom: 12 }}>
          <div style={label}>{fd.label}</div>
          {fd.type === "text" && (
            <input
              value={values[fd.key] || ""}
              onChange={e => onChange(fd.key, e.target.value)}
              style={inputStyle}
            />
          )}
          {fd.type === "number" && (
            <input
              type="number"
              value={values[fd.key] ?? ""}
              onChange={e => onChange(fd.key, e.target.value === "" ? "" : +e.target.value)}
              style={inputStyle}
            />
          )}
          {fd.type === "date" && (
            <input
              type="date"
              value={values[fd.key] || ""}
              onChange={e => onChange(fd.key, e.target.value)}
              style={inputStyle}
            />
          )}
          {fd.type === "checkbox" && (
            <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontSize: 13, color: BRAND.black }}>
              <input
                type="checkbox"
                checked={!!values[fd.key]}
                onChange={e => onChange(fd.key, e.target.checked)}
              />
              {values[fd.key] ? "Yes" : "No"}
            </label>
          )}
          {fd.type === "select" && (
            <select
              value={values[fd.key] || ""}
              onChange={e => onChange(fd.key, e.target.value)}
              style={{ ...selectStyle, width: "100%" }}
            >
              <option value="">Select…</option>
              {(fd.options || []).map(opt => <option key={opt}>{opt}</option>)}
            </select>
          )}
        </div>
      ))}
    </div>
  );
}
