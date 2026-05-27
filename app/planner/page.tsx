"use client";

/**
 * Meal Planner — /planner
 *
 * Features:
 * - 7-column weekly grid (Mon–Sun), 4 rows (Breakfast / Lunch / Dinner / Snack)
 * - Each slot is a DnD drop zone via @dnd-kit
 * - Sidebar recipe list is draggable
 * - Drop onto a slot → saves PlannedMeal to Supabase
 * - Click an existing meal → remove it (ConfirmDialog)
 * - "Generate Shopping List" → navigates to /planner/shopping
 * - Week navigation (prev/next week arrows)
 * - Diet plan calorie summary at the top
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { ChevronLeft, ChevronRight, ShoppingCart, X } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import { getCuisineTheme } from "@/lib/cuisine-themes";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { RecipeSummary, PlannedMeal, MealSlot } from "@/types";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const SLOTS: MealSlot[] = ["breakfast", "lunch", "dinner", "snack"];
const SLOT_ICONS: Record<MealSlot, string> = {
  breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎",
};

/** Returns YYYY-MM-DD for the Monday of the given week offset from today */
function getMondayOfWeek(offsetWeeks = 0): Date {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun
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

// ── Draggable recipe chip (sidebar) ───────────────────────────────────────
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
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium cursor-grab active:cursor-grabbing transition select-none",
        theme.cardGradient,
        theme.textColor,
        isDragging ? "opacity-50 shadow-xl scale-95" : "shadow-sm hover:shadow-md",
      ].join(" ")}
    >
      <span aria-hidden="true">{theme.emoji}</span>
      <span className="truncate">{recipe.title}</span>
    </div>
  );
}

