"use client";

/**
 * Home — /
 *
 * Warm, fast, heirloom cookbook homepage.
 * Animations stripped — replaced with instant CSS transitions for performance.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Search, X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import type { AppUser, RecipeRecord } from "@/lib/recipe-types";
import type { RecipeSummary, RecipeTag } from "@/types";
import RecipeCard from "@/components/RecipeCard";
import RecipeRail from "@/components/RecipeRail";
import ConfirmDialog from "@/components/ConfirmDialog";
import { useLibrary } from "@/components/LibraryProvider";
import { usePreferences } from "@/components/PreferencesProvider";
import { usePantry } from "@/components/PantryProvider";
import { logSearchDb, fetchSearchHistory } from "@/lib/library";
import type { DietKey } from "@/lib/preferences";

// Map a diet preference to the recipe tags that satisfy it.
const DIET_TO_TAGS: Record<DietKey, RecipeTag[]> = {
  vegetarian:    ["veg", "vegan"],
  vegan:         ["vegan"],
  "high-protein": ["high-protein"],
};

const SLOT_LABEL: Record<string, string> = {
  breakfast: "Breakfast", lunch: "Lunch", dinner: "Dinner", snack: "Snack",
};

// ── Quick-nav card ────────────────────────────────────────────────────────────
// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const router = useRouter();
  const { recentlyViewedIds } = useLibrary();
  const { prefs } = usePreferences();
  const { ready: pantryReady, has: pantryHas } = usePantry();
  const [records,       setRecords]       = useState<RecipeRecord[]>([]);
  const [pool,          setPool]          = useState<RecipeSummary[]>([]);
  const [planToday,     setPlanToday]     = useState<{ slot: string; title: string }[]>([]);
  const [groceryCount,  setGroceryCount]  = useState(0);
  const [cookProgress,  setCookProgress]  = useState<{ recipeId: string; title: string; step: number; total: number } | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [cookStats, setCookStats] = useState<{ streak: number; week: number }>({ streak: 0, week: 0 });
  const [user,          setUser]          = useState<AppUser | null>(null);
  const [loading,       setLoading]       = useState(true);
  const [search,        setSearch]        = useState("");
  const [deleteTarget,  setDeleteTarget]  = useState<string | null>(null);
  const [isDeleting,    setIsDeleting]    = useState(false);

  // ── Load ──────────────────────────────────────────────────────────────────
  const loadRecipes = useCallback(async (currentUser: AppUser | null) => {
    if (!currentUser) { setRecords([]); setLoading(false); return; }
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("user_id", currentUser.id)
      .order("id", { ascending: false });
    if (error) { toast.error("Could not load recipes"); }
    else { setRecords(mapRecipeRows(data ?? [])); }
    setLoading(false);
  }, []);

  // Dashboard data: accessible recipe pool (for rails), today's plan, grocery count.
  const loadDashboard = useCallback(async (currentUser: AppUser | null) => {
    if (!currentUser) { setPool([]); setPlanToday([]); setGroceryCount(0); return; }

    const today = new Date().toISOString().slice(0, 10);
    const [poolRes, mealRes, groceryRes, searches, cooksRes] = await Promise.all([
      supabase.from("recipes").select("*").order("id", { ascending: false }).limit(60),
      supabase.from("planned_meals").select("meal_slot, recipe_id").eq("meal_date", today),
      supabase.from("shopping_list").select("id", { count: "exact", head: true }).eq("checked", false),
      fetchSearchHistory(8),
      supabase.from("cook_history").select("cooked_at").order("cooked_at", { ascending: false }).limit(200),
    ]);
    setRecentSearches(searches);

    // Cooking streak + this-week count from cook_history.
    const iso = (d: Date) => d.toISOString().slice(0, 10);
    const cookedDays = new Set((cooksRes.data ?? []).map((c) => iso(new Date(c.cooked_at as string))));
    let streak = 0;
    const cursor = new Date();
    if (!cookedDays.has(iso(cursor))) cursor.setDate(cursor.getDate() - 1); // today optional
    while (cookedDays.has(iso(cursor))) { streak++; cursor.setDate(cursor.getDate() - 1); }
    const weekAgo = Date.now() - 7 * 86_400_000;
    const week = (cooksRes.data ?? []).filter((c) => new Date(c.cooked_at as string).getTime() >= weekAgo).length;
    setCookStats({ streak, week });

    const poolSummaries = poolRes.data ? toRecipeSummaries(mapRecipeRows(poolRes.data)) : [];
    setPool(poolSummaries);

    const titleById = new Map(poolSummaries.map((r) => [r.id, r.title]));
    const order = ["breakfast", "lunch", "dinner", "snack"];
    setPlanToday(
      (mealRes.data ?? [])
        .map((m) => ({ slot: String(m.meal_slot), title: titleById.get(String(m.recipe_id)) ?? "Planned meal" }))
        .sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot)),
    );
    setGroceryCount(groceryRes.count ?? 0);
  }, []);

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!alive) return;
      if (!u) { router.replace("/welcome"); return; } // first-launch landing
      setUser(u);
      await Promise.all([loadRecipes(u), loadDashboard(u)]);
    };
    void run();
    return () => { alive = false; };
  }, [loadRecipes, loadDashboard, router]);

  // Resume a cooking session if one is in progress (set by the recipe page).
  useEffect(() => {
    try {
      const raw = localStorage.getItem("cookbook:cooking-progress");
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setCookProgress(JSON.parse(raw));
    } catch { /* ignore */ }
  }, []);

  const summaries = useMemo(() => toRecipeSummaries(records), [records]);

  // Recently Viewed rail — pool entries in view order.
  const recentlyViewed = useMemo(() => {
    const byId = new Map(pool.map((r) => [r.id, r]));
    return recentlyViewedIds
      .map((id) => byId.get(id))
      .filter((r): r is RecipeSummary => Boolean(r))
      .slice(0, 12);
  }, [pool, recentlyViewedIds]);

  // Recommended rail — filtered by the user's diet prefs, excluding recents.
  const recommended = useMemo(() => {
    const recentSet = new Set(recentlyViewedIds);
    const targetTags = new Set(prefs.diets.flatMap((d) => DIET_TO_TAGS[d] ?? []));
    let list = pool.filter((r) => !recentSet.has(r.id));
    if (targetTags.size > 0) list = list.filter((r) => r.tags.some((t) => targetTags.has(t)));
    return list.slice(0, 12);
  }, [pool, recentlyViewedIds, prefs.diets]);

  // "What can I cook right now?" — recipes whose ingredients are all in the pantry.
  const cookNow = useMemo(() => {
    if (!pantryReady) return [];
    return pool.filter((r) => r.ingredientLinks.length > 0 && r.ingredientLinks.every((l) => pantryHas(l))).slice(0, 12);
  }, [pool, pantryReady, pantryHas]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter((s) =>
      [s.title, s.cuisine, s.category ?? "", s.tags.join(" ")]
        .join(" ").toLowerCase().includes(q)
    );
  }, [summaries, search]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const numId = parseInt(deleteTarget);
    const { error } = await supabase.from("recipes").delete().eq("id", numId);
    if (error) { toast.error(error.message); }
    else {
      setRecords((prev) => prev.filter((r) => r.id !== numId));
      toast.success("Recipe removed");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  // Rotate Today's Pick daily using a deterministic date-seeded index.
  // Same date always shows the same recipe; changes automatically at midnight.
  const latest    = filtered.slice(0, 9);

  return (
    <>
      <Toaster position="top-right" />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* ── Header + search ───────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 pt-8 pb-2">
          <h1 className="text-2xl font-bold" style={{ color: "var(--foreground)" }}>My Cookbook</h1>
          <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>What would you like to cook today?</p>
          <div className="relative" style={{ maxWidth: 560 }}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)", opacity: 0.6 }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && search.trim()) void logSearchDb(search.trim()); }}
              placeholder="Search recipes or ingredients"
              className="w-full py-3 rounded-xl text-sm focus:outline-none"
              style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)", paddingLeft: "2.5rem", paddingRight: "2.25rem" }}
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }}>
                <X size={14} />
              </button>
            )}
          </div>
          {!search && recentSearches.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <span className="text-[11px] self-center" style={{ color: "var(--muted)" }}>Recent:</span>
              {recentSearches.slice(0, 6).map((term) => (
                <button key={term} type="button" onClick={() => setSearch(term)} className="text-[11px] px-2.5 py-1 rounded-full"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                  {term}
                </button>
              ))}
            </div>
          )}
        </section>

        {/* ── Dashboard (logged-in) ─────────────────────────────────────── */}
        {!loading && user && (
          <section className="max-w-5xl mx-auto px-4 pb-2">

            {/* Continue cooking */}
            {cookProgress && (
              <Link href={`/recipe/${cookProgress.recipeId}`}
                className="flex items-center gap-3 rounded-2xl p-4 mb-6 border transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)", color: "#fff8f1" }}>
                <span className="text-2xl">🍳</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold uppercase tracking-widest" style={{ opacity: 0.8 }}>Continue cooking</p>
                  <p className="font-semibold truncate">{cookProgress.title}</p>
                  {cookProgress.total > 0 && (
                    <p className="text-sm" style={{ opacity: 0.85 }}>Step {cookProgress.step + 1} of {cookProgress.total}</p>
                  )}
                </div>
                <span className="flex-shrink-0 text-sm font-semibold">Resume →</span>
              </Link>
            )}

            {/* Plan + grocery preview */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
              <Link href="/planner" className="rounded-2xl p-4 border transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--accent)", opacity: 0.85 }}>
                  Today&apos;s plan
                </p>
                {planToday.length === 0 ? (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Nothing planned — tap to add meals.</p>
                ) : (
                  <ul className="space-y-1">
                    {planToday.map((m, i) => (
                      <li key={i} className="text-sm" style={{ color: "var(--foreground)" }}>
                        <span style={{ color: "var(--muted)" }}>{SLOT_LABEL[m.slot] ?? m.slot}:</span> {m.title}
                      </li>
                    ))}
                  </ul>
                )}
              </Link>

              <Link href="/shopping" className="rounded-2xl p-4 border transition-all hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "var(--surface)", borderColor: "var(--border)" }}>
                <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "var(--accent)", opacity: 0.85 }}>
                  Shopping list
                </p>
                {groceryCount === 0 ? (
                  <p className="text-sm" style={{ color: "var(--muted)" }}>All caught up — nothing to buy.</p>
                ) : (
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>
                    <strong>{groceryCount}</strong> item{groceryCount === 1 ? "" : "s"} remaining to buy →
                  </p>
                )}
              </Link>
            </div>

            {cookStats.streak > 0 || cookStats.week > 0 ? (
              <div className="flex flex-wrap gap-2 mb-6">
                {cookStats.streak > 0 && (
                  <span className="text-sm font-semibold px-3 py-1.5 rounded-full" style={{ background: "rgba(232,132,74,0.14)", color: "var(--accent-strong)" }}>
                    🔥 {cookStats.streak}-day cooking streak
                  </span>
                )}
                {cookStats.week > 0 && (
                  <span className="text-sm font-semibold px-3 py-1.5 rounded-full" style={{ background: "var(--surface)", border: "1px solid var(--border)", color: "var(--foreground)" }}>
                    🍳 {cookStats.week} cooked this week
                  </span>
                )}
              </div>
            ) : null}

            <RecipeRail title="Cook now from your pantry" recipes={cookNow} href="/pantry" />
            <RecipeRail title="Recently viewed" recipes={recentlyViewed} href="/recipes" />
            <RecipeRail
              title={prefs.diets.length > 0 ? "Recommended for you" : "Recommended"}
              recipes={recommended}
              href="/recipes"
            />
          </section>
        )}

        {/* ── Recipe grid ───────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 pb-20">

          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold" style={{ color: "var(--foreground)" }}>
              {search ? "Search results" : "All recipes"}
            </h2>
            <span className="text-sm" style={{ color: "var(--muted)" }}>
              {filtered.length} {filtered.length === 1 ? "recipe" : "recipes"}
            </span>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl overflow-hidden border"
                  style={{ borderColor: "var(--border)" }}
                >
                  <div
                    className="h-28"
                    style={{
                      background: "linear-gradient(90deg, var(--surface-soft), var(--parchment), var(--surface-soft))",
                      backgroundSize: "200% 100%",
                      animation: "skeleton-sheen 1.8s ease-in-out infinite",
                    }}
                  />
                  <div className="p-4 space-y-2.5" style={{ background: "var(--surface)" }}>
                    <div className="h-4 rounded-lg w-3/4" style={{ background: "var(--oat)" }} />
                    <div className="h-3 rounded-lg w-1/2" style={{ background: "var(--surface-soft)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <div className="text-6xl mb-5">🍳</div>
              <h2
                className="text-xl font-semibold mb-2"
                style={{ color: "var(--foreground)" }}
              >
                {records.length === 0 ? "The cookbook is empty" : "No recipes match"}
              </h2>
              <p className="text-sm mb-6 leading-relaxed" style={{ color: "var(--muted)" }}>
                {records.length === 0
                  ? "Begin with a recipe your family loves —\na dish, a memory, a story worth keeping."
                  : "Try a different search term."}
              </p>
              {records.length === 0 && (
                <Link
                  href="/add"
                  className="text-sm font-semibold hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  Add the first recipe →
                </Link>
              )}
            </div>
          )}

          {/* Recipe grid */}
          {!loading && latest.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-5">
                <div />
                {!search && filtered.length > 9 && (
                  <Link
                    href="/recipes"
                    className="text-sm font-medium hover:underline transition"
                    style={{ color: "var(--accent)" }}
                  >
                    View all {filtered.length} →
                  </Link>
                )}
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {latest.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    onEdit={() => { router.push(`/edit/${recipe.id}`); }}
                    onDelete={() => setDeleteTarget(recipe.id)}
                  />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Remove this recipe?"
        message="This will permanently remove the recipe from your cookbook. This cannot be undone."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </>
  );
}
