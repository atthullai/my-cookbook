"use client";

/**
 * Recipe Detail — /recipes/[id]
 *
 * Features:
 * - CuisineHeroBanner at top with recipe title
 * - Full ingredient list with IngredientIcon per item
 * - Equipment list
 * - Step-by-step instructions with optional per-step timer
 * - NutritionPanel sidebar (or below on mobile)
 * - Tag badges row
 * - Edit and Delete buttons (ConfirmDialog for delete)
 * - Back to recipes link
 */
import { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Clock, Users, Pencil, Trash2, CheckCircle2, Timer, Play, Pause, RotateCcw, X as XIcon } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { normalizeRecipe } from "@/lib/recipe-types";
import { toRecipe } from "@/lib/recipe-adapter";
import CuisineHeroBanner from "@/components/CuisineHeroBanner";
import NutritionPanel from "@/components/NutritionPanel";
import TagBadge from "@/components/TagBadge";
import IngredientIcon from "@/components/IngredientIcon";
import ConfirmDialog from "@/components/ConfirmDialog";
import KolamDivider from "@/components/KolamDivider";
import type { Recipe } from "@/types";

// Slow, breathing, handcrafted — the Tamil Nadu motion philosophy
const EASE_WARM = [0.25, 0.1, 0.4, 1.0] as const;

