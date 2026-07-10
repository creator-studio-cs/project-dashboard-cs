import { useRef, useState } from "react";
import { supabase } from "../lib/supabase";
import { logActivity } from "../hooks/useActivity";
import { BRAND } from "../constants/business.config";
import { btnSecondary } from "../constants/styles";

// Uses Supabase Storage — requires a public bucket called "contact-files".
// Files are stored under a per-contact folder: contact-files/{contact.id}/filename
// The contact's `files` JSON column keeps a list of filenames for fast rendering.
const BUCKET = "contact-files";

export default function FileAttachments({ contact, updateContact }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const files = contact.files || [];

  async function handleUpload(e) {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;
    setUploading(true);
    setError("");
    try {
      const newNames = [];
      for (const file of picked) {
        const path = `${contact.id}/${Date.now()}_${file.name}`;
        const { error: uploadErr } = await supabase.storage.from(BUCKET).upload(path, file);
        if (uploadErr) throw uploadErr;
        newNames.push(path);
      }
      const updatedFiles = [...files, ...newNames];
      await updateContact(contact.id, { files: updatedFiles });
      logActivity(contact.id, "file", `Attached: ${picked.map(f => f.name).join(", ")}`);
    } catch (err) {
      setError("Upload failed — check your Supabase Storage bucket setup.");
      console.error("file upload:", err);
    }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove(filepath) {
    try {
      await supabase.storage.from(BUCKET).remove([filepath]);
      const updatedFiles = files.filter(f => f !== filepath);
      await updateContact(contact.id, { files: updatedFiles });
    } catch (err) {
      setError("Remove failed.");
      console.error("file remove:", err);
    }
  }

  function fileUrl(filepath) {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filepath);
    return data?.publicUrl || "#";
  }

  function displayName(filepath) {
    // Strip the "contactId/timestamp_" prefix to show the original filename
    const parts = filepath.split("/");
    const filename = parts[parts.length - 1];
    return filename.replace(/^\d+_/, "");
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
        <button
          style={{ ...btnSecondary, fontSize: 12, padding: "5px 12px" }}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "Uploading…" : "⬆ Attach file"}
        </button>
        <input ref={inputRef} type="file" multiple onChange={handleUpload} style={{ display: "none" }} />
      </div>

      {error && <div style={{ fontSize: 11, color: BRAND.red, marginBottom: 8 }}>{error}</div>}

      {files.length === 0 ? (
        <div style={{ fontSize: 12, color: BRAND.gray }}>No files attached.</div>
      ) : (
        files.map(filepath => (
          <div key={filepath} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: 12, padding: "6px 0", borderBottom: `1px solid ${BRAND.border}` }}>
            <a href={fileUrl(filepath)} target="_blank" rel="noopener noreferrer" style={{ color: BRAND.navy, textDecoration: "underline", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 260 }}>
              📎 {displayName(filepath)}
            </a>
            <button onClick={() => handleRemove(filepath)} style={{ background: "none", border: "none", color: BRAND.gray, cursor: "pointer", fontSize: 12 }}>✕</button>
          </div>
        ))
      )}
    </div>
  );
}
