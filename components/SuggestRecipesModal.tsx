"use client";

// components/SuggestRecipesModal.tsx
// Modal shown when user clicks "Suggest Recipes" on the Pantry page.
// Shows recipes ranked by pantry coverage — "Ready to cook" green, "Almost there" amber.

import { useMemo, useEffect, useCallback, useState } from "react";
import Image from "next/image";
import { supabase } from "@/lib/supabase";
import { suggestRecipes } from "@/lib/suggestRecipes";
import type { RecipeMatch } from "@/lib/suggestRecipes";
import type { RecipeRecord } from "@/lib/recipe-types";
import type { PantryItem } from "@/types";

type Props = {
  pantryItems: PantryItem[];
  allRecipes: RecipeRecord[];
  onClose: () => void;
  onPlan: (recipe: RecipeRecord) => void;
  onView: (recipe: RecipeRecord) => void;
  /** When set, scores only against this single item (minCoverage: 0) */
  singleItem?: PantryItem;
};

export function SuggestRecipesModal({ pantryItems, allRecipes, onClose, onPlan, onView, singleItem }: Props) {
  const [addingToList, setAddingToList] = useState<string | null>(null);

  const addMissingToShoppingList = useCallback(async (missingIngredients: string[]) => {
    const key = missingIngredients.join(",");
    setAddingToList(key);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const rows = missingIngredients.map((name) => ({
        user_id:  user.id,
        name:     name,
        quantity: 1,
        unit:     null,
        category: "other",
        checked:  false,
        source:   "pantry-suggest",
      }));
      await supabase.from("shopping_list").insert(rows);
    } finally {
      setAddingToList(null);
    }
  }, []);

  const matches = useMemo(() => {
    if (singleItem) {
      // Score against the single item, then keep only recipes that actually contain it
      return suggestRecipes([singleItem], allRecipes, { minCoverage: 0, maxResults: 100 })
        .filter((m) => m.matchedCount > 0)
        .slice(0, 20);
    }
    return suggestRecipes(pantryItems, allRecipes, { minCoverage: 20, maxResults: 20 });
  }, [pantryItems, allRecipes, singleItem]);

  const canMakeNow  = matches.filter((m) => m.canMakeNow);
  const almostThere = matches.filter((m) => !m.canMakeNow);

  // Close on Escape
  useEffect(() => {
    const handle = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handle);
    return () => document.removeEventListener("keydown", handle);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(0,0,0,0.55)",
          backdropFilter: "blur(2px)",
          zIndex: 200,
        }}
      />

      {/* Modal */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(680px, 95vw)",
        maxHeight: "85vh",
        display: "flex", flexDirection: "column",
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: 20,
        boxShadow: "0 24px 64px rgba(0,0,0,0.35)",
        zIndex: 201,
        overflow: "hidden",
      }}>

        {/* Header */}
        <div style={{
          padding: "20px 24px 16px",
          borderBottom: "1px solid var(--border)",
          flexShrink: 0,
        }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
            <div>
              <h2 style={{ margin: 0, fontSize: 17, fontWeight: 600, color: "var(--foreground)" }}>
                {singleItem ? `Recipes with ${singleItem.name}` : "What can you cook?"}
              </h2>
              <p style={{ margin: "4px 0 0", fontSize: 13, color: "var(--muted)" }}>
                {singleItem
                  ? `${matches.length} recipe${matches.length !== 1 ? "s" : ""} use this ingredient`
                  : `Based on ${pantryItems.length} item${pantryItems.length !== 1 ? "s" : ""} in your pantry`}
              </p>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: 20, color: "var(--muted)", padding: 0, lineHeight: 1,
              }}
              aria-label="Close"
            >×</button>
          </div>

          {/* Summary chips */}
          <div style={{ display: "flex", gap: 8, marginTop: 12, flexWrap: "wrap" }}>
            {canMakeNow.length > 0 && (
              <span style={{
                fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 500,
                background: "var(--olive-soft)", color: "var(--olive)",
              }}>
                ✓ {canMakeNow.length} ready to cook
              </span>
            )}
            {almostThere.length > 0 && (
              <span style={{
                fontSize: 12, padding: "3px 10px", borderRadius: 20, fontWeight: 500,
                background: "var(--saffron-soft)", color: "var(--saffron)",
              }}>
                ~ {almostThere.length} almost there
              </span>
            )}
            {matches.length === 0 && (
              <span style={{
                fontSize: 12, padding: "3px 10px", borderRadius: 20,
                background: "var(--surface-strong)", color: "var(--muted)",
              }}>
                No matches found
              </span>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
          {matches.length === 0 && <EmptyState pantryCount={pantryItems.length} />}

          {canMakeNow.length > 0 && (
            <Section title="Ready to cook" accent="green">
              {canMakeNow.map((m) => (
                <MatchRow key={m.recipe.id} match={m} onPlan={() => onPlan(m.recipe)} onView={() => onView(m.recipe)} onAddToList={addMissingToShoppingList} addingKey={addingToList} />
              ))}
            </Section>
          )}

          {almostThere.length > 0 && (
            <Section title="Almost there" subtitle="a few more ingredients needed" accent="amber">
              {almostThere.map((m) => (
                <MatchRow key={m.recipe.id} match={m} onPlan={() => onPlan(m.recipe)} onView={() => onView(m.recipe)} onAddToList={addMissingToShoppingList} addingKey={addingToList} />
              ))}
            </Section>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

function Section({ title, subtitle, accent, children }: {
  title: string; subtitle?: string; accent: "green" | "amber"; children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 4 }}>
      <div style={{ padding: "8px 24px 4px" }}>
        <span style={{
          fontSize: 10, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
          color: accent === "green" ? "var(--olive)" : "var(--saffron)",
        }}>
          {title}
        </span>
        {subtitle && (
          <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>{subtitle}</span>
        )}
      </div>
      {children}
    </div>
  );
}

// ─── Match row ────────────────────────────────────────────────────────────────

function MatchRow({ match, onPlan, onView, onAddToList, addingKey }: {
  match: RecipeMatch;
  onPlan: () => void;
  onView: () => void;
  onAddToList: (missing: string[]) => void;
  addingKey: string | null;
}) {
  const { recipe, matchedCount, totalRequired, coveragePercent, missingIngredients, canMakeNow, expiringUsed } = match;
  const thisKey = missingIngredients.join(",");
  const isAdding = addingKey === thisKey;

  const coverImage = Array.isArray(recipe.image_urls) && recipe.image_urls.length > 0
    ? recipe.image_urls[0]
    : recipe.cover_image_url ?? null;

  const barColor = canMakeNow
    ? "var(--olive)"
    : coveragePercent >= 70
    ? "var(--saffron)"
    : "var(--muted)";

  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 12,
        padding: "10px 24px",
        borderBottom: "1px solid var(--border)",
        transition: "background 0.1s",
        cursor: "default",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = "var(--surface-strong)")}
      onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
    >
      {/* Cover image */}
      <div style={{
        width: 52, height: 52, borderRadius: 8, flexShrink: 0,
        background: "var(--surface-strong)", overflow: "hidden",
        display: "flex", alignItems: "center", justifyContent: "center",
      }}>
        {coverImage
          ? <Image src={coverImage} alt={recipe.title_en} width={52} height={52} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
          : <span style={{ fontSize: 22 }}>🍽️</span>
        }
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          onClick={onView}
          style={{
            fontSize: 13, fontWeight: 500, color: "var(--foreground)",
            cursor: "pointer", overflow: "hidden",
            textOverflow: "ellipsis", whiteSpace: "nowrap",
          }}
        >
          {recipe.title_en}
        </div>

        {/* Coverage bar */}
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5 }}>
          <div style={{
            flex: 1, height: 4, borderRadius: 2,
            background: "var(--border)", overflow: "hidden", maxWidth: 120,
          }}>
            <div style={{
              height: "100%", width: `${coveragePercent}%`,
              background: barColor, borderRadius: 2,
              transition: "width 0.3s",
            }} />
          </div>
          <span style={{ fontSize: 11, color: "var(--muted)", whiteSpace: "nowrap" }}>
            {matchedCount}/{totalRequired} ingredients
          </span>
          {expiringUsed > 0 && (
            <span style={{
              fontSize: 10, fontWeight: 700, whiteSpace: "nowrap",
              padding: "1px 6px", borderRadius: 999,
              background: "rgba(245,158,11,0.15)", color: "#b45309",
            }}>
              ⏰ uses {expiringUsed} expiring
            </span>
          )}
        </div>

        {/* Missing chips + add to list */}
        {missingIngredients.length > 0 && (
          <div style={{ marginTop: 4, display: "flex", flexWrap: "wrap", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "var(--muted)" }}>Need:</span>
            {missingIngredients.slice(0, 4).map((name) => (
              <span key={name} style={{
                fontSize: 11, color: "var(--foreground)",
                background: "var(--surface-strong)",
                border: "1px solid var(--border)",
                borderRadius: 4, padding: "1px 5px",
              }}>
                {name}
              </span>
            ))}
            {missingIngredients.length > 4 && (
              <span style={{ fontSize: 11, color: "var(--muted)" }}>
                +{missingIngredients.length - 4} more
              </span>
            )}
            <button
              onClick={() => onAddToList(missingIngredients)}
              disabled={isAdding}
              style={{
                fontSize: 10, padding: "2px 7px", borderRadius: 4, cursor: "pointer",
                background: "none", border: "1px solid var(--border)",
                color: "var(--muted)", marginLeft: 2,
              }}
              title="Add all missing ingredients to shopping list"
            >
              {isAdding ? "Adding…" : "+ list"}
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
        <button
          onClick={onPlan}
          style={{
            fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer",
            background: "var(--accent)", color: "#fff", border: "none",
            fontWeight: 500, whiteSpace: "nowrap",
          }}
        >
          Plan →
        </button>
        <button
          onClick={onView}
          style={{
            fontSize: 12, padding: "5px 12px", borderRadius: 6, cursor: "pointer",
            background: "none", color: "var(--muted)",
            border: "1px solid var(--border)", whiteSpace: "nowrap",
          }}
        >
          View
        </button>
      </div>
    </div>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ pantryCount }: { pantryCount: number }) {
  return (
    <div style={{ textAlign: "center", padding: "48px 24px" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>🥘</div>
      <div style={{ fontSize: 15, fontWeight: 500, color: "var(--foreground)" }}>
        {pantryCount === 0 ? "Your pantry is empty" : "No recipes match your pantry items"}
      </div>
      <div style={{ fontSize: 13, color: "var(--muted)", marginTop: 6, maxWidth: 320, margin: "6px auto 0" }}>
        {pantryCount === 0
          ? "Add ingredients to your pantry to get recipe suggestions"
          : "Try adding more pantry items, or add recipes that use what you have"
        }
      </div>
    </div>
  );
}