// ── Drop slot cell ─────────────────────────────────────────────────────────
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
      className={[
        "min-h-[56px] rounded-lg border-2 border-dashed transition p-1.5",
        isOver
          ? "border-indigo-400 bg-indigo-50 scale-[1.02]"
          : meal
          ? "border-transparent bg-white"
          : "border-gray-200 bg-gray-50/50 hover:border-gray-300",
      ].join(" ")}
    >
      {meal && recipe && theme ? (
        <div className={`relative rounded-lg overflow-hidden ${theme.cardGradient} ${theme.textColor} p-2`}>
          <p className="text-xs font-medium leading-tight pr-5 line-clamp-2">{recipe.title}</p>
          <p className="text-[10px] opacity-70 mt-0.5">{theme.emoji} {meal.servings} srv</p>
          <button
            type="button"
            onClick={onRemove}
            className="absolute top-1 right-1 p-0.5 rounded-full bg-white/20 hover:bg-white/40 transition"
            aria-label="Remove meal"
          >
            <X size={10} />
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function PlannerPage() {
  const [weekOffset, setWeekOffset] = useState(0);
  const monday = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);
  const weekDates = useMemo(
    () => DAYS.map((_, i) => addDays(monday, i)),
    [monday]
  );

  const [plannedMeals, setPlannedMeals] = useState<PlannedMeal[]>([]);
  const [recipes, setRecipes]           = useState<RecipeSummary[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(true);
  const [activeId, setActiveId]         = useState<string | null>(null);
  const [removeTarget, setRemoveTarget] = useState<PlannedMeal | null>(null);
  const [isRemoving, setIsRemoving]     = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  // ── Load data ────────────────────────────────────────────────────────────
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

      if (mealsRes.error) throw mealsRes.error;
      if (recipesRes.error) throw recipesRes.error;

      const mealRows: PlannedMeal[] = (mealsRes.data ?? []).map((row) => ({
        id:       row.id,
        date:     row.meal_date as string,
        slot:     row.meal_slot as MealSlot,
        recipeId: String(row.recipe_id),
        servings: (row.servings as number) ?? 1,
        notes:    row.notes ?? undefined,
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

  // ── DnD handlers ─────────────────────────────────────────────────────────
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(String(event.active.id));
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over) return;

    const recipeId = (active.data.current as { recipeId: string }).recipeId;
    const { date, slot } = over.data.current as { date: string; slot: MealSlot };

    // Don't add if slot already has a meal
    const alreadyPlanned = plannedMeals.find(
      (m) => m.date === date && m.slot === slot
    );
    if (alreadyPlanned) {
      toast.error("Slot already has a meal — remove it first");
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

      if (error) throw error;

      const newMeal: PlannedMeal = {
        id:       data.id as string,
        date:     data.meal_date as string,
        slot:     data.meal_slot as MealSlot,
        recipeId: String(data.recipe_id),
        servings: (data.servings as number) ?? 1,
      };
      setPlannedMeals((prev) => [...prev, newMeal]);
      toast.success("Added to planner");
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
      toast.success("Meal removed");
      setRemoveTarget(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to remove meal");
    } finally {
      setIsRemoving(false);
    }
  };

  // ── Helpers ───────────────────────────────────────────────────────────────
  const getMeal = (date: Date, slot: MealSlot) =>
    plannedMeals.find((m) => m.date === toISO(date) && m.slot === slot);

  const getRecipe = (id: string) => recipes.find((r) => r.id === id);

  const filteredRecipes = sidebarSearch
    ? recipes.filter((r) => r.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : recipes;

  const activeRecipe = activeId
    ? recipes.find((r) => `recipe-${r.id}` === activeId)
    : null;

  const weekLabel = `${monday.toLocaleDateString("en-GB", { day:"numeric", month:"short" })} – ${addDays(monday, 6).toLocaleDateString("en-GB", { day:"numeric", month:"short", year:"numeric" })}`;

  return (
    <>
      <Toaster position="top-right" />
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-screen-xl mx-auto px-4 py-8">

          {/* ── Header ──────────────────────────────────────────────── */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Meal Planner</h1>
              <div className="flex items-center gap-3 mt-2">
                <button type="button" onClick={() => setWeekOffset((w) => w - 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                >
                  <ChevronLeft size={16} />
                </button>
                <span className="text-sm font-medium text-gray-700">{weekLabel}</span>
                <button type="button" onClick={() => setWeekOffset((w) => w + 1)}
                  className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                >
                  <ChevronRight size={16} />
                </button>
                {weekOffset !== 0 && (
                  <button type="button" onClick={() => setWeekOffset(0)}
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    This week
                  </button>
                )}
              </div>
            </div>

            <Link href="/planner/shopping"
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-700 transition shadow-sm"
            >
              <ShoppingCart size={16} /> Shopping List
            </Link>
          </div>

          {/* ── DnD context ─────────────────────────────────────────── */}
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex gap-6">

              {/* ── Sidebar ─────────────────────────────────────────── */}
              <div className="w-56 flex-shrink-0 space-y-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Recipes</p>
                <input
                  type="search"
                  placeholder="Search…"
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
                <div className="space-y-2 max-h-[calc(100vh-200px)] overflow-y-auto pr-1">
                  {filteredRecipes.map((r) => (
                    <DraggableRecipeChip key={r.id} recipe={r} />
                  ))}
                  {filteredRecipes.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No recipes found</p>
                  )}
                </div>
              </div>

              {/* ── Planner grid ────────────────────────────────────── */}
              <div className="flex-1 overflow-x-auto">
                {loadingMeals ? (
                  <div className="animate-pulse grid grid-cols-7 gap-2">
                    {[...Array(28)].map((_, i) => (
                      <div key={i} className="h-16 bg-gray-200 rounded-lg" />
                    ))}
                  </div>
                ) : (
                  <table className="w-full border-collapse" style={{ minWidth: 600 }}>
                    <thead>
                      <tr>
                        <th className="w-20 pb-3" />
                        {weekDates.map((date, i) => {
                          const isToday = toISO(date) === toISO(new Date());
                          return (
                            <th key={i} className="pb-3 text-center">
                              <span className={[
                                "text-xs font-semibold",
                                isToday ? "text-indigo-600" : "text-gray-500",
                              ].join(" ")}>
                                {DAYS[i]}
                              </span>
                              <br />
                              <span className={[
                                "inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold",
                                isToday ? "bg-indigo-600 text-white" : "text-gray-700",
                              ].join(" ")}>
                                {date.getDate()}
                              </span>
                            </th>
                          );
                        })}
                      </tr>
                    </thead>
                    <tbody>
                      {SLOTS.map((slot) => (
                        <tr key={slot}>
                          <td className="pr-2 py-1">
                            <span className="text-xs font-medium text-gray-500 capitalize flex items-center gap-1">
                              {SLOT_ICONS[slot]} {slot}
                            </span>
                          </td>
                          {weekDates.map((date, i) => {
                            const meal   = getMeal(date, slot);
                            const recipe = meal ? getRecipe(meal.recipeId) : undefined;
                            return (
                              <td key={i} className="p-1">
                                <SlotCell
                                  date={date}
                                  slot={slot}
                                  meal={meal}
                                  recipe={recipe}
                                  onRemove={() => meal && setRemoveTarget(meal)}
                                />
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>

            {/* Drag overlay */}
            <DragOverlay>
              {activeRecipe && (
                <div className={`px-3 py-2 rounded-xl text-sm font-medium shadow-xl ${getCuisineTheme(activeRecipe.cuisine).cardGradient} ${getCuisineTheme(activeRecipe.cuisine).textColor}`}>
                  {getCuisineTheme(activeRecipe.cuisine).emoji} {activeRecipe.title}
                </div>
              )}
            </DragOverlay>
          </DndContext>
        </div>
      </main>

      <ConfirmDialog
        open={!!removeTarget}
        title="Remove meal?"
        message="This will remove the meal from the planner for this slot."
        confirmLabel="Remove"
        onConfirm={handleRemove}
        onCancel={() => setRemoveTarget(null)}
        loading={isRemoving}
      />
    </>
  );
}
