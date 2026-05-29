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
  BookOpen, CalendarDays, ShoppingCart, Leaf,
  Plus, LogOut, LogIn, Search, X,
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
  icon, label, href, bg, iconBg,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  bg: string;
  iconBg: string;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl ${bg} border border-white/60 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 text-center group`}
    >
      <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-stone-600 tracking-wide">{label}</span>
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
              "radial-gradient(ellipse 80% 60% at 72% 68%, rgba(192, 130, 30, 0.18) 0%, transparent 60%)",
              "radial-gradient(ellipse 50% 40% at 18% 25%, rgba(220, 160, 50, 0.12) 0%, transparent 55%)",
              "linear-gradient(160deg, var(--linen) 0%, var(--parchment) 55%, var(--background) 100%)",
            ].join(", "),
          }}
        >
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
              icon={<BookOpen size={19} style={{ color: "var(--accent-strong)" }} />}
              label="Recipes"
              href="/recipes"
              bg="bg-orange-50"
              iconBg="bg-orange-100/80"
            />
            <NavCard
              icon={<CalendarDays size={19} style={{ color: "var(--olive)" }} />}
              label="Planner"
              href="/planner"
              bg="bg-lime-50"
              iconBg="bg-lime-100/80"
            />
            <NavCard
              icon={<ShoppingCart size={19} style={{ color: "var(--teal)" }} />}
              label="Shopping"
              href="/planner/shopping"
              bg="bg-teal-50"
              iconBg="bg-teal-100/80"
            />
            <NavCard
              icon={<Leaf size={19} style={{ color: "var(--olive)" }} />}
              label="Pantry"
              href="/pantry"
              bg="bg-green-50"
              iconBg="bg-green-100/80"
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
