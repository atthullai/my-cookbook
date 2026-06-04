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
import { getRecentlyViewedIds } from "@/lib/library";
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
  const { savedIds, collections, deleteCollection } = useLibrary();
  const addMenuRef = useRef<HTMLDivElement>(null);

  const [allRecipes, setAllRecipes]   = useState<RecipeSummary[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showCreate, setShowCreate]   = useState(false);
  const [deleteColId, setDeleteColId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
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
    if (!search.trim()) return savedRecipes;
    const q = search.toLowerCase();
    return savedRecipes.filter((r) => r.title.toLowerCase().includes(q));
  }, [savedRecipes, search]);

  const systemCounts: Record<string, number> = useMemo(() => {
    const recentIds = new Set(getRecentlyViewedIds());
    return {
      "saved-plans":     0,
      "recently-viewed": allRecipes.filter((r) => recentIds.has(r.id)).length,
      "my-recipes":      allRecipes.length,
      "planned":         0,
      "made-it":         0,
    };
  }, [allRecipes]);

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

      {/* ── Collections ────────────────────────────────────────────────── */}
      <section style={{ marginBottom: "2.5rem" }}>
        <h2 className="library-section-title">Collections</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">

          {SYSTEM_COLLECTIONS.map((col) => (
            <div key={col.key} className="collection-card">
              <div className="collection-card-icon">{col.icon}</div>
              <div className="collection-card-name">{col.label}</div>
              <div className="collection-card-count">
                {systemCounts[col.key] ?? 0} recipe{(systemCounts[col.key] ?? 0) !== 1 ? "s" : ""}
              </div>
            </div>
          ))}

          {collections.map((col) => (
            <div key={col.id} className="collection-card collection-card--user">
              <div className="collection-card-icon"><FolderHeart size={20} /></div>
              <div className="collection-card-name">{col.name}</div>
              <div className="collection-card-count">
                {col.recipeIds.length} recipe{col.recipeIds.length !== 1 ? "s" : ""}
              </div>
              <button className="collection-card-delete" onClick={() => setDeleteColId(col.id)} aria-label="Delete">
                <X size={12} />
              </button>
            </div>
          ))}

          <button className="collection-card collection-card--create" onClick={() => setShowCreate(true)}>
            <div className="collection-card-icon"><Plus size={20} /></div>
            <div className="collection-card-name">Create collection</div>
          </button>
        </div>
      </section>

      {/* ── Saved Recipes ──────────────────────────────────────────────── */}
      <section>
        <h2 className="library-section-title">
          Saved Recipes
          {savedRecipes.length > 0 && <span className="library-count">{savedRecipes.length}</span>}
        </h2>

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
                <RecipeCard key={recipe.id} recipe={recipe} />
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
    </main>
  );
}
