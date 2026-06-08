"use client";

// Feedback & Support — linked from the user menu / Settings.
// Lightweight: write a message and send it via the device email client (no backend).

import { useState } from "react";
import { MessageSquare } from "lucide-react";

const SUPPORT_EMAIL = "sarankarthikb2725@gmail.com";

export default function FeedbackPage() {
  const [message, setMessage] = useState("");

  const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("Cookbook app feedback")}&body=${encodeURIComponent(message)}`;

  return (
    <main className="container" style={{ maxWidth: 620, paddingTop: "2rem", paddingBottom: "4rem" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
        <MessageSquare size={20} style={{ color: "var(--accent)" }} />
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Feedback &amp; Support</h1>
      </div>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>
        Found a bug or have an idea? Tell us — it goes straight to the maker.
      </p>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 16, padding: "1.25rem" }}>
        <label htmlFor="fb" style={{ fontWeight: 600, display: "block", marginBottom: 8 }}>Your message</label>
        <textarea
          id="fb"
          className="input"
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="What's working, what's not, what you'd love to see…"
          style={{ width: "100%" }}
        />
        <div style={{ display: "flex", gap: 10, marginTop: 14, alignItems: "center", flexWrap: "wrap" }}>
          <a
            href={mailto}
            className="button button-primary"
            aria-disabled={!message.trim()}
            style={{ pointerEvents: message.trim() ? "auto" : "none", opacity: message.trim() ? 1 : 0.5 }}
          >
            Send via email
          </a>
          <span style={{ color: "var(--muted)", fontSize: "0.85rem" }}>
            or email <a href={`mailto:${SUPPORT_EMAIL}`} style={{ color: "var(--accent-strong)" }}>{SUPPORT_EMAIL}</a>
          </span>
        </div>
      </div>
    </main>
  );
}
