"use client";

// RecipeRail — a horizontal, snap-scrolling row of recipe cards for the home
// dashboard (Recently Viewed, Recommended, etc.). Renders nothing when empty.

import Link from "next/link";
import RecipeCard from "@/components/RecipeCard";
import type { RecipeSummary } from "@/types";

export default function RecipeRail({
  title,
  recipes,
  href,
  emptyHint,
}: {
  title: string;
  recipes: RecipeSummary[];
  href?: string;
  emptyHint?: string;
}) {
  if (recipes.length === 0 && !emptyHint) return null;

  return (
    <section style={{ marginBottom: "2rem" }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: "0.85rem" }}>
        <h2 style={{ fontSize: "1.05rem", fontWeight: 700, color: "var(--foreground)" }}>{title}</h2>
        {href && recipes.length > 0 && (
          <Link href={href} style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--accent)" }}>
            See all →
          </Link>
        )}
      </div>

      {recipes.length === 0 ? (
        <p style={{ color: "var(--muted)", fontSize: "0.88rem" }}>{emptyHint}</p>
      ) : (
        <div
          style={{
            display: "flex", gap: "1rem", overflowX: "auto", paddingBottom: "0.5rem",
            scrollSnapType: "x mandatory", WebkitOverflowScrolling: "touch",
          }}
        >
          {recipes.map((r) => (
            <div key={r.id} style={{ flex: "0 0 auto", width: 248, scrollSnapAlign: "start" }}>
              <RecipeCard recipe={r} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
