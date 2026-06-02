"use client";

import { useState } from "react";

type BackfillResult = {
  updated: number;
  linked: number;
  skipped: number;
  error?: string;
};

export default function AdminPage() {
  const [result, setResult] = useState<BackfillResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function runBackfill() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/backfill", { method: "POST" });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({ updated: 0, linked: 0, skipped: 0, error: String(err) });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ padding: "2rem", fontFamily: "monospace" }}>
      <h1>Admin</h1>
      <button
        onClick={runBackfill}
        disabled={loading}
        style={{
          padding: "0.6rem 1.4rem",
          fontSize: "1rem",
          cursor: loading ? "not-allowed" : "pointer",
        }}
      >
        {loading ? "Running…" : "Run Backfill"}
      </button>

      {result && (
        <pre style={{ marginTop: "1.5rem", background: "#f4f4f4", padding: "1rem" }}>
          {JSON.stringify(result, null, 2)}
        </pre>
      )}
    </main>
  );
}
