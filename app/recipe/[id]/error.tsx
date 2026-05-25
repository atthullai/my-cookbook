"use client";

import Link from "next/link";

export default function RecipeError({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="container">
      <Link href="/" className="back-link">
        Back to cookbook
      </Link>
      <div className="empty-state empty-state-action">
        <h1>Import failed</h1>
        <p>The recipe page could not finish loading. It may be private, deleted, still importing, or temporarily offline.</p>
        <div className="section-link-grid">
          <button className="button button-primary" type="button" onClick={reset}>
            Retry
          </button>
          <Link href="/recipes" className="button">
            Open recipe index
          </Link>
        </div>
      </div>
    </main>
  );
}
