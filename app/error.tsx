"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="container">
      <div className="empty-state empty-state-action illustrated-empty">
        <div className="empty-illustration steam-cup" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <h1>Something spilled</h1>
        <p>The cookbook could not finish loading this view. Your recipes are safe; try again or return to the dashboard.</p>
        <div className="section-link-grid">
          <button className="button button-primary" type="button" onClick={reset}>
            Retry
          </button>
          <Link className="button" href="/">
            Back to dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}
