"use client";

import { useEffect, useState, useMemo } from "react";
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
import { getRecentlyViewedIds } from "@/lib/library";
import type { RecipeSummary } from "@/types";

// ── System collections definition ──────────────────────────────────────────
const SYSTEM_COLLECTIONS = [
  { key: "saved-plans",      label: "Saved Plans",      icon: <BookMarked size={18} />,   desc: "Meal plans you bookmarked" },
  { key: "recently-viewed",  label: "Recently Viewed",  icon: <Eye size={18} />,          desc: "Recipes you opened lately" },
  { key: "my-recipes",       label: "My Recipes",       icon: <ChefHat size={18} />,      desc: "Recipes you created" },
  { key: "planned",          label: "Planned",          icon: <CalendarDays size={18} />, desc: "On your meal planner" },
  { key: "made-it",          label: "Made It",          icon: <Star size={18} />,         desc: "Recipes you've cooked" },
] as const;

export default function LibraryPage() {
  const router = useRouter();
  const { savedIds, collections, deleteCollection } = useLibrary();

  const [allRecipes, setAllRecipes]   = useState<RecipeSummary[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [deleteColId, setDeleteColId] = useState<string | null>(null);

  // Load all recipes once so we can filter by savedIds
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("recipes")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) {
        const rows = mapRecipeRows(data);
        setAllRecipes(toRecipeSummaries(rows));
      }
      setLoading(false);
    })();
  }, []);

  // Recipes the user saved
  const savedRecipes = useMemo(
    () => allRecipes.filter((r) => savedIds.has(r.id)),
    [allRecipes, savedIds]
  );

  // Filtered by search query
  const displayRecipes = useMemo(() => {
    if (!search.trim()) return savedRecipes;
    const q = search.toLowerCase();
    return savedRecipes.filter((r) => r.title.toLowerCase().includes(q));
  }, [savedRecipes, search]);

  // System collection counts
  const systemCounts: Record<string, number> = useMemo(() => {
    const recentIds = new Set(getRecentlyViewedIds());
    return {
      "saved-plans":     0, // future
      "recently-viewed": allRecipes.filter((r) => recentIds.has(r.id)).length,
      "my-recipes":      allRecipes.filter((r) => (r as RecipeSummary & { author?: string }).author === "Atthuzhai").length,
      "planned":         0, // future
      "made-it":         0, // future
    };
  }, [allRecipes]);

  return (
    <main className="library-page">
      {/* ── Page header ─────────────────────────────────────────────────── */}
      <div className="library-header">
        <h1 className="library-title">Library</h1>

        {/* + Add dropdown */}
        <div style={{ position: "relative" }}>
          <button
            className="library-add-btn"
            onClick={() => setShowAddMenu((v) => !v)}
          >
            <Plus size={15} /> Add
          </button>
          {showAddMenu && (
            <div className="library-add-menu">
              <button
                className="library-add-menu-item"
                onClick={() => { setShowAddMenu(false); router.push("/add?source=url"); }}
              >
                Add recipe from URL
              </button>
              <button
                className="library-add-menu-item"
                onClick={() => { setShowAddMenu(false); router.push("/add"); }}
              >
                Create new recipe
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── Search ──────────────────────────────────────────────────────── */}
      <div className="library-search-row">
        <div className="library-search-wrap">
          <Search size={15} className="library-search-icon" />
          <input
            className="library-search-input"
            type="search"
            placeholder="Search saved recipes…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="library-search-clear" onClick={() => setSearch("")}>
              <X size={13} />
            </button>
          )}
        </div>
        <button className="library-filter-btn" aria-label="Filter">
          <SlidersHorizontal size={15} />
        </button>
      </div>

      {/* ── Collections ─────────────────────────────────────────────────── */}
      <section className="library-section">
        <h2 className="library-section-title">Collections</h2>
        <div className="collections-grid">
          {/* System collections */}
          {SYSTEM_COLLECTIONS.map((col) => (
            <div key={col.key} className="collection-card">
              <div className="collection-card-icon">{col.icon}</div>
              <div className="collection-card-name">{col.label}</div>
              <div className="collection-card-count">
                {systemCounts[col.key] ?? 0} recipe{(systemCounts[col.key] ?? 0) !== 1 ? "s" : ""}
              </div>
            </div>
          ))}

          {/* User collections */}
          {collections.map((col) => (
            <div key={col.id} className="collection-card collection-card--user">
              <div className="collection-card-icon"><FolderHeart size={18} /></div>
              <div className="collection-card-name">{col.name}</div>
              <div className="collection-card-count">
                {col.recipeIds.length} recipe{col.recipeIds.length !== 1 ? "s" : ""}
              </div>
              <button
                className="collection-card-delete"
                onClick={() => setDeleteColId(col.id)}
                aria-label="Delete collection"
              >
                <X size={12} />
              </button>
            </div>
          ))}

          {/* Create new collection */}
          <button className="collection-card collection-card--create" onClick={() => setShowCreate(true)}>
            <div className="collection-card-icon"><Plus size={18} /></div>
            <div className="collection-card-name">Create collection</div>
          </button>
        </div>
      </section>

      {/* ── Saved Recipes ───────────────────────────────────────────────── */}
      <section className="library-section">
        <h2 className="library-section-title">
          Saved Recipes
          {savedRecipes.length > 0 && (
            <span className="library-count">{savedRecipes.length}</span>
          )}
        </h2>

        {loading ? (
          <p className="library-empty">Loading…</p>
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
            className="library-recipe-grid"
            initial="hidden"
            animate="visible"
            variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          >
            <AnimatePresence>
              {displayRecipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </section>

      {/* ── Modals ──────────────────────────────────────────────────────── */}
      {showCreate && (
        <CreateCollectionModal onClose={() => setShowCreate(false)} />
      )}
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
    </main>
  );
}
