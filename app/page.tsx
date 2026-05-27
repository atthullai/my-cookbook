"use client";

/**
 * Home — /
 *
 * Soul of the app. Feels like opening an old Tamil family cookbook at dawn —
 * the brass filter coffee beside you, the kolam fresh at the doorstep,
 * the kitchen smelling of curry leaves and turmeric.
 *
 * Tamil Nadu atmosphere:
 *   • FilterCoffeeScene hero animation (brass tumbler, organic steam)
 *   • Kolam-inspired decorative dividers
 *   • Warm parchment + terracotta palette (from CSS variables)
 *   • Grain texture overlay for paper/worn-surface feel
 *   • Slow, breathing motion — nothing sharp or robotic
 *   • Editorial serif typography — cookbook, not SaaS
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
import FilterCoffeeScene from "@/components/FilterCoffeeScene";
import KolamDivider from "@/components/KolamDivider";

// ── Slow, handcrafted entrance timing ────────────────────────────────────────
// Everything enters at the pace of a slow morning — nothing snaps into place.
const EASE_WARM: [number, number, number, number] = [0.25, 0.1, 0.4, 1.0];

// ── Quick-nav card ────────────────────────────────────────────────────────────
function NavCard({
  icon, label, href, bg, iconBg, delay,
}: {
  icon: React.ReactNode;
  label: string;
  href: string;
  bg: string;
  iconBg: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.65, ease: EASE_WARM }}
    >
      <Link
        href={href}
        className={`flex flex-col items-center gap-2.5 py-5 px-3 rounded-2xl ${bg} border border-white/60 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5 text-center group`}
      >
        <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-300`}>
          {icon}
        </div>
        <span className="text-xs font-semibold text-stone-600 tracking-wide">{label}</span>
      </Link>
    </motion.div>
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
          {/* Grain texture overlay — worn parchment feel */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='g'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.72' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='180' height='180' filter='url(%23g)' opacity='0.035'/%3E%3C/svg%3E")`,
              backgroundSize: "180px 180px",
              opacity: 0.7,
              mixBlendMode: "multiply",
            }}
          />

          {/* Warm sunlight edge vignette */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background: "radial-gradient(ellipse 120% 100% at 50% 50%, transparent 60%, rgba(90, 55, 20, 0.08) 100%)",
            }}
          />

          <div className="relative max-w-5xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-10">

            {/* ── Left: editorial text ─────────────────────────────────── */}
            <div className="flex-1 text-center lg:text-left">

              {/* Eyebrow — handwritten feel */}
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08, duration: 0.7, ease: EASE_WARM }}
                style={{
                  color: "var(--accent-strong)",
                  fontFamily: "inherit",
                  fontSize: "0.72rem",
                  letterSpacing: "0.22em",
                  textTransform: "uppercase",
                  fontWeight: 700,
                  marginBottom: "0.85rem",
                  opacity: 0.85,
                }}
              >
                Heirloom Collection
              </motion.p>

              {/* Main heading — large, editorial, serif */}
              <motion.h1
                initial={{ opacity: 0, y: 22 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.85, ease: EASE_WARM }}
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
              </motion.h1>

              {/* Subheading — calm, descriptive */}
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.7, ease: EASE_WARM }}
                className="max-w-sm mx-auto lg:mx-0 mb-8 leading-relaxed"
                style={{ color: "var(--muted)", fontSize: "1.05rem" }}
              >
                Recipes handed down, stories kept warm —<br className="hidden sm:block" />
                a private heirloom for the family table.
              </motion.p>

              {/* Action buttons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.42, duration: 0.65, ease: EASE_WARM }}
                className="flex flex-wrap gap-3 justify-center lg:justify-start"
              >
                <Link
                  href="/add"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl shadow-md transition-all duration-300 hover:-translate-y-0.5"
                  style={{ background: "var(--accent)", color: "#fff8f1" }}
                >
                  <Plus size={15} /> Add Recipe
                </Link>
                <Link
                  href="/recipes"
                  className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border shadow-sm transition-all duration-300 hover:-translate-y-0.5"
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
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-xl border transition-all duration-300 hover:-translate-y-0.5"
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
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm rounded-xl border transition-all duration-300 hover:-translate-y-0.5"
                    style={{
                      color: "var(--muted)",
                      borderColor: "var(--border)",
                      background: "transparent",
                    }}
                  >
                    <LogIn size={13} /> Login
                  </Link>
                )}
              </motion.div>

              {/* Stats — small, dignified */}
              {records.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6, duration: 0.7 }}
                  className="flex gap-7 mt-8 justify-center lg:justify-start"
                >
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
                </motion.div>
              )}
            </div>

            {/* ── Right: filter coffee animation ─────────────────────── */}
            <motion.div
              initial={{ opacity: 0, scale: 0.92, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 1.1, ease: EASE_WARM }}
              className="flex-shrink-0"
            >
              <FilterCoffeeScene />
            </motion.div>
          </div>
        </section>

        {/* ── Kolam divider ─────────────────────────────────────────────── */}
        <div className="max-w-sm mx-auto px-4 py-2">
          <KolamDivider animateOnView={false} />
        </div>

        {/* ── Quick nav ─────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-6">
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            <NavCard
              icon={<BookOpen size={19} style={{ color: "var(--accent-strong)" }} />}
              label="Recipes"
              href="/recipes"
              bg="bg-orange-50"
              iconBg="bg-orange-100/80"
              delay={0.15}
            />
            <NavCard
              icon={<CalendarDays size={19} style={{ color: "var(--olive)" }} />}
              label="Planner"
              href="/planner"
              bg="bg-lime-50"
              iconBg="bg-lime-100/80"
              delay={0.2}
            />
            <NavCard
              icon={<ShoppingCart size={19} style={{ color: "var(--teal)" }} />}
              label="Shopping"
              href="/planner/shopping"
              bg="bg-teal-50"
              iconBg="bg-teal-100/80"
              delay={0.25}
            />
            <NavCard
              icon={<Leaf size={19} style={{ color: "var(--olive)" }} />}
              label="Pantry"
              href="/pantry"
              bg="bg-green-50"
              iconBg="bg-green-100/80"
              delay={0.3}
            />
          </div>
        </section>

        {/* ── Today's pick ──────────────────────────────────────────────── */}
        <AnimatePresence>
          {!loading && todayPick && (
            <motion.section
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.7, ease: EASE_WARM }}
              className="max-w-5xl mx-auto px-4 pb-6"
            >
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
                  href={`/recipes/${todayPick.id}`}
                  className="flex-shrink-0 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: "rgba(255, 250, 240, 0.95)", color: "var(--accent-strong)" }}
                >
                  Open recipe →
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

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

          {/* Loading skeleton — warm parchment shimmer */}
          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.06 }}
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
                    <div
                      className="h-4 rounded-lg w-3/4"
                      style={{
                        background: "var(--oat)",
                        animation: "skeleton-sheen 1.8s ease-in-out infinite 0.2s",
                      }}
                    />
                    <div
                      className="h-3 rounded-lg w-1/2"
                      style={{
                        background: "var(--surface-soft)",
                        animation: "skeleton-sheen 1.8s ease-in-out infinite 0.4s",
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_WARM }}
              className="text-center py-20"
            >
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
            </motion.div>
          )}

          {/* Recipe grid */}
          {!loading && latest.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-5">
                <div /> {/* spacer */}
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
                {latest.map((recipe, i) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: i * 0.07,
                      duration: 0.6,
                      ease: EASE_WARM,
                    }}
                  >
                    <RecipeCard
                      recipe={recipe}
                      onEdit={() => { window.location.assign(`/edit/${recipe.id}`); }}
                      onDelete={() => setDeleteTarget(recipe.id)}
                    />
                  </motion.div>
                ))}
              </div>
            </>
          )}

          {/* Bottom kolam divider */}
          {!loading && latest.length > 0 && (
            <div className="max-w-xs mx-auto mt-14 mb-4">
              <KolamDivider animateOnView color="rgba(180, 120, 30, 0.22)" />
            </div>
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
