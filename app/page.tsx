"use client";

/**
 * Home — /
 *
 * Hero: authentic cooking animation (clay pot + steam + floating spices)
 * Stats strip, quick-nav cards, today's pick, recipe grid with search/filter.
 * Uses the new RecipeCard + adapter so the display matches the rest of the rebuilt UI.
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

// ─────────────────────────────────────────────────────────────────────────────
// Cooking Animation
// ─────────────────────────────────────────────────────────────────────────────

const FLOATING_SPICES = [
  { emoji: "🌶️", left: "6%",  startY: "72%", delay: 0.3  },
  { emoji: "🧄",  left: "16%", startY: "74%", delay: 2.1  },
  { emoji: "🫚",  left: "76%", startY: "73%", delay: 0.9  },
  { emoji: "🌿",  left: "84%", startY: "71%", delay: 2.7  },
  { emoji: "⭐",  left: "28%", startY: "75%", delay: 1.5  },
  { emoji: "🍅",  left: "69%", startY: "75%", delay: 3.3  },
  { emoji: "🧅",  left: "50%", startY: "70%", delay: 1.8  },
];

function SteamWisp({ cx, delay }: { cx: number; delay: number }) {
  // Each wisp morphs between a left-leaning and right-leaning bezier
  return (
    <motion.path
      d={`M ${cx} 68 C ${cx - 7} 52 ${cx + 7} 38 ${cx} 22 C ${cx - 7} 6 ${cx + 7} -8 ${cx} -22`}
      fill="none"
      stroke="rgba(255,255,255,0.75)"
      strokeWidth="2.5"
      strokeLinecap="round"
      initial={{ pathLength: 0, opacity: 0, y: 0 }}
      animate={{
        pathLength: [0, 1, 1, 0],
        opacity:    [0, 0.7, 0.5, 0],
        y:          [0, -8, -16, -24],
      }}
      transition={{
        duration:    2.8,
        delay,
        repeat:      Infinity,
        repeatDelay: 0.2,
        ease:        "easeInOut",
      }}
    />
  );
}

function CookingAnimation() {
  return (
    <div className="relative w-72 h-72 mx-auto select-none" aria-hidden="true">

      {/* Warm radial glow behind the pot */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 70%, rgba(251,146,60,0.35) 0%, rgba(251,191,36,0.15) 45%, transparent 70%)",
        }}
      />

      {/* SVG: pot body + steam */}
      <svg
        viewBox="0 0 200 200"
        className="absolute inset-0 w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="hpPotSide" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%"   stopColor="#92400e" />
            <stop offset="35%"  stopColor="#d97706" />
            <stop offset="65%"  stopColor="#b45309" />
            <stop offset="100%" stopColor="#78350f" />
          </linearGradient>
          <linearGradient id="hpRim" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fcd34d" />
          </linearGradient>
          <radialGradient id="hpBubble" cx="40%" cy="35%">
            <stop offset="0%"   stopColor="#fed7aa" />
            <stop offset="100%" stopColor="#f97316" />
          </radialGradient>
          <filter id="hpShadow">
            <feDropShadow dx="0" dy="6" stdDeviation="6" floodColor="#92400e" floodOpacity="0.35" />
          </filter>
        </defs>

        {/* ── Left handle ─────────────────────────────────────────── */}
        <path
          d="M 44 90 Q 22 90 20 106 Q 18 122 44 124"
          fill="none" stroke="#78350f" strokeWidth="8" strokeLinecap="round"
        />
        <path
          d="M 44 90 Q 22 90 20 106 Q 18 122 44 124"
          fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" opacity="0.4"
        />

        {/* ── Right handle ─────────────────────────────────────────── */}
        <path
          d="M 156 90 Q 178 90 180 106 Q 182 122 156 124"
          fill="none" stroke="#78350f" strokeWidth="8" strokeLinecap="round"
        />
        <path
          d="M 156 90 Q 178 90 180 106 Q 182 122 156 124"
          fill="none" stroke="#d97706" strokeWidth="4" strokeLinecap="round" opacity="0.4"
        />

        {/* ── Pot body ─────────────────────────────────────────────── */}
        <motion.path
          d="M 44 82 L 42 155 Q 42 170 100 170 Q 158 170 158 155 L 156 82 Z"
          fill="url(#hpPotSide)"
          filter="url(#hpShadow)"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Pot body highlight (left edge shine) */}
        <path
          d="M 52 90 Q 50 120 52 155"
          fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" strokeLinecap="round"
        />

        {/* ── Rim ──────────────────────────────────────────────────── */}
        <motion.ellipse
          cx="100" cy="82" rx="56" ry="14"
          fill="url(#hpRim)"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Simmering content ────────────────────────────────────── */}
        <motion.ellipse
          cx="100" cy="82" rx="46" ry="10"
          fill="url(#hpBubble)"
          animate={{ y: [0, -2, 0] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* ── Simmer bubbles ───────────────────────────────────────── */}
        {[
          { cx: 83,  cy: 80, r: 3.2, delay: 0    },
          { cx: 105, cy: 79, r: 2.2, delay: 0.8  },
          { cx: 94,  cy: 83, r: 2.8, delay: 1.6  },
          { cx: 115, cy: 80, r: 2,   delay: 0.4  },
          { cx: 73,  cy: 81, r: 2,   delay: 1.2  },
        ].map((b, i) => (
          <motion.circle
            key={i}
            cx={b.cx} cy={b.cy} r={b.r}
            fill="rgba(255,255,255,0.55)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 1.2, 0], opacity: [0, 0.9, 0] }}
            transition={{ duration: 1.4, delay: b.delay, repeat: Infinity, repeatDelay: 0.6 }}
          />
        ))}

        {/* ── Steam wisps ──────────────────────────────────────────── */}
        <SteamWisp cx={78}  delay={0}   />
        <SteamWisp cx={100} delay={0.7} />
        <SteamWisp cx={122} delay={1.4} />
      </svg>

      {/* ── Floating spice emojis (HTML, outside SVG for crisp emoji render) ── */}
      {FLOATING_SPICES.map(({ emoji, left, startY, delay }) => (
        <motion.span
          key={emoji}
          className="absolute text-xl pointer-events-none"
          style={{ left, top: startY }}
          initial={{ opacity: 0, y: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            y:       [0, -28, -56, -84],
          }}
          transition={{
            duration:    3.5,
            delay,
            repeat:      Infinity,
            repeatDelay: 0.6,
            ease:        "easeOut",
          }}
        >
          {emoji}
        </motion.span>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Quick-nav card
// ─────────────────────────────────────────────────────────────────────────────
function NavCard({
  icon, label, href, color, delay,
}: { icon: React.ReactNode; label: string; href: string; color: string; delay: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Link
        href={href}
        className={`flex flex-col items-center gap-2 py-4 px-3 rounded-2xl ${color} border border-white/50 shadow-sm hover:shadow-md transition-shadow text-center`}
      >
        <div className="w-10 h-10 rounded-xl bg-white/70 flex items-center justify-center">
          {icon}
        </div>
        <span className="text-xs font-semibold text-gray-700">{label}</span>
      </Link>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────────────
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

  // ── Convert to display type ───────────────────────────────────────────────
  const summaries = useMemo(() => toRecipeSummaries(records), [records]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return summaries;
    return summaries.filter((s) =>
      [s.title, s.cuisine, s.category ?? "", s.tags.join(" ")]
        .join(" ").toLowerCase().includes(q)
    );
  }, [summaries, search]);

  // ── Auth ──────────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    const numId = parseInt(deleteTarget);
    const { error } = await supabase.from("recipes").delete().eq("id", numId);
    if (error) { toast.error(error.message); }
    else {
      setRecords((prev) => prev.filter((r) => r.id !== numId));
      toast.success("Recipe deleted");
    }
    setIsDeleting(false);
    setDeleteTarget(null);
  };

  const todayPick = filtered.find((s) => s.category?.toLowerCase().includes("dinner")) ?? filtered[0];
  const latest = filtered.slice(0, 9);

  return (
    <>
      <Toaster position="top-right" />
      <main className="min-h-screen">

        {/* ── Hero ──────────────────────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 px-4 pt-14 pb-10">
          {/* subtle texture */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              backgroundImage:
                "radial-gradient(circle at 75% 55%, rgba(234,88,12,0.18) 0%, transparent 55%), radial-gradient(circle at 20% 30%, rgba(251,191,36,0.14) 0%, transparent 50%)",
            }}
          />

          <div className="relative max-w-5xl mx-auto flex flex-col-reverse lg:flex-row items-center gap-10">

            {/* Left: text */}
            <div className="flex-1 text-center lg:text-left">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="text-sm font-semibold text-orange-500 uppercase tracking-widest mb-3"
              >
                Private Recipe Studio
              </motion.p>

              <motion.h1
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                className="text-5xl sm:text-6xl font-extrabold text-gray-900 leading-tight mb-5"
              >
                My<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500">
                  Cookbook
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
                className="text-gray-500 text-base sm:text-lg max-w-md mx-auto lg:mx-0 mb-8 leading-relaxed"
              >
                A warm, private place for family recipes — bilingual, beautifully tagged,
                and always within reach.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.32 }}
                className="flex flex-wrap gap-3 justify-center lg:justify-start"
              >
                <Link
                  href="/add"
                  className="flex items-center gap-2 px-5 py-2.5 bg-orange-500 text-white text-sm font-semibold rounded-xl hover:bg-orange-600 transition shadow-md"
                >
                  <Plus size={16} /> Add Recipe
                </Link>
                <Link
                  href="/recipes"
                  className="flex items-center gap-2 px-5 py-2.5 bg-white text-gray-700 text-sm font-semibold rounded-xl border border-gray-200 hover:bg-gray-50 transition shadow-sm"
                >
                  <BookOpen size={16} /> Browse All
                </Link>
                {user ? (
                  <button
                    type="button"
                    onClick={() => void handleLogout()}
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  >
                    <LogOut size={14} /> Logout
                  </button>
                ) : (
                  <Link
                    href="/login"
                    className="flex items-center gap-1.5 px-4 py-2.5 text-sm text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-50 transition"
                  >
                    <LogIn size={14} /> Login
                  </Link>
                )}
              </motion.div>

              {/* Stats */}
              {records.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex gap-5 mt-8 justify-center lg:justify-start"
                >
                  {[
                    { value: records.length, label: "recipes" },
                    { value: new Set(records.map((r) => r.cuisine).filter(Boolean)).size, label: "cuisines" },
                    { value: new Set(records.flatMap((r) => r.badges)).size, label: "tags" },
                  ].map(({ value, label }) => (
                    <div key={label} className="text-center">
                      <p className="text-2xl font-extrabold text-gray-900">{value}</p>
                      <p className="text-xs text-gray-500">{label}</p>
                    </div>
                  ))}
                </motion.div>
              )}
            </div>

            {/* Right: animation */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.08, duration: 0.7, ease: "easeOut" }}
              className="flex-shrink-0 w-72"
            >
              <CookingAnimation />
            </motion.div>
          </div>
        </section>

        {/* ── Quick nav ─────────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 py-8">
          <div className="grid grid-cols-4 gap-3 sm:gap-4">
            <NavCard icon={<BookOpen size={20} className="text-indigo-600" />}   label="Recipes"  href="/recipes"          color="bg-indigo-50"  delay={0.1} />
            <NavCard icon={<CalendarDays size={20} className="text-violet-600" />} label="Planner"  href="/planner"          color="bg-violet-50"  delay={0.15} />
            <NavCard icon={<ShoppingCart size={20} className="text-sky-600" />}    label="Shopping" href="/planner/shopping"  color="bg-sky-50"     delay={0.2} />
            <NavCard icon={<Leaf size={20} className="text-green-600" />}          label="Pantry"   href="/pantry"           color="bg-green-50"   delay={0.25} />
          </div>
        </section>

        {/* ── Today's pick ──────────────────────────────────────────────────── */}
        <AnimatePresence>
          {!loading && todayPick && (
            <motion.section
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-5xl mx-auto px-4 pb-6"
            >
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-md">
                <div className="flex-1">
                  <p className="text-xs font-semibold text-orange-100 uppercase tracking-widest mb-1">
                    What to cook today
                  </p>
                  <h2 className="text-xl font-bold text-white mb-1">{todayPick.title}</h2>
                  <p className="text-sm text-orange-100 opacity-90">
                    {todayPick.cuisine} · {todayPick.prepTimeMinutes + todayPick.cookTimeMinutes} min · serves {todayPick.servings}
                  </p>
                </div>
                <Link
                  href={`/recipes/${todayPick.id}`}
                  className="flex-shrink-0 px-5 py-2.5 bg-white text-orange-600 font-semibold text-sm rounded-xl hover:bg-orange-50 transition shadow-sm"
                >
                  Start cooking →
                </Link>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* ── Recipe grid ───────────────────────────────────────────────────── */}
        <section className="max-w-5xl mx-auto px-4 pb-16">
          {/* Search bar */}
          <div className="flex items-center gap-3 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search recipes…"
                className="w-full pl-10 pr-9 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-200"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>
            <span className="text-sm text-gray-400 hidden sm:block">
              {filtered.length} recipe{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>

          {/* Loading skeleton */}
          {loading && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-2xl overflow-hidden border border-gray-100">
                  <div className="h-28 bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && filtered.length === 0 && (
            <div className="text-center py-20">
              <span className="text-6xl block mb-4" aria-hidden="true">🍳</span>
              <h2 className="text-lg font-semibold text-gray-700 mb-2">
                {records.length === 0 ? "Your cookbook is empty" : "No recipes match"}
              </h2>
              <p className="text-sm text-gray-400 mb-5">
                {records.length === 0
                  ? "Add your first family recipe to get started."
                  : "Try a different search term."}
              </p>
              {records.length === 0 && (
                <Link href="/add" className="text-sm text-orange-600 hover:underline">
                  Add the first recipe →
                </Link>
              )}
            </div>
          )}

          {/* Recipe grid */}
          {!loading && latest.length > 0 && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-gray-800">
                  {search ? "Results" : "Newest Recipes"}
                </h2>
                {!search && filtered.length > 9 && (
                  <Link href="/recipes" className="text-sm text-indigo-600 hover:underline">
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
        title="Delete this recipe?"
        message="This will permanently remove the recipe and cannot be undone."
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
        loading={isDeleting}
      />
    </>
  );
}