export default function RecipeDetailPage() {
  const params   = useParams();
  const router   = useRouter();
  const recipeId = Array.isArray(params.id) ? params.id[0] : params.id;

  const [recipe, setRecipe]           = useState<Recipe | null>(null);
  const [loading, setLoading]         = useState(true);
  const [notFound, setNotFound]       = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [isDeleting, setIsDeleting]   = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  // ── Cooking timer state ───────────────────────────────────────────────────
  const [showTimer,        setShowTimer]        = useState(false);
  const [timerInput,       setTimerInput]       = useState("");  // user-typed minutes
  const [timerRemaining,   setTimerRemaining]   = useState(0);   // seconds left
  const [timerTotal,       setTimerTotal]       = useState(0);   // total seconds set
  const [timerRunning,     setTimerRunning]     = useState(false);
  const [timerDone,        setTimerDone]        = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown tick
  useEffect(() => {
    if (!timerRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      setTimerRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimerRunning(false);
          setTimerDone(true);
          toast.success("🔔 Timer done!", { duration: 5000 });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  const startTimer = (minutes?: number) => {
    const mins = minutes ?? parseInt(timerInput);
    if (!mins || mins <= 0) { toast.error("Enter a time in minutes"); return; }
    const secs = mins * 60;
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerTotal(secs);
    setTimerRemaining(secs);
    setTimerRunning(true);
    setTimerDone(false);
    setShowTimer(true);
  };

  const pauseResumeTimer = () => setTimerRunning((v) => !v);

  const resetTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerDone(false);
    setTimerRemaining(timerTotal);
  };

  const closeTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerRunning(false);
    setTimerDone(false);
    setTimerRemaining(0);
    setTimerTotal(0);
    setTimerInput("");
    setShowTimer(false);
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const timerProgress = timerTotal > 0 ? (timerTotal - timerRemaining) / timerTotal : 0;

  const loadRecipe = useCallback(async () => {
    if (!recipeId) { setNotFound(true); setLoading(false); return; }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("recipes")
        .select("*")
        .eq("id", parseInt(recipeId))
        .single();

      if (error || !data) { setNotFound(true); return; }
      setRecipe(toRecipe(normalizeRecipe(data)));
    } catch {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [recipeId]);

  useEffect(() => { loadRecipe(); }, [loadRecipe]);

  const handleDelete = async () => {
    if (!recipe) return;
    setIsDeleting(true);
    try {
      const { error } = await supabase.from("recipes").delete().eq("id", parseInt(recipe.id));
      if (error) throw error;
      toast.success("Recipe deleted");
      router.push("/recipes");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
      setIsDeleting(false);
    }
  };

  const toggleStep = (n: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(n)) { next.delete(n); } else { next.add(n); }
      return next;
    });
  };

  // ── Loading skeleton ──────────────────────────────────────────────────────
  if (loading) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8 animate-pulse space-y-6">
        <div className="h-40 bg-gray-200 rounded-2xl" />
        <div className="h-6 bg-gray-200 rounded w-1/3" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => <div key={i} className="h-4 bg-gray-200 rounded" />)}
        </div>
      </main>
    );
  }

  if (notFound || !recipe) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-20 text-center">
        <span className="text-7xl block mb-4" aria-hidden="true">🤔</span>
        <h1 className="text-2xl font-semibold text-gray-700 mb-2">Recipe not found</h1>
        <Link href="/recipes" className="text-indigo-600 hover:underline text-sm">
          ← Back to recipes
        </Link>
      </main>
    );
  }

  const totalMins = recipe.prepTimeMinutes + recipe.cookTimeMinutes;

  return (
    <>
      <Toaster position="top-right" />
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-8">

        {/* ── Back link ──────────────────────────────────────────────── */}
        <Link href="/recipes"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft size={15} /> Back to recipes
        </Link>

        {/* ── Hero banner ──────────────────────────────────────────────── */}
        <CuisineHeroBanner cuisine={recipe.cuisine} title={recipe.title} />

        {/* ── Action buttons ──────────────────────────────────────────── */}
        <div className="flex flex-wrap gap-3 justify-end">
          {/* Start Cooking / Timer */}
          {!showTimer ? (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
              <Timer size={14} className="text-amber-600" />
              <input
                type="number"
                min="1"
                max="480"
                placeholder="min"
                value={timerInput}
                onChange={(e) => setTimerInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") startTimer(); }}
                className="w-14 bg-transparent text-sm text-amber-900 font-medium focus:outline-none placeholder:text-amber-400"
              />
              <button
                type="button"
                onClick={() => startTimer()}
                className="flex items-center gap-1 px-3 py-1 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600 transition"
              >
                <Play size={11} /> Start
              </button>
              {totalMins > 0 && (
                <button
                  type="button"
                  onClick={() => startTimer(totalMins)}
                  className="text-xs text-amber-600 hover:underline"
                >
                  {totalMins} min
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTimer(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition"
            >
              <Timer size={14} /> Timer: {formatTime(timerRemaining)}
            </button>
          )}
          <Link href={`/edit/${recipe.id}`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            <Pencil size={14} /> Edit Recipe
          </Link>
          <button
            type="button"
            onClick={() => setShowDelete(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-100 text-sm font-medium text-red-500 hover:bg-red-50 transition"
          >
            <Trash2 size={14} /> Delete
          </button>
        </div>

        {/* ── Meta strip ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2, ease: EASE_WARM }}
          className="flex flex-wrap items-center gap-4 text-sm p-4 rounded-2xl"
          style={{ background: "var(--surface)", color: "var(--muted)" }}
        >
          {totalMins > 0 && (
            <span className="flex items-center gap-2">
              <Clock size={16} style={{ color: "var(--accent)", opacity: 0.7 }} />
              <span style={{ color: "var(--foreground)" }}>
                <b>{recipe.prepTimeMinutes}</b> prep + <b>{recipe.cookTimeMinutes}</b> cook = {totalMins} min
              </span>
            </span>
          )}
          <span className="flex items-center gap-2">
            <Users size={16} style={{ color: "var(--accent)", opacity: 0.7 }} />
            <span style={{ color: "var(--foreground)" }}>Serves {recipe.servings}</span>
          </span>
          {recipe.category && (
            <span style={{ color: "var(--muted)" }}>· {recipe.category}</span>
          )}
        </motion.div>

        {/* ── Tags ────────────────────────────────────────────────────── */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
          </div>
        )}

        {recipe.description && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, delay: 0.3, ease: EASE_WARM }}
            className="leading-relaxed italic"
            style={{ color: "var(--muted)" }}
          >
            {recipe.description}
          </motion.p>
        )}

        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left: ingredients + steps */}
          <div className="lg:col-span-2 space-y-8">

            {/* Ingredients */}
            <section>
              <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--foreground)" }}>
                Ingredients
              </h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing, i) => (
                  <motion.li
                    key={ing.id}
                    initial={{ opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.45, delay: i * 0.055, ease: EASE_WARM }}
                    className="flex items-center gap-3 py-2 border-b last:border-0"
                    style={{ borderColor: "var(--border)" }}
                  >
                    <IngredientIcon name={ing.name} size={18} className="flex-shrink-0 text-gray-500" />
                    <span className="flex-1 text-sm" style={{ color: "var(--foreground)" }}>{ing.name}</span>
                    <span className="text-sm font-medium tabular-nums" style={{ color: "var(--foreground)" }}>
                      {ing.quantity > 0 ? ing.quantity : ""} {ing.unit}
                    </span>
                    {ing.notes && (
                      <span className="text-xs italic" style={{ color: "var(--muted)" }}>{ing.notes}</span>
                    )}
                  </motion.li>
                ))}
              </ul>
            </section>

            {/* Equipment */}
            {recipe.equipment && recipe.equipment.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-gray-900 mb-3">Equipment</h2>
                <div className="flex flex-wrap gap-2">
                  {recipe.equipment.map((eq, i) => (
                    <span key={i}
                      className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 text-sm rounded-lg"
                    >
                      <IngredientIcon name={eq.name} type="equipment" size={14} />
                      {eq.name}
                    </span>
                  ))}
                </div>
              </section>
            )}

            {/* Kolam breath between ingredients and method */}
            <KolamDivider
              color="rgba(200, 140, 30, 0.22)"
              animateOnView
              className="my-2"
            />

            {/* Steps */}
            <section>
              <h2 className="text-xl font-semibold mb-4" style={{ color: "var(--foreground)" }}>
                Method
              </h2>
              <ol className="space-y-4">
                {recipe.steps.map((step, i) => {
                  const done = completedSteps.has(step.stepNumber);
                  return (
                    <motion.li
                      key={step.stepNumber}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: i * 0.07, ease: EASE_WARM }}
                      className={[
                        "flex gap-4 p-4 rounded-xl border cursor-pointer transition",
                        done
                          ? "opacity-60"
                          : "hover:shadow-sm",
                      ].join(" ")}
                      style={{
                        background: done ? "rgba(187, 247, 208, 0.25)" : "var(--surface)",
                        borderColor: done ? "rgba(74, 222, 128, 0.4)" : "var(--border)",
                      }}
                      onClick={() => toggleStep(step.stepNumber)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {done ? (
                          <CheckCircle2 size={20} className="text-green-500" />
                        ) : (
                          <span
                            className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                            style={{
                              background: "rgba(184, 92, 53, 0.12)",
                              color: "var(--accent)",
                            }}
                          >
                            {step.stepNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p
                          className={`text-sm leading-relaxed ${done ? "line-through" : ""}`}
                          style={{ color: "var(--foreground)", opacity: done ? 0.7 : 1 }}
                        >
                          {step.instruction}
                        </p>
                        {step.tip && (
                          <p className="mt-1.5 text-xs rounded-lg px-2.5 py-1.5"
                            style={{ color: "rgba(120, 80, 10, 0.9)", background: "rgba(212, 160, 23, 0.1)" }}>
                            💡 {step.tip}
                          </p>
                        )}
                        {step.durationMinutes && (
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); startTimer(step.durationMinutes!); }}
                            className="mt-1.5 flex items-center gap-1 text-xs transition"
                            style={{ color: "var(--accent)" }}
                          >
                            <Timer size={11} /> Start {step.durationMinutes} min timer
                          </button>
                        )}
                      </div>
                    </motion.li>
                  );
                })}
              </ol>
            </section>

            {recipe.notes && (
              <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
                <h3 className="font-semibold text-amber-900 mb-1.5">📝 Notes</h3>
                <p className="text-sm text-amber-800">{recipe.notes}</p>
              </section>
            )}
          </div>

          {/* Right: nutrition sidebar */}
          <div>
            <div className="sticky top-6 bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-900 mb-4">Nutrition</h2>
              <NutritionPanel
                nutrition={recipe.nutrition}
                status={recipe.nutritionStatus}
              />
            </div>
          </div>
        </div>
      </main>

      {/* ── Floating Timer Panel ──────────────────────────────────────── */}
      <AnimatePresence>
        {showTimer && (
          <motion.div
            initial={{ y: 120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 120, opacity: 0 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-sm"
          >
            <div className={[
              "mx-4 rounded-2xl shadow-2xl border overflow-hidden",
              timerDone
                ? "bg-green-500 border-green-400"
                : "bg-gray-900 border-gray-700",
            ].join(" ")}>
              {/* Progress bar */}
              <div className="h-1 bg-white/20">
                <motion.div
                  className={timerDone ? "h-full bg-white" : "h-full bg-amber-400"}
                  animate={{ width: `${timerProgress * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>

              <div className="px-5 py-4 flex items-center gap-4">
                {/* Time display */}
                <div className="flex-1">
                  <p className={`text-3xl font-mono font-bold tabular-nums ${timerDone ? "text-white" : "text-white"}`}>
                    {timerDone ? "Done! 🔔" : formatTime(timerRemaining)}
                  </p>
                  {timerTotal > 0 && !timerDone && (
                    <p className="text-xs text-white/50 mt-0.5">
                      of {formatTime(timerTotal)}
                    </p>
                  )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2">
                  {!timerDone && (
                    <button
                      type="button"
                      onClick={pauseResumeTimer}
                      className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition text-white"
                      aria-label={timerRunning ? "Pause" : "Resume"}
                    >
                      {timerRunning ? <Pause size={18} /> : <Play size={18} />}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={resetTimer}
                    className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition text-white"
                    aria-label="Reset"
                  >
                    <RotateCcw size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={closeTimer}
                    className="p-2.5 rounded-xl bg-white/15 hover:bg-white/25 transition text-white"
                    aria-label="Close"
                  >
                    <XIcon size={16} />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <ConfirmDialog
        open={showDelete}
        title={`Delete "${recipe.title}"?`}
        message="This will permanently remove the recipe. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setShowDelete(false)}
        loading={isDeleting}
      />
    </>
  );
}
