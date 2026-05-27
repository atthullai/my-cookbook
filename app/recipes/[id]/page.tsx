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
import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Clock, Users, Pencil, Trash2, CheckCircle2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { normalizeRecipe } from "@/lib/recipe-types";
import { toRecipe } from "@/lib/recipe-adapter";
import CuisineHeroBanner from "@/components/CuisineHeroBanner";
import NutritionPanel from "@/components/NutritionPanel";
import TagBadge from "@/components/TagBadge";
import IngredientIcon from "@/components/IngredientIcon";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { Recipe } from "@/types";

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
        <div className="flex gap-3 justify-end">
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
        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 p-4 bg-gray-50 rounded-2xl">
          {totalMins > 0 && (
            <span className="flex items-center gap-2">
              <Clock size={16} className="text-gray-400" />
              <span><b>{recipe.prepTimeMinutes}</b> prep + <b>{recipe.cookTimeMinutes}</b> cook = {totalMins} min</span>
            </span>
          )}
          <span className="flex items-center gap-2">
            <Users size={16} className="text-gray-400" />
            Serves {recipe.servings}
          </span>
          {recipe.category && <span className="text-gray-400">· {recipe.category}</span>}
        </div>

        {/* ── Tags ────────────────────────────────────────────────────── */}
        {recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recipe.tags.map((tag) => <TagBadge key={tag} tag={tag} />)}
          </div>
        )}

        {recipe.description && (
          <p className="text-gray-600 leading-relaxed">{recipe.description}</p>
        )}

        {/* ── Two-column layout ─────────────────────────────────────── */}
        <div className="grid lg:grid-cols-3 gap-8">

          {/* Left: ingredients + steps */}
          <div className="lg:col-span-2 space-y-8">

            {/* Ingredients */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Ingredients</h2>
              <ul className="space-y-2">
                {recipe.ingredients.map((ing) => (
                  <motion.li
                    key={ing.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center gap-3 py-2 border-b border-gray-50 last:border-0"
                  >
                    <IngredientIcon name={ing.name} size={18} className="text-gray-500 flex-shrink-0" />
                    <span className="flex-1 text-gray-700 text-sm">{ing.name}</span>
                    <span className="text-sm font-medium text-gray-900 tabular-nums">
                      {ing.quantity > 0 ? ing.quantity : ""} {ing.unit}
                    </span>
                    {ing.notes && (
                      <span className="text-xs text-gray-400 italic">{ing.notes}</span>
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

            {/* Steps */}
            <section>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Method</h2>
              <ol className="space-y-4">
                {recipe.steps.map((step) => {
                  const done = completedSteps.has(step.stepNumber);
                  return (
                    <motion.li
                      key={step.stepNumber}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={[
                        "flex gap-4 p-4 rounded-xl border cursor-pointer transition",
                        done
                          ? "bg-green-50 border-green-200 opacity-60"
                          : "bg-white border-gray-100 hover:border-gray-200",
                      ].join(" ")}
                      onClick={() => toggleStep(step.stepNumber)}
                    >
                      <div className="flex-shrink-0 mt-0.5">
                        {done ? (
                          <CheckCircle2 size={20} className="text-green-500" />
                        ) : (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold">
                            {step.stepNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className={`text-sm text-gray-700 leading-relaxed ${done ? "line-through" : ""}`}>
                          {step.instruction}
                        </p>
                        {step.tip && (
                          <p className="mt-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-2.5 py-1.5">
                            💡 {step.tip}
                          </p>
                        )}
                        {step.durationMinutes && (
                          <p className="mt-1 text-xs text-gray-400">⏱ {step.durationMinutes} min</p>
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
