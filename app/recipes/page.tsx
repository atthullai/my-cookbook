"use client";

/**
 * Recipe Library — /recipes
 *
 * Features:
 * - Grid of RecipeCard components with staggered Framer Motion entrance
 * - Top filter bar: search, cuisine multi-select (grouped Indian/Global),
 *   tag filter chips, max time slider, sort dropdown
 * - Edit → navigate to /edit/[id]; Delete → ConfirmDialog → Supabase
 * - Empty state with CTA when no results
 * - Floating "+ Add Recipe" button
 * - react-hot-toast for success/error feedback
 */
import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Search, SlidersHorizontal, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import { ALL_CUISINE_ORIGINS, INDIAN_CUISINE_ORIGINS, getCuisineTheme } from "@/lib/cuisine-themes";
import { ALL_TAGS, TAG_META } from "@/lib/recipe-tags";
import RecipeCard from "@/components/RecipeCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { RecipeSummary, CuisineOrigin, RecipeTag } from "@/types";

// Slow, breathing, handcrafted — Tamil Nadu motion philosophy
const EASE_WARM = [0.25, 0.1, 0.4, 1.0] as const;

// Stagger container for the recipe grid — organic, not mechanical
const gridVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.07 } },
};

const GLOBAL_ORIGINS = ALL_CUISINE_ORIGINS.filter(
  (o) => !INDIAN_CUISINE_ORIGINS.includes(o)
);

