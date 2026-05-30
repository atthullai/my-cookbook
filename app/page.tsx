"use client";

/**
 * Home — /
 *
 * Warm, fast, heirloom cookbook homepage.
 * Animations stripped — replaced with instant CSS transitions for performance.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  BookOpen, Plus, LogOut, LogIn, Search, X,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import type { AppUser, RecipeRecord } from "@/lib/recipe-types";
import RecipeCard from "@/components/RecipeCard";
import ConfirmDialog from "@/components/ConfirmDialog";
import LottieAnimation from "@/components/LottieAnimation";

// ── Quick-nav card ────────────────────────────────────────────────────────────
function NavCard({
  emoji, label, desc, href,
}: {
  emoji: string;
  label: string;
  desc?: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-3 py-6 px-5 rounded-2xl border transition-all duration-200 hover:-translate-y-1 hover:shadow-lg group"
      style={{ background: "var(--surface)", borderColor: "var(--border)" }}
    >
      <span className="text-4xl">{emoji}</span>
      <div>
        <p className="text-sm font-bold mb-1" style={{ color: "var(--foreground)" }}>{label}</p>
        {desc && (
          <p className="text-xs leading-relaxed" style={{ color: "var(--muted)" }}>{desc}</p>
        )}
      </div>
    </Link>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function Home() {
  const [records,       setRecords]       = useState<RecipeRecord[]>([]);
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

  useEffect(() => {
    let alive = true;
    const run = async () => {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!alive) return;
      setUser(u);
      await loadRecipes(u);
    };
    void run();
    return () => { alive = false; };
  }, [loadRecipes]);

  const summaries = useMemo(() => toRecipeSummaries(records), [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter((s) =>
      [s.title, s.cuisine, s.category ?? "", s.tags.join(" ")]
        .join(" ").toLowerCase().includes(q)
    );
  }, [summaries, search]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

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

  const todayPick = filtered.find((s) => s.category?.toLowerCase().includes("dinner")) ?? filtered[0];
  const latest    = filtered.slice(0, 9);

  return (
    <>
      <Toaster position="top-right" />
      <main className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* ─────────────────────────────────────────────────────────────────── */}
        {/* HERO                                                                */}
        {/* ─────────────────────────────────────────────────────────────────── */}
        <section
          className="relative overflow-hidden px-4 pt-12 pb-14"
          style={{
            background: [
              "radial-gradient(ellipse 80% 60% at 70% 20%, rgba(212,168,83,.10) 0%, transparent 55%)",
              "radial-gradient(ellipse 60% 80% at 10% 80%, rgba(232,132,74,.08) 0%, transparent 55%)",
              "linear-gradient(160deg, var(--linen) 0%, var(--parchment) 55%, var(--background) 100%)",
            ].join(", "),
          }}
        >
          {/* Grain noise overlay */}
          <div
            className="absolute inset-0 pointer-events-none select-none"
            aria-hidden="true"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.04'/%3E%3C/svg%3E")`,
              opacity: 0.5,
            }}
          />
          <div className="relative max-w-5xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-8">

            {/* ── Editorial text ─────────────────────────────────────── */}
            <div className="w-full lg:w-1/2 text-center lg:text-left">

              {/* Eyebrow */}
              <p
                style={{
                  color: "var(--accent-strong)",
                  fontSize: "0.72rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: "0.85rem",
                  opacity: 0.85,
                }}
              >
                Heirloom Collection
              </p>

              {/* Main heading */}
              <h1
                style={{
                  fontSize: "clamp(2.6rem, 6vw, 4.2rem)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.02em",
                  color: "var(--foreground)",
                  marginBottom: "1.1rem",
                  fontFamily: '"Iowan Old Style", "Palatino Linotype", Georgia, serif',
                }}
              >
                My<br />
                <span style={{ color: "var(--accent)" }}>Cookbook</span>
              </h1>

              {/* Subheading */}
              <p
                className="max-w-sm mb-8 leading-relaxed"
                style={{ color: "var(--muted)", fontSize: "1.05rem" }}
              >
                Recipes handed down, stories kept warm —<br className="hidden sm:block" />
                a private heirloom for the family table.
              </p>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                <Link
                  href="/add"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-md transition-all duration-200 hover:-translate-y-0.5"
                  style={{ background: "var(--accent)", color: "#fff8f1" }}
                >
                  <Plus size={15} /> Add Recipe
                </Link>
                <Link
                  href="/recipes"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border shadow-sm transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "var(--surface)",
                    color: "var(--foreground)",
                    borderColor: "var(--border)",
                  }}
                >
                  <BookOpen size={15} /> Browse All
                </Link>
                {user ? (
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      color: "var(--muted)",
                      borderColor: "var(--border)",
                      background: "transparent",
                    }}
                  >
                    <LogOut size={13} /> Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-xl border transition-all duration-200 hover:-translate-y-0.5"
                    style={{
                      color: "var(--muted)",
                      borderColor: "var(--border)",
                      background: "transparent",
                    }}
                  >
                    <LogIn size={13} /> Login
                  </Link>
                )}
              </div>

              {/* Stats */}
              {records.length > 0 && (
                <div className="flex gap-7 mt-8 justify-center lg:justify-start">
                  {[
                    { value: records.length, label: "recipes" },
                    { value: new Set(records.map((r) => r.cuisine).filter(Boolean)).size, label: "cuisines" },
                    { value: new Set(records.flatMap((r) => r.badges)).size, label: "tags" },
                    { value: 20, label: "origins" },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center lg:text-left">
                      <p
                        className="text-2xl font-extrabold leading-none"
                        style={{ color: "var(--foreground)" }}
                      >
                        {value}
                      </p>
                      <p
                        className="text-xs mt-0.5 tracking-wide"
                        style={{ color: "var(--muted)" }}
                      >
                        {label}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Peacock animation ──────────────────────────────────── */}
            <div
              className="w-full lg:w-1/2 flex items-center justify-center lg:justify-end"
              aria-hidden="true"
            >
              <LottieAnimation
                src="/animations/peacock.json"
                loop
                style={{ width: "clamp(320px, 45vw, 680px)", height: "clamp(320px, 45vw, 680px)" }}
              />
            </div>
          </div>
        </section>

        {/* ── Quick nav ─────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            <NavCard
              emoji="📖"
              label="Recipe Library"
              desc="Save, search, and filter your collection. Full ingredients, steps, nutrition."
              href="/recipes"
            />
            <NavCard
              emoji="📅"
              label="Meal Planner"
              desc="Drag recipes onto a weekly calendar. Auto-generate shopping lists."
              href="/planner"
            />
            <NavCard
              emoji="🛒"
              label="Smart Shopping"
              desc="Check off as you go. Grouped by category. Pantry handoff on check."
              href="/planner/shopping"
            />
            <NavCard
              emoji="🏠"
              label="Pantry Tracker"
              desc="Know what's running low or expiring. Suggest recipes from what's on hand."
              href="/pantry"
            />
          </div>
        </section>

        {/* ── Today's pick ──────────────────────────────────────────────── */}
        {!loading && todayPick && (
          <section className="max-w-5xl mx-auto px-4 pb-6">
            <div
              className="rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-md"
              style={{
                background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-strong) 100%)",
                color: "#fff8f1",
              }}
            >
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest mb-1.5" style={{ opacity: 0.7 }}>
                  What to cook today
                </p>
                <h2 className="text-xl font-bold mb-1" style={{ color: "#fff8f1" }}>
                  {todayPick.title}
                </h2>
                <p className="text-sm" style={{ opacity: 0.75 }}>
                  {todayPick.cuisine} · {todayPick.prepTimeMinutes + todayPick.cookTimeMinutes} min · serves {todayPick.servings}
                </p>
              </div>
              <Link
                href={`/recipe/${todayPick.id}`}
                className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "rgba(255, 250, 240, 0.95)", color: "var(--accent-strong)" }}
              >
                Open recipe →
              </Link>
            </div>
          </section>
        )}

        {/* ── Recipe grid ───────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 pb-20">

          {/* Section heading + search */}
          <div className="flex items-center gap-4 mb-6">
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-0.5"
                style={{ color: "var(--accent)", opacity: 0.8, fontSize: "0.68rem", letterSpacing: "0.2em" }}
              >
                {search ? "Search Results" : "Saved Recipes"}
              </p>
            </div>
            <div className="flex-1 relative max-w-xs">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 leading-none" style={{ color: "var(--muted)", opacity: 0.6 }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipes…"
                className="w-full pl-10 pr-9 py-2.5 rounded-xl text-sm focus:outline-none transition"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--foreground)",
                  paddingLeft: "2.5rem",
                }}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: "var(--muted)" }}
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <span className="text-sm hidden sm:block" style={{ color: "var(--muted)", opacity: 0.7 }}>
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
                    onEdit={() => { window.location.assign(`/edit/${recipe.id}`); }}
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
