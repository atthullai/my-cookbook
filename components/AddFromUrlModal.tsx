"use client";

// Lightweight "Add recipe from URL" modal (matches the design reference).
// Collects a URL and hands off to /add?import=<url>, which auto-imports and
// shows the parsed recipe in the form for review.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X } from "lucide-react";

export default function AddFromUrlModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [url, setUrl] = useState("");

  const submit = () => {
    const u = url.trim();
    if (!u) return;
    onClose();
    router.push(`/add?import=${encodeURIComponent(u)}`);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }} onClick={onClose}>
      <div className="card" style={{ maxWidth: 460, width: "100%" }} onClick={(e) => e.stopPropagation()}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Add recipe from URL</h3>
          <button type="button" aria-label="Close" onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer", color: "var(--muted)" }}>
            <X size={18} />
          </button>
        </div>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem", margin: "8px 0 14px" }}>
          Enter the URL of the recipe you want to save.
        </p>
        <input
          className="input"
          type="url"
          placeholder="http://"
          value={url}
          autoFocus
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
          style={{ width: "100%" }}
        />
        <button type="button" className="button button-primary" onClick={submit} disabled={!url.trim()} style={{ width: "100%", marginTop: 14 }}>
          Save
        </button>
      </div>
    </div>
  );
}
