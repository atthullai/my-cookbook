"use client";

/**
 * Meal Planner — /planner  (SUPREME VERSION)
 *
 * - Weekly view (Mon–Sun) × 4 meal slots (Breakfast / Lunch / Dinner / Snack)
 * - Drag-and-drop from sidebar onto cells
 * - Inline servings adjuster (+ / −) per filled slot
 * - Click filled slot title → view recipe; ✕ to remove
 * - Week stats bar: total meals, unique cuisines, est. cook time
 * - "Plan this week" / "Copy previous week" actions
 * - Migration-aware error: shows clear instructions when table is missing
 * - All colors use CSS custom properties for dark-mode support
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingCart, X, Search, Minus, Plus, Calendar } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import { getCuisineTheme } from "@/lib/cuisine-themes";
import ConfirmDialog from "@/components/ConfirmDialog";
import LottieAnimation from "@/components/LottieAnimation";
import type { RecipeSummary, PlannedMeal, MealSlot } from "@/types";
import { CATEGORY_MAP } from "@/lib/pantry-items";

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS    = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const SLOTS: MealSlot[]  = ["breakfast", "lunch", "dinner", "snack"];
const SLOT_ICONS: Record<MealSlot, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

// CSS-var-based semantic slot styles (dark mode aware)
const SLOT_STYLES: Record<MealSlot, React.CSSProperties> = {
  breakfast: { background: "rgba(192,138,45,0.12)",  border: "1px solid rgba(192,138,45,0.3)",  color: "var(--saffron)" },
  lunch:     { background: "rgba(61,119,112,0.10)",   border: "1px solid rgba(61,119,112,0.28)", color: "var(--teal)" },
  dinner:    { background: "rgba(156,76,95,0.10)",    border: "1px solid rgba(156,76,95,0.26)",  color: "var(--berry)" },
  snack:     { background: "rgba(102,116,69,0.10)",   border: "1px solid rgba(102,116,69,0.26)", color: "var(--olive)" },
};

// ── Date helpers ──────────────────────────────────────────────────────────────
function getMondayOfWeek(offsetWeeks = 0): Date {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMon + offsetWeeks * 7);
  monday.setHours(0, 0, 0, 0);
  return monday;
}
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
function toISO(date: Date): string {
  return date.toISOString().split("T")[0];
}

// ── Draggable recipe chip ─────────────────────────────────────────────────────
function DraggableRecipeChip({ recipe }: { recipe: RecipeSummary }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id, title: recipe.title, cuisine: recipe.cuisine },
  });
  const theme = getCuisineTheme(recipe.cuisine);

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={[
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium cursor-grab active:cursor-grabbing",
        "transition-all duration-150 select-none border",
        theme.cardGradient, theme.textColor,
        isDragging ? "opacity-50 shadow-2xl scale-95 rotate-1" : "shadow-sm hover:shadow-md hover:scale-[1.02]",
      ].join(" ")}
    >
      <span className="text-base flex-shrink-0">{theme.emoji}</span>
      <span className="truncate flex-1 leading-tight text-xs">{recipe.title}</span>
      <span className="text-[9px] opacity-50 flex-shrink-0 font-normal">drag</span>
    </div>
  );
}

// ── Droppable slot cell ───────────────────────────────────────────────────────
interface SlotCellProps {
  date:          Date;
  slot:          MealSlot;
  meal?:         PlannedMeal;
  recipe?:       RecipeSummary;
  onRemove:      () => void;
  onServings:    (delta: number) => void;
}

function SlotCell({ date, slot, meal, recipe, onRemove, onServings }: SlotCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${toISO(date)}-${slot}`,
    data: { date: toISO(date), slot },
  });
  const theme = recipe ? getCuisineTheme(recipe.cuisine) : null;

  return (
    <div
      ref={setNodeRef}
      className="min-h-[72px] rounded-xl border-2 border-dashed transition-all duration-150 p-1"
      style={
        isOver
          ? { borderColor: "var(--saffron)", background: "rgba(192,138,45,0.08)", transform: "scale(1.03)" }
          : meal
          ? { borderColor: "transparent", padding: "4px" }
          : { borderColor: "var(--border)", background: "var(--surface)" }
      }
    >
      {meal && recipe && theme ? (
        <motion.div
          layout
          className={`relative h-full rounded-lg overflow-hidden ${theme.cardGradient} p-2 min-h-[64px] flex flex-col justify-between`}
        >
          {/* Recipe title + remove */}
          <div className="flex items-start justify-between gap-1">
            <Link
              href={`/recipes/${recipe.id}`}
              className={`text-[11px] font-semibold leading-tight line-clamp-2 flex-1 hover:underline ${theme.textColor}`}
              onClick={(e) => e.stopPropagation()}
            >
              {recipe.title}
            </Link>
            <button
              type="button"
              onClick={onRemove}
              className="p-0.5 rounded-full bg-black/20 hover:bg-black/40 transition text-white flex-shrink-0 mt-0.5"
              aria-label="Remove"
            >
              <X size={8} />
            </button>
          </div>

          {/* Servings adjuster */}
          <div className="flex items-center gap-1 mt-1">
            <span className="text-[9px] opacity-60 mr-0.5">{theme.emoji}</span>
            <button
              type="button"
              onClick={() => onServings(-1)}
              className="w-4 h-4 rounded-full bg-black/15 hover:bg-black/30 flex items-center justify-center text-white transition"
              aria-label="Decrease servings"
            >
              <Minus size={7} />
            </button>
            <span className={`text-[10px] font-semibold tabular-nums ${theme.textColor}`}>
              {meal.servings}
            </span>
            <button
              type="button"
              onClick={() => onServings(1)}
              className="w-4 h-4 rounded-full bg-black/15 hover:bg-black/30 flex items-center justify-center text-white transition"
              aria-label="Increase servings"
            >
              <Plus size={7} />
            </button>
            <span className={`text-[9px] opacity-60 ${theme.textColor}`}>srv</span>
          </div>
        </motion.div>
      ) : (
        <div className="h-full flex items-center justify-center min-h-[64px]">
          <span className="text-xl opacity-25" style={{ color: "var(--muted)" }}>+</span>
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const [weekOffset,    setWeekOffset]    = useState(0);
  const monday    = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);
  const weekDates = useMemo(() => DAYS.map((_, i) => addDays(monday, i)), [monday]);

  const [plannedMeals,  setPlannedMeals]  = useState<PlannedMeal[]>([]);
  const [recipes,       setRecipes]       = useState<RecipeSummary[]>([]);
  const [loadingMeals,  setLoadingMeals]  = useState(true);
  const [activeId,      setActiveId]      = useState<string | null>(null);
  const [removeTarget,  setRemoveTarget]  = useState<PlannedMeal | null>(null);
  const [isRemoving,    setIsRemoving]    = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  // ── Expiry suggestions banner ──────────────────────────────────────────────
  interface ExpirySuggestion {
    itemName: string;
    daysLeft: number;
    recipe: RecipeSummary;
  }
  const [expirySuggestions, setExpirySuggestions] = useState<ExpirySuggestion[]>([]);
  const [expiryBannerDismissed, setExpiryBannerDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    const t = localStorage.getItem("planner-expiry-banner-dismissed");
    return t ? Date.now() - parseInt(t) < 86_400_000 : false;
  });
  // Day+slot picker for "Add to plan"
  const [addToPlanSuggestion, setAddToPlanSuggestion] = useState<ExpirySuggestion | null>(null);
  const [addToPlanDay, setAddToPlanDay] = useState("");
  const [addToPlanSlot, setAddToPlanSlot] = useState<MealSlot>("dinner");
  const [isAddingToPlan, setIsAddingToPlan] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Load data ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoadingMeals(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const weekStart = toISO(monday);
      const weekEnd   = toISO(addDays(monday, 6));

      const [mealsRes, recipesRes] = await Promise.all([
        supabase.from("planned_meals").select("*")
          .eq("user_id", user.id)
          .gte("meal_date", weekStart)
          .lte("meal_date", weekEnd),
        supabase.from("recipes").select("*").eq("user_id", user.id),
      ]);

      if (mealsRes.error) {
        const msg = mealsRes.error.message;
        if (msg.includes("relation") || msg.includes("does not exist")) {
          setMigrationNeeded(true);
          toast.error("Setup needed — see the yellow banner above.", { duration: 5000 });
        } else {
          toast.error(msg);
        }
        setRecipes(toRecipeSummaries(mapRecipeRows(recipesRes.data ?? [])));
        return;
      }
      if (recipesRes.error) throw recipesRes.error;

      setMigrationNeeded(false);

      // Load pantry items for expiry suggestions
      const { data: pantryRows } = await supabase.from("pantry_items")
        .select("name, expiry_date, storage_location, category")
        .eq("user_id", user.id);

      const now = Date.now();
      const expiringPantry = (pantryRows ?? []).filter((p: { expiry_date: string | null; storage_location: string; category: string }) => {
        if (!p.expiry_date) return false;
        const daysLeft = Math.ceil((new Date(p.expiry_date).getTime() - now) / 86_400_000);
        if (daysLeft < 0) return false;
        const isFridge = p.storage_location === "fridge" || CATEGORY_MAP[p.category]?.openedStorage === "fridge";
        return isFridge ? daysLeft <= 3 : daysLeft <= 7;
      });

      const allRecipesForSuggestions = toRecipeSummaries(mapRecipeRows(recipesRes.data ?? []));
      const rawForSuggestions = mapRecipeRows(recipesRes.data ?? []);
      const suggestions: ExpirySuggestion[] = [];
      for (const pantryItem of expiringPantry.slice(0, 10)) {
        const nameL = (pantryItem.name as string).toLowerCase();
        const daysLeft = Math.ceil((new Date(pantryItem.expiry_date as string).getTime() - now) / 86_400_000);
        for (const raw of rawForSuggestions) {
          const recipe = allRecipesForSuggestions.find((r) => r.id === String(raw.id));
          if (!recipe) continue;
          const matches = raw.ingredients.some((g) =>
            g.items.some((i) => i.name_en.toLowerCase().includes(nameL) || nameL.includes(i.name_en.toLowerCase()))
          );
          if (matches) {
            suggestions.push({ itemName: pantryItem.name as string, daysLeft, recipe });
            break;
          }
        }
        if (suggestions.length >= 3) break;
      }
      setExpirySuggestions(suggestions);

      const mealRows: PlannedMeal[] = (mealsRes.data ?? []).map((row) => ({
        id:       row.id as string,
        date:     row.meal_date as string,
        slot:     row.meal_slot as MealSlot,
        recipeId: String(row.recipe_id),
        servings: (row.servings as number) ?? 1,
        notes:    (row.notes as string | undefined) ?? undefined,
      }));

      setPlannedMeals(mealRows);
      setRecipes(toRecipeSummaries(mapRecipeRows(recipesRes.data ?? [])));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load planner");
    } finally {
      setLoadingMeals(false);
    }
  }, [monday]);

  useEffect(() => { void load(); }, [load]);

  // ── Add to plan from expiry suggestion ────────────────────────────────────
  const addSuggestionToPlan = async () => {
    if (!addToPlanSuggestion || !addToPlanDay) return;
    setIsAddingToPlan(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      if (plannedMeals.find((m) => m.date === addToPlanDay && m.slot === addToPlanSlot)) {
        toast.error("That slot is already filled — pick another"); setIsAddingToPlan(false); return;
      }
      const { data, error } = await supabase.from("planned_meals").insert({
        user_id: user.id, meal_date: addToPlanDay, meal_slot: addToPlanSlot,
        recipe_id: parseInt(addToPlanSuggestion.recipe.id), servings: 1,
      }).select().single();
      if (error) throw error;
      setPlannedMeals((prev) => [...prev, {
        id: data.id as string, date: data.meal_date as string,
        slot: data.meal_slot as MealSlot, recipeId: String(data.recipe_id), servings: 1,
      }]);
      toast.success(`${addToPlanSuggestion.recipe.title} added to plan`);
      setAddToPlanSuggestion(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed");
    } finally {
      setIsAddingToPlan(false);
    }
  };

  // ── DnD: drag start ────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  // ── DnD: drop ─────────────────────────────────────────────────────────────
  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const recipeId = (active.data.current as { recipeId: string }).recipeId;
    const { date, slot } = over.data.current as { date: string; slot: MealSlot };

    if (plannedMeals.find((m) => m.date === date && m.slot === slot)) {
      toast.error("Slot already filled — remove the current meal first");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      const { data, error } = await supabase.from("planned_meals").insert({
        user_id:   user.id,
        meal_date: date,
        meal_slot: slot,
        recipe_id: parseInt(recipeId),
        servings:  1,
      }).select().single();

      if (error) {
        if (error.message.includes("relation") || error.message.includes("does not exist")) {
          setMigrationNeeded(true);
          toast.error("Run the Supabase migration first — see the yellow banner.");
        } else {
          throw error;
        }
        return;
      }

      setPlannedMeals((prev) => [
        ...prev,
        {
          id:       data.id as string,
          date:     data.meal_date as string,
          slot:     data.meal_slot as MealSlot,
          recipeId: String(data.recipe_id),
          servings: 1,
        },
      ]);

      const recipe = recipes.find((r) => r.id === recipeId);
      toast.success(`${recipe?.title ?? "Recipe"} → ${slot}`, { duration: 2500 });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add meal");
    }
  }, [plannedMeals, recipes]);

  // ── Update servings ────────────────────────────────────────────────────────
  const handleServings = useCallback(async (mealId: string, delta: number) => {
    const meal = plannedMeals.find((m) => m.id === mealId);
    if (!meal) return;
    const newServings = Math.max(1, meal.servings + delta);
    // Optimistic update
    setPlannedMeals((prev) => prev.map((m) => m.id === mealId ? { ...m, servings: newServings } : m));
    try {
      const { error } = await supabase.from("planned_meals")
        .update({ servings: newServings })
        .eq("id", mealId);
      if (error) throw error;
    } catch (err) {
      // Revert on failure
      setPlannedMeals((prev) => prev.map((m) => m.id === mealId ? { ...m, servings: meal.servings } : m));
      toast.error(err instanceof Error ? err.message : "Failed to update servings");
    }
  }, [plannedMeals]);

  // ── Remove meal ────────────────────────────────────────────────────────────
  const handleRemove = async () => {
    if (!removeTarget) return;
    setIsRemoving(true);
    try {
      const { error } = await supabase.from("planned_meals").delete().eq("id", removeTarget.id);
      if (error) throw error;
      setPlannedMeals((prev) => prev.filter((m) => m.id !== removeTarget.id));
      toast.success("Removed from plan");
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove");
    } finally {
      setIsRemoving(false);
    }
  };

  // ── Clear entire week ──────────────────────────────────────────────────────
  const handleClearWeek = async () => {
    if (plannedMeals.length === 0) return;
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const ids = plannedMeals.map((m) => m.id);
      const { error } = await supabase.from("planned_meals").delete().in("id", ids);
      if (error) throw error;
      setPlannedMeals([]);
      toast.success("Week cleared");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to clear");
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getMeal   = (date: Date, slot: MealSlot) =>
    plannedMeals.find((m) => m.date === toISO(date) && m.slot === slot);
  const getRecipe = (id: string) => recipes.find((r) => r.id === id);

  const filteredRecipes = sidebarSearch.trim()
    ? recipes.filter((r) => r.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : recipes;

  const activeRecipe = activeId ? recipes.find((r) => `recipe-${r.id}` === activeId) : null;

  const weekLabel = `${monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(monday, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  // ── Week stats ─────────────────────────────────────────────────────────────
  const weekStats = useMemo(() => {
    const totalMeals = plannedMeals.length;
    const uniqueCuisines = new Set(
      plannedMeals.map((m) => getRecipe(m.recipeId)?.cuisine).filter(Boolean)
    ).size;
    return { totalMeals, uniqueCuisines };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannedMeals, recipes]);

  const mealsPerDay = weekDates.map((date) =>
    SLOTS.filter((slot) => getMeal(date, slot)).length
  );

  return (
    <>
      <Toaster position="top-right" />

      <main className="min-h-screen" style={{ background: "var(--parchment)" }}>
        <div className="max-w-screen-xl mx-auto px-4 py-8">

          {/* ── Migration banner ──────────────────────────────────────────── */}
          <AnimatePresence>
            {migrationNeeded && (
              <motion.div
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -16 }}
                className="mb-6 rounded-2xl p-4 flex gap-3 items-start"
                style={{ background: "rgba(192,138,45,0.12)", border: "1px solid rgba(192,138,45,0.35)" }}
              >
                <span className="text-2xl flex-shrink-0">⚠️</span>
                <div>
                  <p className="font-semibold text-sm" style={{ color: "var(--foreground)" }}>
                    One-time setup needed
                  </p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                    The meal planner table doesn&apos;t exist yet. Go to{" "}
                    <strong>Supabase → SQL Editor → New Query</strong>, paste the contents of{" "}
                    <code className="text-xs px-1 rounded" style={{ background: "rgba(0,0,0,0.07)" }}>
                      supabase/migrations/20260528_fix_all_tables.sql
                    </code>{" "}
                    and click <strong>Run</strong>. Then refresh this page.
                  </p>
                </div>
                <button type="button" onClick={() => setMigrationNeeded(false)} className="ml-auto p-1" style={{ color: "var(--muted)" }}>
                  <X size={14} />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Header ────────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] mb-1"
                style={{ color: "var(--accent)", opacity: 0.8 }}>
                Weekly Menu
              </p>
              <h1 className="text-3xl font-bold leading-tight" style={{ color: "var(--foreground)" }}>
                This Week&apos;s Plan
              </h1>
              <div className="flex items-center gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setWeekOffset((w) => w - 1)}
                  className="p-1.5 rounded-lg border transition shadow-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}
                >
                  <ChevronLeft size={15} />
                </button>
                <span className="text-sm font-medium tabular-nums" style={{ color: "var(--muted)" }}>{weekLabel}</span>
                <button
                  type="button"
                  onClick={() => setWeekOffset((w) => w + 1)}
                  className="p-1.5 rounded-lg border transition shadow-sm"
                  style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}
                >
                  <ChevronRight size={15} />
                </button>
                {weekOffset !== 0 && (
                  <button
                    type="button"
                    onClick={() => setWeekOffset(0)}
                    className="text-xs font-medium hover:underline ml-1"
                    style={{ color: "var(--accent)" }}
                  >
                    ← Today
                  </button>
                )}
              </div>
            </div>

            {/* Meal planner animation + action buttons */}
            <div className="flex flex-col items-end gap-3">
              <div aria-hidden="true">
                <LottieAnimation
                  src="/animations/meal-planner.json"
                  loop
                  style={{ width: 200, height: 200 }}
                />
              </div>
            <div className="flex items-center gap-2">
              {plannedMeals.length > 0 && (
                <button
                  type="button"
                  onClick={() => void handleClearWeek()}
                  className="px-3 py-2 rounded-xl text-sm transition"
                  style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  Clear week
                </button>
              )}
              <Link
                href="/planner/shopping"
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
                style={{ background: "var(--foreground)", color: "var(--parchment)" }}
              >
                <ShoppingCart size={15} /> Shopping List
              </Link>
            </div>
            </div>
          </div>

          {/* ── Week stats bar ─────────────────────────────────────────────── */}
          {!loadingMeals && (
            <div className="flex flex-wrap items-center gap-4 mb-6 px-4 py-3 rounded-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-2">
                <Calendar size={14} style={{ color: "var(--accent)", opacity: 0.7 }} />
                <span className="text-sm" style={{ color: "var(--muted)" }}>
                  <span className="font-semibold" style={{ color: "var(--foreground)" }}>{weekStats.totalMeals}</span>
                  {" "}meal{weekStats.totalMeals !== 1 ? "s" : ""} planned
                </span>
              </div>
              {weekStats.uniqueCuisines > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-sm" style={{ color: "var(--muted)" }}>
                    <span className="font-semibold" style={{ color: "var(--foreground)" }}>{weekStats.uniqueCuisines}</span>
                    {" "}cuisine{weekStats.uniqueCuisines !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              {weekStats.totalMeals === 0 && (
                <span className="text-sm italic" style={{ color: "var(--muted)", opacity: 0.7 }}>
                  Drag recipes from the right panel onto any slot to start planning
                </span>
              )}
            </div>
          )}

          {/* ── Expiry-driven suggestions banner ─────────────────────────── */}
          {!expiryBannerDismissed && expirySuggestions.length > 0 && (
            <div className="rounded-2xl p-4 mb-5 space-y-2"
              style={{ background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.28)" }}>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-bold uppercase tracking-wide" style={{ color: "#b45309" }}>
                  ⏰ Use before they expire
                </p>
                <button type="button"
                  onClick={() => {
                    setExpiryBannerDismissed(true);
                    if (typeof window !== "undefined") localStorage.setItem("planner-expiry-banner-dismissed", String(Date.now()));
                  }}
                  className="text-xs px-2 py-1 rounded-lg transition"
                  style={{ color: "var(--muted)", border: "1px solid var(--border)" }}
                >
                  Dismiss
                </button>
              </div>
              {expirySuggestions.map((s, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                  style={{ background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.15)" }}>
                  <p className="text-sm" style={{ color: "var(--foreground)" }}>
                    Use <strong>{s.itemName}</strong>{" "}
                    <span className="text-xs" style={{ color: "#b45309" }}>
                      ({s.daysLeft === 0 ? "expires today!" : s.daysLeft === 1 ? "exp tomorrow" : `${s.daysLeft}d left`})
                    </span>{" "}
                    → <span className="font-medium">{s.recipe.title}</span>
                  </p>
                  <button type="button"
                    onClick={() => {
                      setAddToPlanSuggestion(s);
                      setAddToPlanDay(toISO(monday));
                      setAddToPlanSlot("dinner");
                    }}
                    className="flex-shrink-0 text-xs px-2.5 py-1.5 rounded-lg font-medium transition whitespace-nowrap"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    Add to plan →
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── DnD context ────────────────────────────────────────────────── */}
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={(e) => void handleDragEnd(e)}>
            <div className="flex gap-5">

              {/* ── Weekly grid (LEFT) ─────────────────────────────────────── */}
              <div className="flex-1 overflow-x-auto order-first">
                {loadingMeals ? (
                  <div className="animate-pulse space-y-2">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="grid grid-cols-8 gap-2">
                        <div className="h-16 rounded-xl" style={{ background: "var(--border)" }} />
                        {[...Array(7)].map((_, j) => (
                          <div key={j} className="h-16 rounded-xl" style={{ background: "var(--surface-strong)" }} />
                        ))}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ minWidth: 560 }}>
                    {/* Day headers */}
                    <div className="grid gap-1.5 mb-2" style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}>
                      <div />
                      {weekDates.map((date, i) => {
                        const isToday = toISO(date) === toISO(new Date());
                        const mealCount = mealsPerDay[i];
                        return (
                          <div key={i} className="text-center pb-1">
                            <span
                              className="text-[10px] font-semibold uppercase tracking-wide"
                              style={{ color: isToday ? "var(--accent)" : "var(--muted)" }}
                            >
                              {DAYS[i]}
                            </span>
                            <div
                              className="w-7 h-7 rounded-full flex items-center justify-center mx-auto mt-0.5 text-sm font-bold"
                              style={isToday
                                ? { background: "var(--accent)", color: "#fff" }
                                : { color: "var(--foreground)" }}
                            >
                              {date.getDate()}
                            </div>
                            {mealCount > 0 && (
                              <div className="flex justify-center gap-0.5 mt-1">
                                {[...Array(Math.min(mealCount, 4))].map((_, d) => (
                                  <div key={d} className="w-1 h-1 rounded-full" style={{ background: "var(--accent)" }} />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Slot rows */}
                    {SLOTS.map((slot) => (
                      <div
                        key={slot}
                        className="grid gap-1.5 mb-1.5"
                        style={{ gridTemplateColumns: "60px repeat(7, 1fr)" }}
                      >
                        {/* Slot label */}
                        <div
                          className="flex flex-col items-center justify-center rounded-xl px-1 py-2"
                          style={SLOT_STYLES[slot]}
                        >
                          <span className="text-lg leading-none">{SLOT_ICONS[slot]}</span>
                          <span className="text-[8px] font-semibold capitalize mt-0.5 opacity-70">{slot}</span>
                        </div>

                        {/* Day cells */}
                        {weekDates.map((date, i) => {
                          const meal   = getMeal(date, slot);
                          const recipe = meal ? getRecipe(meal.recipeId) : undefined;
                          return (
                            <SlotCell
                              key={i}
                              date={date}
                              slot={slot}
                              meal={meal}
                              recipe={recipe}
                              onRemove={() => meal && setRemoveTarget(meal)}
                              onServings={(delta) => meal && void handleServings(meal.id, delta)}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Recipe sidebar (RIGHT) ─────────────────────────────────── */}
              <div className="w-52 flex-shrink-0">
                <div className="rounded-2xl p-4 shadow-sm sticky top-6"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "var(--muted)" }}>
                    Your Recipes
                  </p>

                  <div className="relative mb-3">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 leading-none"
                      style={{ color: "var(--muted)", opacity: 0.6 }} />
                    <input
                      type="text"
                      placeholder="Search…"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 rounded-xl text-xs focus:outline-none"
                      style={{ border: "1px solid var(--border)", background: "var(--surface-strong)", color: "var(--foreground)", paddingLeft: "2.5rem" }}
                    />
                  </div>

                  <p className="text-[10px] mb-2" style={{ color: "var(--muted)", opacity: 0.7 }}>
                    ← Drag onto a day slot
                  </p>

                  <div className="space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-0.5">
                    {filteredRecipes.length === 0 ? (
                      <div className="text-center py-8">
                        <p className="text-xs" style={{ color: "var(--muted)" }}>
                          {sidebarSearch ? "No matches" : "No recipes yet"}
                        </p>
                        {!sidebarSearch && (
                          <Link href="/add" className="text-xs mt-2 block hover:underline" style={{ color: "var(--accent)" }}>
                            + Add a recipe
                          </Link>
                        )}
                      </div>
                    ) : (
                      filteredRecipes.map((r) => (
                        <DraggableRecipeChip key={r.id} recipe={r} />
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeRecipe && (() => {
                const t = getCuisineTheme(activeRecipe.cuisine);
                return (
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium shadow-2xl ${t.cardGradient} ${t.textColor} rotate-2 scale-105`}>
                    <span>{t.emoji}</span>
                    <span className="truncate max-w-[160px]">{activeRecipe.title}</span>
                  </div>
                );
              })()}
            </DragOverlay>
          </DndContext>

          {/* ── Add-to-plan picker modal ───────────────────────────────────── */}
          {addToPlanSuggestion && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setAddToPlanSuggestion(null)}>
              <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onClick={(e) => e.stopPropagation()}>
                <div>
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>Add to plan</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                    {addToPlanSuggestion.recipe.title}
                  </p>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Day</label>
                  <select value={addToPlanDay} onChange={(e) => setAddToPlanDay(e.target.value)}
                    className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}>
                    {weekDates.map((d) => (
                      <option key={toISO(d)} value={toISO(d)}>
                        {d.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Slot</label>
                  <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    {SLOTS.map((s, i) => (
                      <button key={s} type="button"
                        onClick={() => setAddToPlanSlot(s)}
                        className="flex-1 py-2 text-xs font-medium transition capitalize"
                        style={{
                          background: addToPlanSlot === s ? "var(--accent)" : "var(--surface)",
                          color: addToPlanSlot === s ? "#fff" : "var(--foreground)",
                          borderRight: i < SLOTS.length - 1 ? "1px solid var(--border)" : undefined,
                        }}>
                        {SLOT_ICONS[s]} {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setAddToPlanSuggestion(null)}
                    className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--muted)" }}>
                    Cancel
                  </button>
                  <button type="button" onClick={() => void addSuggestionToPlan()} disabled={isAddingToPlan}
                    className="px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                    style={{ background: "var(--accent)", color: "#fff" }}>
                    {isAddingToPlan ? "Adding…" : "✓ Add"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── Empty week hint ────────────────────────────────────────────── */}
          {!loadingMeals && !migrationNeeded && plannedMeals.length === 0 && (
            <div className="mt-8 text-center py-8 rounded-2xl"
              style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
              <p className="text-3xl mb-3">📅</p>
              <p className="font-medium" style={{ color: "var(--foreground)" }}>Your week is open</p>
              <p className="text-sm mt-1" style={{ color: "var(--muted)" }}>
                Drag any recipe from the right panel onto a meal slot to start building your menu
              </p>
              {recipes.length === 0 && (
                <Link href="/add" className="inline-block mt-4 px-5 py-2 rounded-xl text-sm font-medium transition"
                  style={{ background: "var(--accent)", color: "#fff" }}>
                  + Add your first recipe
                </Link>
              )}
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove from plan?"
        message="This will free up the slot. You can drag the recipe back any time."
        confirmLabel="Remove"
        onConfirm={() => void handleRemove()}
        onCancel={() => setRemoveTarget(null)}
        loading={isRemoving}
      />
    </>
  );
}
