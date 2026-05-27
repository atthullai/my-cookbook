"use client";

/**
 * Meal Planner — /planner
 *
 * Warm cookbook-inspired meal planning:
 * - Weekly view (Mon–Sun) × 4 meal slots (Breakfast / Lunch / Dinner / Snack)
 * - Drag-and-drop recipes from sidebar onto day/slot cells
 * - Click filled slot → remove (ConfirmDialog)
 * - Week navigation, "This week" jump
 * - Shopping list link
 * - Warm paper aesthetic, handcrafted feel
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, ShoppingCart, X, Search } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import { getCuisineTheme } from "@/lib/cuisine-themes";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { RecipeSummary, PlannedMeal, MealSlot } from "@/types";

const DAYS    = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const SLOTS: MealSlot[]  = ["breakfast", "lunch", "dinner", "snack"];
const SLOT_ICONS: Record<MealSlot, string>  = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };
// Slot label styles use CSS vars for background/border so dark mode works,
// but keep semantic accent tones for identity (amber=morning, teal=midday, berry=evening, olive=snack)
const SLOT_STYLES: Record<MealSlot, React.CSSProperties> = {
  breakfast: { background: "rgba(192,138,45,0.12)",  border: "1px solid rgba(192,138,45,0.3)",  color: "var(--saffron)" },
  lunch:     { background: "rgba(61,119,112,0.10)",   border: "1px solid rgba(61,119,112,0.28)", color: "var(--teal)" },
  dinner:    { background: "rgba(156,76,95,0.10)",    border: "1px solid rgba(156,76,95,0.26)",  color: "var(--berry)" },
  snack:     { background: "rgba(102,116,69,0.10)",   border: "1px solid rgba(102,116,69,0.26)", color: "var(--olive)" },
};

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

// ── Draggable recipe chip ─────────────────────────────────────────────────
function DraggableRecipeChip({ recipe }: { recipe: RecipeSummary }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id, title: recipe.title, cuisine: recipe.cuisine },
  });
  const theme = getCuisineTheme(recipe.cuisine);
  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={[
        "flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium cursor-grab active:cursor-grabbing",
        "transition-all duration-150 select-none border",
        theme.cardGradient, theme.textColor,
        isDragging
          ? "opacity-50 shadow-2xl scale-95 rotate-1"
          : "shadow-sm hover:shadow-md hover:scale-[1.02]",
      ].join(" ")}
    >
      <span className="text-base flex-shrink-0">{theme.emoji}</span>
      <span className="truncate flex-1 leading-tight">{recipe.title}</span>
      <span className="text-[10px] opacity-60 flex-shrink-0">drag</span>
    </div>
  );
}

// ── Droppable slot cell ───────────────────────────────────────────────────
interface SlotCellProps {
  date:     Date;
  slot:     MealSlot;
  meal?:    PlannedMeal;
  recipe?:  RecipeSummary;
  onRemove: () => void;
}

function SlotCell({ date, slot, meal, recipe, onRemove }: SlotCellProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${toISO(date)}-${slot}`,
    data: { date: toISO(date), slot },
  });
  const theme = recipe ? getCuisineTheme(recipe.cuisine) : null;

  return (
    <div
      ref={setNodeRef}
      className="min-h-[68px] rounded-xl border-2 border-dashed transition-all duration-150 p-1.5"
      style={
        isOver
          ? { borderColor: "var(--saffron)", background: "rgba(192,138,45,0.08)", transform: "scale(1.03)" }
          : meal
          ? { borderColor: "transparent" }
          : { borderColor: "var(--border)", background: "var(--surface)" }
      }
    >
      {meal && recipe && theme ? (
        <div className={`relative h-full rounded-lg overflow-hidden ${theme.cardGradient} p-2.5 min-h-[60px]`}>
          <p className={`text-[11px] font-semibold leading-tight pr-5 line-clamp-2 ${theme.textColor}`}>
            {recipe.title}
          </p>
          <p className="text-[10px] opacity-60 mt-1 flex items-center gap-1">
            <span>{theme.emoji}</span>
            <span className="text-white">{meal.servings} srv</span>
          </p>
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-black/20 hover:bg-black/40 transition text-white"
            aria-label="Remove meal"
          >
            <X size={9} />
          </button>
        </div>
      ) : (
        <div className="h-full flex items-center justify-center min-h-[60px]">
          <span className="text-xl" style={{ color: "var(--border)" }}>+</span>
        </div>
      )}
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const monday    = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);
  const weekDates = useMemo(() => DAYS.map((_, i) => addDays(monday, i)), [monday]);

  const [plannedMeals,  setPlannedMeals]  = useState<PlannedMeal[]>([]);
  const [recipes,       setRecipes]       = useState<RecipeSummary[]>([]);
  const [loadingMeals,  setLoadingMeals]  = useState(true);
  const [activeId,      setActiveId]      = useState<string | null>(null);
  const [removeTarget,  setRemoveTarget]  = useState<PlannedMeal | null>(null);
  const [isRemoving,    setIsRemoving]    = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Load data ─────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoadingMeals(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
        // Help the user understand if the migration hasn't been run
        const msg = mealsRes.error.message;
        if (msg.includes("relation") || msg.includes("does not exist")) {
          toast.error("The planned_meals table doesn't exist yet. Run the migration in Supabase → SQL Editor.", { duration: 8000 });
        } else {
          toast.error(msg);
        }
        return;
      }
      if (recipesRes.error) throw recipesRes.error;

      const mealRows: PlannedMeal[] = (mealsRes.data ?? []).map((row) => ({
        id:       row.id,
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

  useEffect(() => { load(); }, [load]);

  // ── DnD handlers ──────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const recipeId = (active.data.current as { recipeId: string }).recipeId;
    const { date, slot } = over.data.current as { date: string; slot: MealSlot };

    const alreadyPlanned = plannedMeals.find((m) => m.date === date && m.slot === slot);
    if (alreadyPlanned) {
      toast.error("This slot already has a meal — remove it first");
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase.from("planned_meals").insert({
        user_id:   user.id,
        meal_date: date,
        meal_slot: slot,
        recipe_id: parseInt(recipeId),
        servings:  1,
      }).select().single();

      if (error) {
        if (error.message.includes("relation") || error.message.includes("does not exist")) {
          toast.error("Run the Supabase migration first: supabase/migrations/20260527_planned_meals_pantry.sql", { duration: 8000 });
        } else {
          throw error;
        }
        return;
      }

      const newMeal: PlannedMeal = {
        id:       data.id as string,
        date:     data.meal_date as string,
        slot:     data.meal_slot as MealSlot,
        recipeId: String(data.recipe_id),
        servings: (data.servings as number) ?? 1,
      };
      setPlannedMeals((prev) => [...prev, newMeal]);
      toast.success(`Added to ${slot}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add meal");
    }
  };

  // ── Remove meal ───────────────────────────────────────────────────────────
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
      toast.error(err instanceof Error ? err.message : "Failed to remove meal");
    } finally {
      setIsRemoving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getMeal   = (date: Date, slot: MealSlot) =>
    plannedMeals.find((m) => m.date === toISO(date) && m.slot === slot);
  const getRecipe = (id: string) => recipes.find((r) => r.id === id);

  const filteredRecipes = sidebarSearch.trim()
    ? recipes.filter((r) => r.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : recipes;

  const activeRecipe = activeId
    ? recipes.find((r) => `recipe-${r.id}` === activeId)
    : null;

  const weekLabel = `${monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(monday, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  // Count meals per day for the daily summary
  const mealsPerDay = weekDates.map((date) =>
    SLOTS.filter((slot) => getMeal(date, slot)).length
  );

  return (
    <>
      <Toaster position="top-right" />

      {/* Warm paper background */}
      <main className="min-h-screen" style={{ background: "linear-gradient(160deg, #fdf8f0 0%, #fef9f3 50%, #fdf6ee 100%)" }}>
        <div className="max-w-screen-xl mx-auto px-4 py-8">

          {/* ── Header ──────────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest mb-1"
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
                    ← This week
                  </button>
                )}
              </div>
            </div>

            <Link
              href="/planner/shopping"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition shadow-sm"
              style={{ background: "var(--foreground)", color: "var(--parchment)" }}
            >
              <ShoppingCart size={15} /> Shopping List
            </Link>
          </div>

          {/* ── DnD context ───────────────────────────────────────────── */}
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-5">

              {/* ── Sidebar ─────────────────────────────────────────────── */}
              <div className="w-52 flex-shrink-0">
                <div className="rounded-2xl p-4 shadow-sm sticky top-6"
                  style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-bold uppercase tracking-widest mb-3"
                    style={{ color: "var(--muted)" }}>
                    Your Recipes
                  </p>

                  {/* Search */}
                  <div className="relative mb-3">
                    <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--muted)", opacity: 0.6 }} />
                    <input
                      type="search"
                      placeholder="Search…"
                      value={sidebarSearch}
                      onChange={(e) => setSidebarSearch(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 rounded-xl text-xs focus:outline-none"
                      style={{ border: "1px solid var(--border)", background: "var(--surface-strong)", color: "var(--foreground)" }}
                    />
                  </div>

                  <p className="text-[10px] mb-2" style={{ color: "var(--muted)", opacity: 0.7 }}>Drag a recipe onto any slot →</p>

                  <div className="space-y-1.5 max-h-[calc(100vh-260px)] overflow-y-auto pr-0.5">
                    {filteredRecipes.length === 0 ? (
                      <p className="text-xs text-center py-6" style={{ color: "var(--muted)" }}>
                        {sidebarSearch ? "No matches" : "No recipes yet"}
                      </p>
                    ) : (
                      filteredRecipes.map((r) => (
                        <DraggableRecipeChip key={r.id} recipe={r} />
                      ))
                    )}
                  </div>
                </div>
              </div>

              {/* ── Weekly grid ─────────────────────────────────────────── */}
              <div className="flex-1 overflow-x-auto">
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
                    <div className="grid gap-1.5 mb-2" style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}>
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
                              className="w-8 h-8 rounded-full flex items-center justify-center mx-auto mt-0.5 text-sm font-bold"
                              style={isToday
                                ? { background: "var(--accent)", color: "#fff" }
                                : { color: "var(--foreground)" }}
                            >
                              {date.getDate()}
                            </div>
                            {mealCount > 0 && (
                              <div className="flex justify-center gap-0.5 mt-1">
                                {[...Array(Math.min(mealCount, 4))].map((_, d) => (
                                  <div key={d} className="w-1 h-1 rounded-full bg-amber-400" />
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
                        style={{ gridTemplateColumns: "64px repeat(7, 1fr)" }}
                      >
                        {/* Slot label */}
                        <div
                          className="flex flex-col items-center justify-center rounded-xl px-2 py-2"
                          style={SLOT_STYLES[slot]}
                        >
                          <span className="text-lg leading-none">{SLOT_ICONS[slot]}</span>
                          <span className="text-[9px] font-semibold capitalize mt-0.5 opacity-70">{slot}</span>
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
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeRecipe && (() => {
                const t = getCuisineTheme(activeRecipe.cuisine);
                return (
                  <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium shadow-2xl ${t.cardGradient} ${t.textColor} rotate-2`}>
                    <span>{t.emoji}</span>
                    <span>{activeRecipe.title}</span>
                  </div>
                );
              })()}
            </DragOverlay>
          </DndContext>

          {/* ── Week is empty hint ─────────────────────────────────────── */}
          {!loadingMeals && plannedMeals.length === 0 && (
            <div className="mt-8 text-center py-6" style={{ borderTop: "1px solid var(--border)" }}>
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                <span className="font-medium" style={{ color: "var(--foreground)" }}>Your week is open.</span>{" "}
                Drag recipes from the sidebar onto any meal slot to start planning.
              </p>
            </div>
          )}
        </div>
      </main>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove from plan?"
        message="This will remove the meal from this slot. You can add it back anytime."
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
        loading={isRemoving}
      />
    </>
  );
}
