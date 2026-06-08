"use client";

import { useEffect, useState, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Search, SlidersHorizontal, FolderHeart, BookMarked, Eye, ChefHat, CalendarDays, Star, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import { useLibrary } from "@/components/LibraryProvider";
import RecipeCard from "@/components/RecipeCard";
import CreateCollectionModal from "@/components/CreateCollectionModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { RecipeSummary } from "@/types";

const SYSTEM_COLLECTIONS = [
  { key: "saved-plans",     label: "Saved Plans",     icon: <BookMarked size={20} /> },
  { key: "recently-viewed", label: "Recently Viewed", icon: <Eye size={20} /> },
  { key: "my-recipes",      label: "My Recipes",      icon: <ChefHat size={20} /> },
  { key: "planned",         label: "Planned",         icon: <CalendarDays size={20} /> },
  { key: "made-it",         label: "Made It",         icon: <Star size={20} /> },
] as const;

export default function LibraryPage() {
  const router = useRouter();
  const { savedIds, favouriteIds, collections, recentlyViewedIds, recentlyCookedIds, deleteCollection, unsave } = useLibrary();
  const addMenuRef = useRef<HTMLDivElement>(null);

  const [allRecipes, setAllRecipes]     = useState<RecipeSummary[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState("");
  const [sort, setSort]                 = useState<"newest" | "az">("newest");
  const [showAddMenu, setShowAddMenu]   = useState(false);
  const [showCreate, setShowCreate]     = useState(false);
  const [deleteColId, setDeleteColId]   = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<RecipeSummary | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Fetch all recipes (public + user's private) — RLS on Supabase will
      // naturally scope private recipes to the owner once auth is wired up.
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setAllRecipes(toRecipeSummaries(mapRecipeRows(data)));
      setLoading(false);
    })();
  }, []);

  // Close add-menu on outside click
  useEffect(() => {
    if (!showAddMenu) return;
    const handler = (e: MouseEvent) => {
      if (!addMenuRef.current?.contains(e.target as Node)) setShowAddMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showAddMenu]);

  const savedRecipes = useMemo(
    () => allRecipes.filter((r) => savedIds.has(r.id)),
    [allRecipes, savedIds]
  );

  const displayRecipes = useMemo(() => {
    let r = !search.trim() ? savedRecipes : savedRecipes.filter((x) => x.title.toLowerCase().includes(search.toLowerCase()));
    if (sort === "az") r = [...r].sort((a, b) => a.title.localeCompare(b.title));
    return r;
  }, [savedRecipes, search, sort]);

  // First available recipe image among a set of ids — used as a collection cover.
  const coverFor = useMemo(() => {
    const byId = new Map(allRecipes.map((r) => [r.id, r]));
    return (ids: string[]): string | null => {
      for (const id of ids) { const img = byId.get(id)?.imageUrl; if (img) return img; }
      return null;
    };
  }, [allRecipes]);

  async function handleDeleteRecipe(recipe: RecipeSummary) {
    await supabase.from("recipes").delete().eq("id", parseInt(recipe.id));
    unsave(recipe.id);
    setAllRecipes((prev) => prev.filter((r) => r.id !== recipe.id));
    setPendingDelete(null);
  }

  const systemCounts: Record<string, number> = useMemo(() => {
    const recentSet = new Set(recentlyViewedIds);
    const cookedSet = new Set(recentlyCookedIds);
    return {
      "saved-plans":     0,
      "recently-viewed": allRecipes.filter((r) => recentSet.has(r.id)).length,
      "my-recipes":      savedIds.size,
      "planned":         0,
      "made-it":         allRecipes.filter((r) => cookedSet.has(r.id)).length,
      "favourites":      favouriteIds.size,
    };
  }, [allRecipes, recentlyViewedIds, recentlyCookedIds, savedIds, favouriteIds]);

  return (
    <main className="container">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 700 }}>Library</h1>

        {/* + Add dropdown */}
        <div style={{ position: "relative" }} ref={addMenuRef}>
          <button className="library-add-btn" onClick={() => setShowAddMenu((v) => !v)}>
            <Plus size={14} /> Add
          </button>
          {showAddMenu && (
            <div className="library-add-menu">
              <button className="library-add-menu-item" onClick={() => { setShowAddMenu(false); router.push("/add?source=url"); }}>
                Add recipe from URL
              </button>
              <button className="library-add-menu-item" onClick={() => { setShowAddMenu(false); router.push("/add"); }}>
                Create new recipe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Search ─────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "2rem" }}>
        <div style={{ flex: 1, position: "relative", display: "flex", alignItems: "center" }}>
          <Search size={15} style={{ position: "absolute", left: 12, color: "var(--muted)", pointerEvents: "none" }} />
          <input
            className="library-search-input"
            type="search"
            placeholder="Search saved recipes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: "36px" }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ position: "absolute", right: 10, background: "none", border: "none", cursor: "pointer", color: "var(--muted)", display: "flex", alignItems: "center" }}>
              <X size={13} />
            </button>
          )}
        </div>
        <button className="library-filter-btn" aria-label="Filter">
          <SlidersHorizontal size={15} />
        </button>
      </div>

      {/* ── Collections (horizontal carousel) ──────────────────────────── */}
      <section style={{ marginBottom: "2.25rem" }}>
        <h2 className="library-section-title">Collections</h2>
        <div className="library-collections-row">
          {SYSTEM_COLLECTIONS.map((col) => {
            const ids = col.key === "recently-viewed" ? recentlyViewedIds
              : col.key === "made-it" ? recentlyCookedIds
              : col.key === "my-recipes" ? [...savedIds] : [];
            const cover = coverFor(ids);
            const count = systemCounts[col.key] ?? 0;
            return (
              <div key={col.key} className="library-collection">
                <div className="library-collection-cover" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
                  {!cover && <span className="library-collection-icon">{col.icon}</span>}
                </div>
                <div className="library-collection-name">{col.label}</div>
                <div className="library-collection-count">{count} recipe{count !== 1 ? "s" : ""}</div>
              </div>
            );
          })}

          {collections.map((col) => {
            const cover = coverFor(col.recipeIds);
            return (
              <div key={col.id} className="library-collection">
                <div className="library-collection-cover" style={cover ? { backgroundImage: `url(${cover})` } : undefined}>
                  {!cover && <span className="library-collection-icon"><FolderHeart size={22} /></span>}
                  <button className="library-collection-delete" onClick={() => setDeleteColId(col.id)} aria-label="Delete collection"><X size={11} /></button>
                </div>
                <div className="library-collection-name">{col.name}</div>
                <div className="library-collection-count">{col.recipeIds.length} recipe{col.recipeIds.length !== 1 ? "s" : ""}</div>
              </div>
            );
          })}

          <button className="library-collection library-collection--create" onClick={() => setShowCreate(true)}>
            <div className="library-collection-cover"><span className="library-collection-icon"><Plus size={22} /></span></div>
            <div className="library-collection-name">New collection</div>
          </button>
        </div>
      </section>

      {/* ── Recipes ────────────────────────────────────────────────────── */}
      <section>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 className="library-section-title" style={{ marginBottom: 0 }}>
            Recipes
            {savedRecipes.length > 0 && <span className="library-count">{savedRecipes.length}</span>}
          </h2>
          <button type="button" className="discover-control" style={{ padding: "6px 12px" }}
            onClick={() => setSort((s) => (s === "newest" ? "az" : "newest"))}>
            {sort === "newest" ? "Newest" : "A to Z"}
          </button>
        </div>

        {loading ? (
          <p style={{ color: "var(--muted)" }}>Loading…</p>
        ) : displayRecipes.length === 0 ? (
          <div className="library-empty">
            {savedIds.size === 0 ? (
              <>
                <BookMarked size={32} style={{ opacity: 0.3, marginBottom: "0.5rem" }} />
                <p>No saved recipes yet.</p>
                <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                  Browse <Link href="/discover" style={{ color: "var(--accent-strong)" }}>Discover</Link> and hit Save on any recipe.
                </p>
              </>
            ) : (
              <p>No results for &ldquo;{search}&rdquo;</p>
            )}
          </div>
        ) : (
          <motion.div
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          >
            <AnimatePresence>
              {displayRecipes.map((recipe) => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onEdit={() => router.push(`/edit/${recipe.id}`)}
                  onDelete={() => setPendingDelete(recipe)}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {showCreate && <CreateCollectionModal onClose={() => setShowCreate(false)} />}

      {deleteColId && (
        <ConfirmDialog
          open={true}
          title="Delete collection?"
          message="Saved recipes won't be removed."
          confirmLabel="Delete"
          onConfirm={() => { deleteCollection(deleteColId); setDeleteColId(null); }}
          onCancel={() => setDeleteColId(null)}
        />
      )}

      {pendingDelete && (
        <ConfirmDialog
          open={true}
          title="Delete recipe?"
          message={`"${pendingDelete.title}" will be permanently removed.`}
          confirmLabel="Delete"
          onConfirm={() => handleDeleteRecipe(pendingDelete)}
          onCancel={() => setPendingDelete(null)}
        />
      )}
    </main>
  );
}