export default function RecipesPage() {
  const [recipes, setRecipes]           = useState<RecipeSummary[]>([]);
  const [loading, setLoading]           = useState(true);
  const [loadError, setLoadError]       = useState("");
  const [search, setSearch]             = useState("");
  const [cuisines, setCuisines]         = useState<CuisineOrigin[]>([]);
  const [tags, setTags]                 = useState<RecipeTag[]>([]);
  const [maxTime, setMaxTime]           = useState<number>(120);
  const [sortBy, setSortBy]             = useState<"newest" | "oldest" | "name-az" | "time-quick">("newest");
  const [deleteTarget, setDeleteTarget] = useState<RecipeSummary | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [showFilters, setShowFilters]   = useState(false);

  // ── Load recipes ─────────────────────────────────────────────────────────
  const loadRecipes = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setRecipes(toRecipeSummaries(mapRecipeRows(data ?? [])));
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to load recipes";
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadRecipes(); }, [loadRecipes]);

  // ── Filtering & sorting ───────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let result = recipes;

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.title.toLowerCase().includes(q));
    }

    // Cuisine filter
    if (cuisines.length > 0) {
      result = result.filter((r) => cuisines.includes(r.cuisine));
    }

    // Tag filter
    if (tags.length > 0) {
      result = result.filter((r) => tags.some((t) => r.tags.includes(t)));
    }

    // Time filter
    result = result.filter(
      (r) => r.prepTimeMinutes + r.cookTimeMinutes <= maxTime
    );

    // Sort
    return [...result].sort((a, b) => {
      if (sortBy === "name-az")    return a.title.localeCompare(b.title);
      if (sortBy === "time-quick") return (a.prepTimeMinutes + a.cookTimeMinutes) - (b.prepTimeMinutes + b.cookTimeMinutes);
      if (sortBy === "oldest")     return parseInt(a.id) - parseInt(b.id);
      return parseInt(b.id) - parseInt(a.id); // newest
    });
  }, [recipes, search, cuisines, tags, maxTime, sortBy]);

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from("recipes")
        .delete()
        .eq("id", parseInt(deleteTarget.id));
      if (error) throw error;
      setRecipes((prev) => prev.filter((r) => r.id !== deleteTarget.id));
      toast.success(`"${deleteTarget.title}" deleted`);
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setIsDeleting(false);
    }
  };

  // ── Toggle helpers ────────────────────────────────────────────────────────
  const toggleCuisine = (c: CuisineOrigin) =>
    setCuisines((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const toggleTag = (t: RecipeTag) =>
    setTags((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);

  const clearFilters = () => {
    setSearch(""); setCuisines([]); setTags([]); setMaxTime(120);
  };

  const activeFilterCount = cuisines.length + tags.length + (maxTime < 120 ? 1 : 0);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <>
      <Toaster position="top-right" />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* ── Page hero ── */}
        <section
          className="relative overflow-hidden px-5 pt-10 pb-8 border-b"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 80% 0%, rgba(212,168,83,.07) 0%, transparent 60%), radial-gradient(ellipse 50% 80% at 5% 100%, rgba(232,132,74,.05) 0%, transparent 60%), var(--linen)",
            borderColor: "var(--border)",
          }}
        >
          <div className="max-w-7xl mx-auto flex items-end justify-between gap-5 flex-wrap">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE_WARM }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="h-px w-5" style={{ background: "var(--saffron)" }} />
                <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--saffron)" }}>
                  Your heirloom collection
                </span>
              </div>
              <h1 className="font-bold leading-tight mb-1" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--foreground)" }}>
                My <em style={{ color: "var(--accent)", fontStyle: "italic" }}>Recipes</em>
              </h1>
              <p className="text-sm italic" style={{ color: "var(--muted)" }}>
                {recipes.length > 0
                  ? `${recipes.length} recipe${recipes.length !== 1 ? "s" : ""} in your cookbook`
                  : "Your cookbook"}
              </p>
            </motion.div>
            <Link
              href="/add"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition"
              style={{ background: "var(--accent)", color: "#fff" }}
            >
              <Plus size={16} /> Add Recipe
            </Link>
          </div>
        </section>

        <div className="max-w-7xl mx-auto px-5 py-6">

          {/* ── Quick filter chips + search + full-filters toggle ── */}
          <div className="flex flex-wrap gap-2 mb-4 items-center">
            {/* All */}
            <button
              type="button"
              onClick={() => { setTags([]); setCuisines([]); }}
              className="px-3 py-1.5 rounded-full text-xs font-medium border transition"
              style={tags.length === 0 && cuisines.length === 0
                ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                : { background: "transparent", color: "var(--foreground)", borderColor: "var(--border)" }}
            >
              All
            </button>
            {/* Quick tag chips */}
            {(["veg", "spicy", "quick", "high-protein"] as RecipeTag[]).map((tag) => {
              const meta = TAG_META[tag];
              const active = tags.includes(tag);
              return (
                <button key={tag} type="button" onClick={() => toggleTag(tag)}
                  className="px-3 py-1.5 rounded-full text-xs font-medium border transition"
                  style={active
                    ? { background: "var(--accent)", color: "#fff", borderColor: "var(--accent)" }
                    : { background: "transparent", color: "var(--foreground)", borderColor: "var(--border)" }}
                >
                  {meta.emoji} {meta.label}
                </button>
              );
            })}
            {/* Search */}
            <div className="relative flex-1 min-w-[140px]">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)" }} />
              <input
                type="text"
                placeholder="Search recipes…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 rounded-full text-xs focus:outline-none"
                style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)" }}
              />
            </div>
            {/* Full filters */}
            <button
              type="button"
              onClick={() => setShowFilters((f) => !f)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-medium transition"
              style={{
                background: showFilters ? "var(--accent)" : "transparent",
                color: showFilters ? "#fff" : "var(--foreground)",
                borderColor: showFilters ? "var(--accent)" : "var(--border)",
              }}
            >
              <SlidersHorizontal size={12} />
              Filters
              {activeFilterCount > 0 && (
                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold"
                  style={{ background: showFilters ? "rgba(255,255,255,0.3)" : "var(--accent)", color: "#fff" }}>
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          {/* ── Expandable filter panel ─────────────────────────────── */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden"
              >
                <div
                  className="rounded-2xl p-5 mb-5 space-y-5"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  {/* Sort */}
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-xs font-semibold uppercase tracking-wide w-16"
                      style={{ color: "var(--muted)" }}>Sort</span>
                    {(["newest","oldest","name-az","time-quick"] as const).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setSortBy(s)}
                        className="px-3 py-1.5 rounded-lg text-xs font-medium border transition"
                        style={{
                          background: sortBy === s ? "var(--accent)" : "transparent",
                          color: sortBy === s ? "#fff" : "var(--foreground)",
                          borderColor: sortBy === s ? "var(--accent)" : "var(--border)",
                        }}
                      >
                        {{ newest:"Newest", oldest:"Oldest", "name-az":"A→Z", "time-quick":"Quickest" }[s]}
                      </button>
                    ))}
                  </div>

                  {/* Time slider */}
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-semibold uppercase tracking-wide w-16"
                      style={{ color: "var(--muted)" }}>Time</span>
                    <input
                      type="range" min={10} max={120} step={5}
                      value={maxTime}
                      onChange={(e) => setMaxTime(Number(e.target.value))}
                      className="flex-1"
                      style={{ accentColor: "var(--accent)" }}
                    />
                    <span className="text-sm w-16" style={{ color: "var(--foreground)" }}>≤ {maxTime} min</span>
                  </div>

                  {/* Indian cuisines */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: "var(--muted)" }}>🇮🇳 Indian Cuisines</p>
                    <div className="flex flex-wrap gap-2">
                      {INDIAN_CUISINE_ORIGINS.map((c) => {
                        const t = getCuisineTheme(c);
                        const active = cuisines.includes(c);
                        return (
                          <button key={c} type="button" onClick={() => toggleCuisine(c)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition"
                            style={{
                              background: active ? "var(--accent)" : "transparent",
                              color: active ? "#fff" : "var(--foreground)",
                              borderColor: active ? "var(--accent)" : "var(--border)",
                            }}
                          >
                            {t.emoji} {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Global cuisines */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: "var(--muted)" }}>🌍 World Kitchen</p>
                    <div className="flex flex-wrap gap-2">
                      {GLOBAL_ORIGINS.map((c) => {
                        const t = getCuisineTheme(c);
                        const active = cuisines.includes(c);
                        return (
                          <button key={c} type="button" onClick={() => toggleCuisine(c)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition"
                            style={{
                              background: active ? "var(--accent)" : "transparent",
                              color: active ? "#fff" : "var(--foreground)",
                              borderColor: active ? "var(--accent)" : "var(--border)",
                            }}
                          >
                            {t.emoji} {t.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Tags */}
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide mb-2"
                      style={{ color: "var(--muted)" }}>Tags</p>
                    <div className="flex flex-wrap gap-2">
                      {ALL_TAGS.map((tag) => {
                        const meta = TAG_META[tag];
                        return (
                          <button key={tag} type="button" onClick={() => toggleTag(tag)}
                            className={[
                              "flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium border transition",
                              tags.includes(tag)
                                ? `${meta.color} ${meta.textColor} ${meta.borderColor}`
                                : "",
                            ].join(" ")}
                            style={!tags.includes(tag) ? {
                              background: "transparent",
                              color: "var(--foreground)",
                              borderColor: "var(--border)",
                            } : {}}
                          >
                            {meta.emoji} {meta.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {activeFilterCount > 0 && (
                    <button type="button" onClick={clearFilters}
                      className="flex items-center gap-1 text-xs transition"
                      style={{ color: "#dc2626" }}
                    >
                      <X size={12} /> Clear all filters
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Section label ── */}
          {!loading && (
            <div className="flex items-center gap-3 mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-[0.1em] whitespace-nowrap" style={{ color: "var(--muted)" }}>
                Saved recipes
              </span>
              <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, var(--border), transparent)" }} />
              <span className="text-[10px] font-semibold tabular-nums" style={{ color: "var(--muted)" }}>
                {filtered.length}{filtered.length !== recipes.length ? ` of ${recipes.length}` : ""} recipe{filtered.length !== 1 ? "s" : ""}
              </span>
            </div>
          )}

          {/* ── Loading skeletons ───────────────────────────────────── */}
          {loading && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i}
                  className="rounded-2xl overflow-hidden animate-pulse"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                >
                  <div className="h-24" style={{ background: "rgba(180, 120, 30, 0.08)" }} />
                  <div className="p-3 space-y-2">
                    <div className="h-4 rounded w-3/4" style={{ background: "rgba(180, 120, 30, 0.1)" }} />
                    <div className="h-3 rounded w-1/2" style={{ background: "rgba(180, 120, 30, 0.07)" }} />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── Error state ─────────────────────────────────────────── */}
          {!loading && loadError && (
            <div className="text-center py-16">
              <p className="text-red-500 mb-3">{loadError}</p>
              <button type="button" onClick={loadRecipes}
                className="text-sm hover:underline"
                style={{ color: "var(--accent)" }}
              >
                Try again
              </button>
            </div>
          )}

          {/* ── Empty state ─────────────────────────────────────────── */}
          {!loading && !loadError && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: EASE_WARM }}
              className="text-center py-20"
            >
              <span className="text-7xl block mb-4" aria-hidden="true">🍳</span>
              <h2 className="text-xl font-semibold mb-2" style={{ color: "var(--foreground)" }}>
                {recipes.length === 0 ? "Your cookbook is empty" : "No recipes match your filters"}
              </h2>
              <p className="text-sm mb-6" style={{ color: "var(--muted)" }}>
                {recipes.length === 0
                  ? "Add your first recipe to get started."
                  : "Try adjusting the filters or search term."}
              </p>
              {recipes.length === 0 && (
                <Link href="/add"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm transition"
                  style={{ background: "var(--accent)", color: "#fff" }}
                >
                  <Plus size={16} /> Add Your First Recipe
                </Link>
              )}
              {recipes.length > 0 && (
                <button type="button" onClick={clearFilters}
                  className="text-sm hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  Clear filters
                </button>
              )}
            </motion.div>
          )}

          {/* ── Recipe grid ─────────────────────────────────────────── */}
          {!loading && !loadError && filtered.length > 0 && (
            <motion.div
              variants={gridVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            >
              {filtered.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onEdit={() => window.location.assign(`/edit/${recipe.id}`)}
                  onDelete={() => setDeleteTarget(recipe)}
                />
              ))}
            </motion.div>
          )}
        </div>{/* end page content */}

        {/* ── Floating add button (mobile) ──────────────────────────── */}
        <Link
          href="/add"
          aria-label="Add recipe"
          className="fixed bottom-6 right-6 sm:hidden w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition"
          style={{ background: "var(--accent)", color: "#fff" }}
        >
          <Plus size={24} />
        </Link>
      </main>

      {/* ── Confirm delete dialog ─────────────────────────────────────── */}
      <ConfirmDialog
        open={!!deleteTarget}
        title={`Delete "${deleteTarget?.title}"?`}
        message="This will permanently remove the recipe from your cookbook. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </>
  );
}
