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
import React, { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  DndContext, DragEndEvent, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable,
} from "@dnd-kit/core";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingCart, X, Minus, Plus, Calendar, UtensilsCrossed, Loader2, Repeat, History } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import { getCuisineTheme } from "@/lib/cuisine-themes";
import ConfirmDialog from "@/components/ConfirmDialog";
import IngredientIcon from "@/components/IngredientIcon";
import LogSnackModal from "@/components/LogSnackModal";
import type { RecipeSummary, PlannedMeal, MealSlot, MealEntryType } from "@/types";
import { convertToBase } from "@/lib/conversion";
import { getKcalIndex, estimateFoodKcal, type KcalIndexEntry } from "@/lib/food-kcal";
import { markMealCooked } from "@/app/actions/planner";
import {
  checkMeal, buildReservations,
  type MealCheckResult, type PantryStockItem, type RecipeIngredientRow,
} from "@/lib/pantryCheck";

// ── Constants ─────────────────────────────────────────────────────────────────
const DAYS    = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
const SLOTS: MealSlot[]  = ["breakfast", "lunch", "dinner", "snack"];
const SLOT_ICONS: Record<MealSlot, string> = { breakfast: "🌅", lunch: "☀️", dinner: "🌙", snack: "🍎" };

// Manual (non-recipe) entry kinds — icon + label.
const ENTRY_META: Record<Exclude<MealEntryType, "recipe">, { icon: string; label: string }> = {
  food:       { icon: "🥕", label: "Food" },
  note:       { icon: "📝", label: "Note" },
  restaurant: { icon: "🍽", label: "Restaurant" },
  delivery:   { icon: "🛵", label: "Delivery" },
  leftover:   { icon: "♻️", label: "Leftover" },
  frozen:     { icon: "🧊", label: "Frozen / ready meal" },
  other:      { icon: "🍴", label: "Other" },
};
const MANUAL_TYPES = Object.keys(ENTRY_META) as Exclude<MealEntryType, "recipe">[];

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

// ── Droppable slot cell ───────────────────────────────────────────────────────
interface SlotCellProps {
  date:         Date;
  slot:         MealSlot;
  meal?:        PlannedMeal;
  recipe?:      RecipeSummary;
  onRemove:     () => void;
  onServings:   (delta: number) => void;
  onCooked:     () => void;
  onRepeat:     () => void;
  mealStatus?:  MealCheckResult;
  expanded?:    boolean;
  onExpand?:    () => void;
  onClickPlan?: () => void;
  hasSelected?: boolean;
}

function SlotCell({ date, slot, meal, recipe, onRemove, onServings, onCooked, onRepeat, mealStatus, expanded, onExpand, onClickPlan, hasSelected }: SlotCellProps) {
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
          className="relative h-full rounded-lg overflow-hidden min-h-[72px] flex flex-col justify-between cursor-pointer"
          style={{ background: "rgba(30,20,10,0.85)" }}
          onClick={onExpand}
        >
          {/* Background image */}
          {recipe.imageUrl && (
            <Image
              src={recipe.imageUrl}
              alt=""
              fill
              className="object-cover opacity-40"
              sizes="160px"
            />
          )}
          {!recipe.imageUrl && (
            <div className={`absolute inset-0 ${theme.cardGradient} opacity-90`} />
          )}

          {/* Content overlay */}
          <div className="relative z-10 flex flex-col justify-between h-full p-2">
            {/* Recipe title + remove + sufficiency badge */}
            <div className="flex items-start justify-between gap-1">
              <Link
                href={`/recipes/${recipe.id}`}
                className="text-[11px] font-semibold leading-tight line-clamp-2 flex-1 hover:underline text-white drop-shadow"
                onClick={(e) => e.stopPropagation()}
              >
                {recipe.title.split("|")[0].split("–")[0].trim()}
              </Link>
              <div className="flex items-center gap-0.5 flex-shrink-0">
                {mealStatus && (
                  <span
                    className="text-[9px] px-1 py-0.5 rounded font-bold"
                    style={{
                      background: mealStatus.overall === "sufficient" ? "rgba(34,197,94,0.35)" :
                                  mealStatus.overall === "partial"    ? "rgba(245,158,11,0.35)" :
                                                                        "rgba(239,68,68,0.35)",
                      color: "#fff",
                    }}
                    title={`Pantry: ${mealStatus.overall}`}
                  >
                    {mealStatus.overall === "sufficient" ? "✓" :
                     mealStatus.overall === "partial"    ? "~" : "!"}
                  </span>
                )}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onRemove(); }}
                  className="p-0.5 rounded-full bg-black/30 hover:bg-black/60 transition text-white"
                  aria-label="Remove"
                >
                  <X size={8} />
                </button>
              </div>
            </div>

          {/* Servings adjuster + cooked button */}
          <div className="flex items-center gap-1 mt-1">
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onServings(-1); }}
              className="w-4 h-4 rounded-full bg-black/15 hover:bg-black/30 flex items-center justify-center text-white transition"
              aria-label="Decrease servings"
            >
              <Minus size={7} />
            </button>
            <span className="text-[10px] font-semibold tabular-nums text-white">
              {meal.servings}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onServings(1); }}
              className="w-4 h-4 rounded-full bg-black/15 hover:bg-black/30 flex items-center justify-center text-white transition"
              aria-label="Increase servings"
            >
              <Plus size={7} />
            </button>
            <span className="text-[9px] opacity-60 text-white">srv</span>
            {/* Repeat weekly */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRepeat(); }}
              className="ml-auto p-0.5 rounded-full bg-black/15 hover:bg-black/40 transition text-white flex-shrink-0"
              aria-label="Repeat weekly"
              title="Repeat weekly (next 3 weeks)"
            >
              <Repeat size={8} />
            </button>
            {/* Mark as cooked */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCooked(); }}
              className="p-0.5 rounded-full bg-black/15 hover:bg-green-500/80 transition text-white flex-shrink-0"
              aria-label="Mark as cooked"
              title="Mark as cooked"
            >
              <UtensilsCrossed size={8} />
            </button>
          </div>
          </div>{/* end content overlay */}

          {/* Expanded ingredient list */}
          <AnimatePresence>
            {expanded && mealStatus && (
              <motion.div
                key="ing-list"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="relative z-10 mt-1 px-2 pb-2 max-h-48 overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="rounded-lg p-1.5" style={{ background: "rgba(0,0,0,0.45)" }}>
                  <ul className="space-y-0.5">
                    {mealStatus.ingredients
                      .filter((i) => i.status !== "skipped")
                      .slice(0, 8)
                      .map((ing, idx) => (
                        <li key={idx} className="flex items-center gap-1 text-[9px]" style={{ color: "rgba(255,255,255,0.9)" }}>
                          <span className="flex-shrink-0">
                            {ing.status === "sufficient"  ? "✓" :
                             ing.status === "partial"     ? "⚠" : "✗"}
                          </span>
                          <span className="flex-1 truncate">{ing.name}</span>
                          <span className="flex-shrink-0 opacity-70">
                            {ing.needed_base >= 1000
                              ? `${(ing.needed_base / 1000).toFixed(1)}${ing.base_unit === "g" ? "kg" : "L"}`
                              : `${ing.needed_base}${ing.base_unit}`}
                          </span>
                        </li>
                      ))
                    }
                  </ul>
                  {/* Add missing to shopping list */}
                  {mealStatus.overall !== "sufficient" && (
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.stopPropagation();
                        const missing = mealStatus.ingredients.filter((i) => i.status === "unavailable" || i.status === "partial");
                        if (!missing.length) return;
                        const { data: { user } } = await supabase.auth.getUser();
                        if (!user) return;
                        await Promise.all(missing.map((ing) =>
                          supabase.from("shopping_list").upsert({
                            user_id: user.id,
                            name: ing.name,
                            quantity: ing.needed_base >= 1000 ? ing.needed_base / 1000 : ing.needed_base,
                            unit: ing.needed_base >= 1000 ? (ing.base_unit === "g" ? "kg" : "L") : ing.base_unit,
                            category: "other",
                            checked: false,
                            source: "planner",
                          }, { onConflict: "user_id,name" })
                        ));
                        toast.success(`${missing.length} missing item${missing.length > 1 ? "s" : ""} added to shopping list`);
                      }}
                      className="mt-1.5 w-full text-[9px] py-1 rounded-md font-semibold transition"
                      style={{ background: "rgba(201,149,42,0.25)", color: "#fff" }}
                    >
                      🛒 Add missing to list
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : meal ? (
        // Manual / non-recipe entry (restaurant, delivery, leftover, frozen…)
        <div
          className="relative h-full rounded-lg overflow-hidden min-h-[72px] flex flex-col justify-between p-2"
          style={{ background: "var(--surface-strong)", border: "1px dashed var(--border)" }}
        >
          <div className="flex items-start justify-between gap-1">
            <span className="text-[11px] font-semibold leading-tight line-clamp-2 flex-1 flex items-center gap-1" style={{ color: "var(--foreground)" }}>
              {meal.entryType === "food" && meal.label ? (
                <IngredientIcon name={meal.label} size={14} />
              ) : (
                <span className="mr-1">{ENTRY_META[(meal.entryType ?? "other") as Exclude<MealEntryType, "recipe">]?.icon ?? "🍴"}</span>
              )}
              {meal.label || ENTRY_META[(meal.entryType ?? "other") as Exclude<MealEntryType, "recipe">]?.label || "Meal"}
            </span>
            <div className="flex items-center gap-0.5 flex-shrink-0">
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRepeat(); }}
                className="p-0.5 rounded-full transition"
                style={{ background: "rgba(0,0,0,0.06)", color: "var(--muted)" }}
                aria-label="Repeat weekly"
                title="Repeat weekly (next 3 weeks)"
              >
                <Repeat size={8} />
              </button>
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onRemove(); }}
                className="p-0.5 rounded-full transition"
                style={{ background: "rgba(0,0,0,0.08)", color: "var(--muted)" }}
                aria-label="Remove"
              >
                <X size={8} />
              </button>
            </div>
          </div>
          <span className="text-[9px] uppercase tracking-wide font-semibold mt-1" style={{ color: "var(--muted)", opacity: 0.7 }}>
            {ENTRY_META[(meal.entryType ?? "other") as Exclude<MealEntryType, "recipe">]?.label ?? "Meal"}
            {meal.foodQty ? ` · ${meal.foodQty} ${meal.foodUnit ?? ""}` : ""}
            {meal.foodKcal ? ` · ~${meal.foodKcal} cal` : ""}
          </span>
        </div>
      ) : (
        <div
          className="h-full flex items-center justify-center min-h-[64px] transition-colors"
          style={{ background: hasSelected ? "rgba(192,138,45,0.06)" : "transparent", cursor: "pointer" }}
          onClick={onClickPlan}
          title={hasSelected ? "Plan selected recipe here" : "Add a meal here"}
        >
          <span
            className="text-xl transition-opacity"
            style={{ color: "var(--muted)", opacity: hasSelected ? 0.5 : 0.25 }}
          >+</span>
        </div>
      )}
    </div>
  );
}

// Saved week template.
interface TemplateSlot {
  d: number;            // 0=Mon .. 6=Sun
  slot: MealSlot;
  recipe_id: number | null;
  entry_type: MealEntryType;
  label: string | null;
}
interface MealTemplate {
  id: string;
  name: string;
  slots: TemplateSlot[];
}

// Colour a day by its total calorie load (rough whole-day guidance).
function calorieColor(kcal: number): string {
  if (kcal <= 0)    return "var(--muted)";
  if (kcal <= 2200) return "#3d7770"; // green — light day
  if (kcal <= 2800) return "#c08a2d"; // amber — moderate
  return "#9c4c5f";                   // berry — heavy day
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function PlannerPage() {
  const [weekOffset,    setWeekOffset]    = useState(0);
  const monday    = useMemo(() => getMondayOfWeek(weekOffset), [weekOffset]);
  const weekDates = useMemo(() => DAYS.map((_, i) => addDays(monday, i)), [monday]);

  // View mode. Day view reuses the loaded week's data; Month is a read-only
  // calendar overview that fetches its own per-day summary.
  const [view, setView] = useState<"week" | "day" | "month">("week");
  const [dayIndex, setDayIndex] = useState(() => {
    const wd = new Date().getDay();      // 0=Sun..6=Sat
    return wd === 0 ? 6 : wd - 1;        // → Mon=0..Sun=6
  });
  const [monthAnchor, setMonthAnchor] = useState(() => {
    const d = new Date(); d.setDate(1); d.setHours(0, 0, 0, 0); return d;
  });
  const [monthData, setMonthData] = useState<Record<string, { count: number; kcal: number }>>({});

  const visibleDates = view === "day" ? [weekDates[dayIndex]] : weekDates;

  // Step forward/back: by month / week / day depending on the active view.
  const stepBack = () => {
    if (view === "month") { setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1)); return; }
    if (view === "week")  { setWeekOffset((w) => w - 1); return; }
    if (dayIndex > 0) setDayIndex((d) => d - 1);
    else { setWeekOffset((w) => w - 1); setDayIndex(6); }
  };
  const stepForward = () => {
    if (view === "month") { setMonthAnchor((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1)); return; }
    if (view === "week")  { setWeekOffset((w) => w + 1); return; }
    if (dayIndex < 6) setDayIndex((d) => d + 1);
    else { setWeekOffset((w) => w + 1); setDayIndex(0); }
  };

  // Calendar cells for the month grid (leading/trailing blanks to fill weeks).
  const monthCells = useMemo<(Date | null)[]>(() => {
    const year = monthAnchor.getFullYear(), m = monthAnchor.getMonth();
    const first = new Date(year, m, 1);
    const startWd = first.getDay() === 0 ? 6 : first.getDay() - 1; // Mon=0
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startWd; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, m, d));
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [monthAnchor]);

  // Jump from a month-cell into Day view for that date.
  const openDayFromMonth = (date: Date) => {
    const todayMon = getMondayOfWeek(0).getTime();
    const d = new Date(date);
    const wd = d.getDay();
    d.setDate(d.getDate() + (wd === 0 ? -6 : 1 - wd));
    d.setHours(0, 0, 0, 0);
    setWeekOffset(Math.round((d.getTime() - todayMon) / (7 * 86_400_000)));
    setDayIndex(wd === 0 ? 6 : wd - 1);
    setView("week");
  };

  const [plannedMeals,  setPlannedMeals]  = useState<PlannedMeal[]>([]);
  const [recipes,       setRecipes]       = useState<RecipeSummary[]>([]);
  const [loadingMeals,  setLoadingMeals]  = useState(true);
  const [, setActiveId]      = useState<string | null>(null);
  const [removeTarget,  setRemoveTarget]  = useState<PlannedMeal | null>(null);
  const [isRemoving,    setIsRemoving]    = useState(false);

  // ── Pantry sufficiency ────────────────────────────────────────────────────
  const [, setPantryStock]   = useState<PantryStockItem[]>([]);
  const [, setRecipeIngMap]  = useState<Record<string, RecipeIngredientRow[]>>({});
  const [mealStatuses,  setMealStatuses]  = useState<Record<string, MealCheckResult>>({});
  const [expandedMealId, setExpandedMealId] = useState<string | null>(null);

  // ── Mark as Cooked modal ──────────────────────────────────────────────────
  const [cookedTarget,    setCookedTarget]    = useState<PlannedMeal | null>(null);
  const [cookedMultiplier, setCookedMultiplier] = useState(1);
  const [cookedIngredients, setCookedIngredients] = useState<
    { name: string; qty: number; unit: string; neededBase: number; baseUnit: string; tier: number }[]
  >([]);
  const [isPendingCooked, startCookedTransition] = useTransition();
  const [migrationNeeded, setMigrationNeeded] = useState(false);

  // Used by the (currently dormant) "add to plan" suggestion modal.
  interface ExpirySuggestion {
    items: { name: string; daysLeft: number }[];
    recipe: RecipeSummary;
  }
  // Day+slot picker for "Add to plan"
  const [addToPlanSuggestion, setAddToPlanSuggestion] = useState<ExpirySuggestion | null>(null);
  const [addToPlanDay, setAddToPlanDay] = useState("");
  const [addToPlanSlot, setAddToPlanSlot] = useState<MealSlot>("dinner");
  const [isAddingToPlan, setIsAddingToPlan] = useState(false);

  // ── Meal templates ─────────────────────────────────────────────────────────
  const [showTemplates, setShowTemplates] = useState(false);
  const [templates, setTemplates]         = useState<MealTemplate[]>([]);
  const [templateName, setTemplateName]   = useState("");
  const [templateBusy, setTemplateBusy]   = useState(false);

  // ── Meal history ───────────────────────────────────────────────────────────
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory]         = useState<{ date: string; slot: string; title: string }[]>([]);

  // ── Log-a-snack (ad-hoc eat event) ─────────────────────────────────────────
  const [showSnack, setShowSnack] = useState(false);

  // ── Top tabs: Plan / Queue / Previous ──────────────────────────────────────
  const [tab, setTab] = useState<"plan" | "queue" | "previous">("plan");
  const [planMenuOpen, setPlanMenuOpen] = useState(false);
  const [dayMenuIso, setDayMenuIso] = useState<string | null>(null);
  const [queueItems, setQueueItems] = useState<{ id: string; recipeId: string; label: string | null }[]>([]);
  const [queueAddRecipe, setQueueAddRecipe] = useState("");
  const [scheduleItem, setScheduleItem] = useState<{ id: string; recipeId: string; label: string | null } | null>(null);
  const [scheduleDate, setScheduleDate] = useState("");
  const [scheduleSlot, setScheduleSlot] = useState<MealSlot>("dinner");

  // ── Quick (manual / non-recipe) entry modal ───────────────────────────────
  const [quickEntry, setQuickEntry] = useState<{ date: string; slot: MealSlot } | null>(null);
  const [quickType, setQuickType]   = useState<Exclude<MealEntryType, "recipe">>("restaurant");
  const [quickLabel, setQuickLabel] = useState("");
  // Food entries: quantity + unit + calories (typed kcal wins; else library estimate)
  const [quickQty, setQuickQty]   = useState("1");
  const [quickUnit, setQuickUnit] = useState("glass");
  const [quickKcal, setQuickKcal] = useState("");
  const [kcalIndex, setKcalIndex] = useState<KcalIndexEntry[]>([]);
  useEffect(() => { getKcalIndex().then(setKcalIndex); }, []);
  const autoKcal = useMemo(() => {
    if (quickType !== "food") return null;
    return estimateFoodKcal(quickLabel, parseFloat(quickQty) || 0, quickUnit, kcalIndex);
  }, [quickType, quickLabel, quickQty, quickUnit, kcalIndex]);
  const [quickLeftoverFrom, setQuickLeftoverFrom] = useState<string>(""); // source planned_meal id
  const [quickRecipeId, setQuickRecipeId] = useState<string>(""); // selected saved recipe (recipe add)
  const [isAddingManual, setIsAddingManual] = useState(false);

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
        supabase.from("recipes").select("*").or(`is_public.eq.true,user_id.eq.${user.id}`),
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
      const mealRows: PlannedMeal[] = (mealsRes.data ?? []).map((row) => ({
        id:        row.id as string,
        date:      row.meal_date as string,
        slot:      row.meal_slot as MealSlot,
        recipeId:  row.recipe_id != null ? String(row.recipe_id) : "",
        servings:  (row.servings as number) ?? 1,
        notes:     (row.notes as string | undefined) ?? undefined,
        entryType: ((row.entry_type as MealEntryType | undefined) ?? "recipe"),
        label:     (row.label as string | undefined) ?? undefined,
        leftoverOf: (row.leftover_of as string | null | undefined) ?? null,
        foodQty:   row.food_qty != null ? Number(row.food_qty) : null,
        foodUnit:  (row.food_unit as string | null | undefined) ?? null,
        foodKcal:  row.food_kcal != null ? Number(row.food_kcal) : null,
      }));

      setPlannedMeals(mealRows);
      const recipeSummaries = toRecipeSummaries(mapRecipeRows(recipesRes.data ?? []));
      setRecipes(recipeSummaries);

      // ── HP2: Fetch pantry stock + recipe_ingredients for sufficiency check ──
      const recipeIds = [...new Set(mealRows.map((m) => parseInt(m.recipeId)).filter(Boolean))];

      const [pantryRes, ingRes] = await Promise.all([
        supabase.from("pantry_items")
          .select("name, quantity_base, base_unit, expiry_date, depleted")
          .eq("user_id", user.id)
          .eq("depleted", false),
        recipeIds.length > 0
          ? supabase.from("recipe_ingredients")
              .select("recipe_id, name, quantity, unit, pantry_ref")
              .in("recipe_id", recipeIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const stock: PantryStockItem[] = (pantryRes.data ?? []).map((r) => ({
        name:          r.name as string,
        quantity_base: parseFloat(String(r.quantity_base ?? 0)),
        base_unit:     (r.base_unit as string) ?? "g",
        expiry_date:   (r.expiry_date as string | null),
        depleted:      Boolean(r.depleted),
      }));
      setPantryStock(stock);

      // Build map: recipe_id → ingredients[]
      const ingMap: Record<string, RecipeIngredientRow[]> = {};
      for (const row of (ingRes.data ?? [])) {
        const key = String(row.recipe_id);
        if (!ingMap[key]) ingMap[key] = [];
        ingMap[key].push({
          name:       row.name as string,
          quantity:   row.quantity != null ? parseFloat(String(row.quantity)) : null,
          unit:       (row.unit as string | null),
          pantry_ref: (row.pantry_ref as string | null),
        });
      }
      setRecipeIngMap(ingMap);

      // Compute check results with virtual reservations (sequential so reservations accumulate)
      const statuses: Record<string, MealCheckResult> = {};
      const reservations: ReturnType<typeof buildReservations> = [];
      for (const meal of mealRows) {
        const ings = ingMap[meal.recipeId] ?? [];
        if (ings.length === 0) continue;
        const rawRecipe = recipesRes.data?.find((r) => String(r.id) === meal.recipeId);
        const baseServings = (rawRecipe?.servings as number) ?? 1;
        const result = checkMeal(ings, meal.servings, baseServings, stock, reservations, meal.id);
        statuses[meal.id] = result;
        reservations.push(...buildReservations([{ id: meal.id, checkResult: result }]));
      }
      setMealStatuses(statuses);

    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load planner");
    } finally {
      setLoadingMeals(false);
    }
  }, [monday]);

  useEffect(() => { void load(); }, [load]);

  // Month view: fetch a per-day summary (meal count + calories) for the month.
  useEffect(() => {
    if (view !== "month") return;
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !alive) return;
      const first = monthAnchor;
      const last  = new Date(monthAnchor.getFullYear(), monthAnchor.getMonth() + 1, 0);
      const { data } = await supabase.from("planned_meals")
        .select("*")
        .eq("user_id", user.id)
        .gte("meal_date", toISO(first)).lte("meal_date", toISO(last));
      if (!alive) return;
      const kcalById = new Map(recipes.map((r) => [r.id, r.nutrition?.calories ?? 0]));
      const map: Record<string, { count: number; kcal: number }> = {};
      for (const row of data ?? []) {
        const d = row.meal_date as string;
        if (!map[d]) map[d] = { count: 0, kcal: 0 };
        map[d].count++;
        if (row.recipe_id != null) map[d].kcal += (kcalById.get(String(row.recipe_id)) ?? 0) * ((row.servings as number) ?? 1);
        else if (row.food_kcal != null) map[d].kcal += Number(row.food_kcal);
      }
      setMonthData(map);
    })();
    return () => { alive = false; };
  }, [view, monthAnchor, recipes]);

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

  // ── Click-to-plan (alternative to drag) ──────────────────────────────────

  // ── Add a manual (non-recipe) entry ────────────────────────────────────────
  const addManualEntry = useCallback(async () => {
    if (!quickEntry) return;
    setIsAddingManual(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }

      // For leftovers, derive label from the linked source meal when none typed.
      let label = quickLabel.trim();
      let leftoverOf: string | null = null;
      if (quickType === "leftover" && quickLeftoverFrom) {
        leftoverOf = quickLeftoverFrom;
        const src = plannedMeals.find((m) => m.id === quickLeftoverFrom);
        const srcTitle = src ? (getRecipe(src.recipeId)?.title ?? src.label) : undefined;
        if (!label && srcTitle) label = `Leftover: ${srcTitle.split("|")[0].split("–")[0].trim()}`;
      }
      if (!label) label = ENTRY_META[quickType].label;

      // Food entries carry qty/unit/kcal (typed kcal wins over the library estimate).
      const isFood = quickType === "food";
      const foodQty  = isFood ? (parseFloat(quickQty) || null) : null;
      const foodUnit = isFood ? quickUnit : null;
      const foodKcal = isFood ? (quickKcal.trim() ? Math.round(parseFloat(quickKcal)) : autoKcal) : null;

      const { data, error } = await supabase.from("planned_meals").insert({
        user_id: user.id, meal_date: quickEntry.date, meal_slot: quickEntry.slot,
        recipe_id: null, servings: 1, entry_type: quickType, label, leftover_of: leftoverOf,
        // food_kcal only for food entries so other quick-adds work pre-migration
        ...(isFood ? { food_ref: label, food_qty: foodQty, food_unit: foodUnit, food_kcal: foodKcal } : {}),
      }).select().single();

      if (error) {
        if (error.message.includes("entry_type") || error.message.includes("column")) {
          setMigrationNeeded(true);
          toast.error("Run the planner migration first — see the yellow banner.");
        } else throw error;
        return;
      }

      setPlannedMeals((prev) => [...prev, {
        id: data.id as string, date: data.meal_date as string, slot: data.meal_slot as MealSlot,
        recipeId: "", servings: 1, entryType: quickType, label, leftoverOf,
        foodQty, foodUnit, foodKcal,
      }]);
      toast.success(
        `${ENTRY_META[quickType].icon} ${label}${foodKcal ? ` · ~${foodKcal} cal` : ""} → ${quickEntry.slot}`,
        { duration: 2500 },
      );
      setQuickEntry(null);
      setQuickKcal(""); setQuickQty("1"); setQuickUnit("glass");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setIsAddingManual(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickEntry, quickType, quickLabel, quickLeftoverFrom, plannedMeals, quickQty, quickUnit, quickKcal, autoKcal]);

  // Add a saved recipe to the chosen day/slot, else fall through to a manual entry.
  const confirmQuickAdd = useCallback(async () => {
    if (!quickEntry) return;
    if (!quickRecipeId) { await addManualEntry(); return; }
    setIsAddingManual(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data, error } = await supabase.from("planned_meals").insert({
        user_id: user.id, meal_date: quickEntry.date, meal_slot: quickEntry.slot,
        recipe_id: parseInt(quickRecipeId, 10), servings: 1, entry_type: "recipe",
      }).select().single();
      if (error) throw error;
      setPlannedMeals((prev) => [...prev, {
        id: data.id as string, date: data.meal_date as string, slot: data.meal_slot as MealSlot,
        recipeId: String(data.recipe_id), servings: 1, entryType: "recipe",
      }]);
      toast.success("Added to plan");
      setQuickEntry(null); setQuickRecipeId("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add recipe");
    } finally {
      setIsAddingManual(false);
    }
  }, [quickEntry, quickRecipeId, addManualEntry]);

  // ── Templates ──────────────────────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    const { data } = await supabase.from("meal_templates")
      .select("id, name, slots").order("created_at", { ascending: false });
    setTemplates((data ?? []).map((t) => ({ id: t.id as string, name: t.name as string, slots: (t.slots as TemplateSlot[]) ?? [] })));
  }, []);

  const openTemplates = () => { setShowTemplates(true); void fetchTemplates(); };

  const saveTemplate = async () => {
    const name = templateName.trim();
    if (!name) return;
    setTemplateBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const slots: TemplateSlot[] = plannedMeals
        .map((m) => {
          const d = weekDates.findIndex((wd) => toISO(wd) === m.date);
          return d < 0 ? null : {
            d, slot: m.slot,
            recipe_id: m.recipeId ? parseInt(m.recipeId) : null,
            entry_type: (m.entryType ?? "recipe") as MealEntryType,
            label: m.label ?? null,
          };
        })
        .filter((s): s is TemplateSlot => s !== null);
      if (slots.length === 0) { toast.error("Plan some meals first"); return; }
      const { error } = await supabase.from("meal_templates").insert({ user_id: user.id, name, slots });
      if (error) {
        if (error.message.includes("relation") || error.message.includes("does not exist")) {
          toast.error("Run the meal_templates migration first.");
        } else throw error;
        return;
      }
      toast.success(`Saved “${name}” (${slots.length} meals)`);
      setTemplateName("");
      void fetchTemplates();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save template");
    } finally {
      setTemplateBusy(false);
    }
  };

  const applyTemplate = async (tpl: MealTemplate) => {
    setTemplateBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const rows = tpl.slots.map((s) => ({
        user_id: user.id,
        meal_date: toISO(addDays(monday, s.d)),
        meal_slot: s.slot,
        recipe_id: s.recipe_id,
        servings: 1,
        entry_type: s.entry_type ?? "recipe",
        label: s.label,
      }));
      // Skip slots already filled (unique on user_id, meal_date, meal_slot).
      const { error } = await supabase.from("planned_meals")
        .upsert(rows, { onConflict: "user_id,meal_date,meal_slot", ignoreDuplicates: true });
      if (error) throw error;
      toast.success(`Applied “${tpl.name}” to this week`);
      setShowTemplates(false);
      await load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to apply template");
    } finally {
      setTemplateBusy(false);
    }
  };

  const deleteTemplate = async (id: string) => {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
    await supabase.from("meal_templates").delete().eq("id", id);
  };

  // ── Meal history (past planned meals) ──────────────────────────────────────
  const loadHistory = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from("planned_meals")
      .select("meal_date, meal_slot, recipe_id, label")
      .eq("user_id", user.id)
      .lt("meal_date", toISO(new Date()))
      .order("meal_date", { ascending: false })
      .limit(60);
    const titleById = new Map(recipes.map((r) => [r.id, r.title]));
    const planned = (data ?? []).map((r) => ({
      date: r.meal_date as string,
      slot: r.meal_slot as string,
      title: r.recipe_id != null
        ? (titleById.get(String(r.recipe_id)) ?? "Recipe").split("|")[0].trim()
        : (r.label as string | null) ?? "Meal",
    }));

    // Merge in logged snacks / ad-hoc eat events from the consumption log.
    let snacks: { date: string; slot: string; title: string }[] = [];
    try {
      const { data: log } = await supabase.from("consumption_log")
        .select("logged_at, label, items")
        .eq("user_id", user.id)
        .order("logged_at", { ascending: false })
        .limit(60);
      snacks = (log ?? []).map((r) => {
        const items = (r.items as { name?: string }[] | null) ?? [];
        const names = items.map((i) => i.name).filter(Boolean).slice(0, 3).join(", ");
        return {
          date: (r.logged_at as string).slice(0, 10),
          slot: "snack",
          title: (r.label as string | null) || names || "Snack",
        };
      });
    } catch { /* consumption_log may not exist until migration is run */ }

    setHistory([...planned, ...snacks].sort((a, b) => (a.date < b.date ? 1 : -1)));
  }, [recipes]);
  const openHistory = async () => { setShowHistory(true); await loadHistory(); };

  // ── Queue (undated staging) ────────────────────────────────────────────────
  const loadQueue = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("planner_queue")
      .select("id, recipe_id, label")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) return; // table may not exist until migration is run
    setQueueItems((data ?? []).map((r) => ({
      id: r.id as string,
      recipeId: r.recipe_id != null ? String(r.recipe_id) : "",
      label: (r.label as string | null) ?? null,
    })));
  }, []);

  const addRecipeToQueue = useCallback(async () => {
    if (!queueAddRecipe) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error } = await supabase.from("planner_queue")
      .insert({ user_id: user.id, recipe_id: parseInt(queueAddRecipe, 10), entry_type: "recipe" })
      .select().single();
    if (error) { toast.error("Run the planner_queue migration first."); return; }
    setQueueItems((p) => [{ id: data.id as string, recipeId: String(data.recipe_id), label: null }, ...p]);
    setQueueAddRecipe("");
    toast.success("Added to queue");
  }, [queueAddRecipe]);

  const removeFromQueue = useCallback(async (id: string) => {
    setQueueItems((p) => p.filter((q) => q.id !== id));
    await supabase.from("planner_queue").delete().eq("id", id);
  }, []);

  const scheduleFromQueue = useCallback(async () => {
    if (!scheduleItem || !scheduleDate) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { error } = await supabase.from("planned_meals").insert({
      user_id: user.id, meal_date: scheduleDate, meal_slot: scheduleSlot,
      recipe_id: scheduleItem.recipeId ? parseInt(scheduleItem.recipeId, 10) : null,
      servings: 1, entry_type: "recipe",
    });
    if (error) { toast.error(error.message); return; }
    await supabase.from("planner_queue").delete().eq("id", scheduleItem.id);
    setQueueItems((p) => p.filter((q) => q.id !== scheduleItem.id));
    setScheduleItem(null);
    toast.success("Scheduled ✓");
    void load();
  }, [scheduleItem, scheduleDate, scheduleSlot, load]);

  const addQueueItemToList = useCallback(async (recipeId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !recipeId) return;
    const { data: ings } = await supabase.from("recipe_ingredients")
      .select("name").eq("recipe_id", parseInt(recipeId, 10));
    const rows = (ings ?? []).filter((i) => i.name).map((i) => ({
      user_id: user.id, name: i.name as string, list_name: "My List", source: "planner", checked: false,
    }));
    if (rows.length === 0) { toast("No ingredients to add"); return; }
    const { error } = await supabase.from("shopping_list").insert(rows);
    if (error) { toast.error(error.message); return; }
    toast.success(`Added ${rows.length} items to shopping list`);
  }, []);

  // Lazy-load queue / history when their tab opens.
  useEffect(() => {
    if (tab === "queue") void loadQueue();
    if (tab === "previous") void loadHistory();
  }, [tab, loadQueue, loadHistory]);

  // ── Plan a recipe directly into a slot (used by empty-day suggestions) ──────
  // ── Repeat a meal for the next 3 weeks (same weekday + slot) ───────────────
  const repeatMeal = useCallback(async (meal: PlannedMeal) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const base = new Date(meal.date);
      const rows = [1, 2, 3].map((w) => ({
        user_id: user.id,
        meal_date: toISO(addDays(base, 7 * w)),
        meal_slot: meal.slot,
        recipe_id: meal.recipeId ? parseInt(meal.recipeId) : null,
        servings: meal.servings,
        entry_type: meal.entryType ?? "recipe",
        label: meal.label ?? null,
      }));
      const { error } = await supabase.from("planned_meals")
        .upsert(rows, { onConflict: "user_id,meal_date,meal_slot", ignoreDuplicates: true });
      if (error) throw error;
      const name = getRecipe(meal.recipeId)?.title ?? meal.label ?? "Meal";
      toast.success(`Repeated “${name.split("|")[0].trim()}” for the next 3 weeks`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to repeat meal");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  // ── Open Mark as Cooked modal ─────────────────────────────────────────────
  const openCookedModal = useCallback(async (meal: PlannedMeal) => {
    setCookedTarget(meal);
    setCookedMultiplier(1);
    // Fetch ingredients from recipe_ingredients for preview
    try {
      const { data } = await supabase
        .from("recipe_ingredients")
        .select("name, quantity, unit")
        .eq("recipe_id", parseInt(meal.recipeId));

      const recipe = recipes.find((r) => r.id === meal.recipeId);
      const baseServings = recipe ? (recipe as RecipeSummary & { servings?: number }).servings ?? 1 : 1;
      const scale = meal.servings / baseServings;

      setCookedIngredients(
        (data ?? []).map((ing) => {
          const scaledQty = (ing.quantity ?? 1) * scale;
          const { base, baseUnit, tier } = convertToBase(scaledQty, ing.unit ?? "", ing.name);
          return { name: ing.name, qty: scaledQty, unit: ing.unit ?? "", neededBase: base, baseUnit, tier };
        })
      );
    } catch {
      setCookedIngredients([]);
    }
  }, [recipes]);

  // ── Confirm cooked ────────────────────────────────────────────────────────
  const confirmCooked = (skip: boolean) => {
    if (!cookedTarget) return;
    startCookedTransition(async () => {
      try {
        const result = await markMealCooked(cookedTarget.id, cookedMultiplier, skip);
        // Optimistic removal
        setPlannedMeals((prev) => prev.filter((m) => m.id !== cookedTarget.id));
        setCookedTarget(null);
        const pfandMsg = result.pfandCreated.length
          ? ` · ♻️ ${result.pfandCreated.length} Pfand item${result.pfandCreated.length > 1 ? "s" : ""} logged`
          : "";
        toast.success(skip ? "✓ Marked cooked — pantry unchanged" : `✓ Cooked! Pantry updated${pfandMsg}`);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to mark as cooked");
      }
    });
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

  const weekLabel = view === "month"
    ? monthAnchor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : view === "day"
    ? weekDates[dayIndex].toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })
    : `${monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(monday, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  // Per-day calorie totals (per-serving kcal × planned servings), keyed by ISO date.
  const caloriesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const date of weekDates) {
      const iso = toISO(date);
      let kcal = 0;
      for (const meal of plannedMeals) {
        if (meal.date !== iso) continue;
        const r = getRecipe(meal.recipeId);
        if (r?.nutrition?.calories) kcal += r.nutrition.calories * (meal.servings || 1);
        else if (meal.foodKcal) kcal += meal.foodKcal; // ad-hoc food entries
      }
      map[iso] = Math.round(kcal);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, plannedMeals, recipes]);

  return (
    <>
      <Toaster position="top-right" />

      <main className="min-h-screen" style={{ background: "var(--background)" }}>

        <div className="max-w-screen-xl mx-auto px-5 py-6">

          {/* ── Tabs + overflow menu ── */}
          <div className="planner-tabbar">
            <div className="planner-tabs" role="tablist">
              {([["plan", "Plan"], ["queue", "Queue"], ["previous", "Previous"]] as const).map(([k, labelText]) => (
                <button
                  key={k}
                  type="button"
                  role="tab"
                  aria-selected={tab === k}
                  className={tab === k ? "planner-tab active" : "planner-tab"}
                  onClick={() => setTab(k)}
                >
                  {labelText}
                </button>
              ))}
            </div>
            <div className="planner-overflow">
              <button type="button" aria-label="More" className="planner-overflow-btn" onClick={() => setPlanMenuOpen((v) => !v)}>⋯</button>
              {planMenuOpen && (
                <div className="planner-overflow-menu" onMouseLeave={() => setPlanMenuOpen(false)}>
                  <button type="button" className="planner-overflow-item" onClick={() => { setPlanMenuOpen(false); openTemplates(); }}>🗂 Templates</button>
                  <button type="button" className="planner-overflow-item" onClick={() => { setPlanMenuOpen(false); void openHistory(); }}>
                    <History size={14} /> History
                  </button>
                  <button type="button" className="planner-overflow-item" onClick={() => { setPlanMenuOpen(false); void load(); }}>↻ Check pantry</button>
                  {plannedMeals.length > 0 && (
                    <button type="button" className="planner-overflow-item" onClick={() => { setPlanMenuOpen(false); void handleClearWeek(); }}>🗑 Clear week</button>
                  )}
                </div>
              )}
            </div>
          </div>

          {tab === "plan" && (
          <div>
          {/* ── Navigation + view toggle ── */}
          <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={stepBack}
                className="p-1.5 rounded-lg border transition"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}
                aria-label={view === "day" ? "Previous day" : "Previous week"}
              >
                <ChevronLeft size={15} />
              </button>
              <span className="text-sm font-medium tabular-nums" style={{ color: "var(--muted)" }}>{weekLabel}</span>
              <button
                type="button"
                onClick={stepForward}
                className="p-1.5 rounded-lg border transition"
                style={{ borderColor: "var(--border)", background: "var(--surface)", color: "var(--muted)" }}
                aria-label={view === "day" ? "Next day" : "Next week"}
              >
                <ChevronRight size={15} />
              </button>
              {weekOffset !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setWeekOffset(0);
                    const wd = new Date().getDay();
                    setDayIndex(wd === 0 ? 6 : wd - 1);
                  }}
                  className="text-xs font-medium hover:underline"
                  style={{ color: "var(--accent)" }}
                >
                  ← Today
                </button>
              )}
            </div>

          </div>

          {/* ── DnD context ────────────────────────────────────────────────── */}
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={(e) => void handleDragEnd(e)}>
            <div className="flex flex-col gap-5">

              {/* ── Calendar + vertical day list ─────────────────────────────── */}
              <div className="planner-2col">
                {/* Mini month calendar */}
                <aside className="planner-cal">
                  <div className="grid grid-cols-7 gap-1 mb-1">
                    {DAYS.map((d) => (
                      <div key={d} className="text-center text-[10px] font-semibold uppercase" style={{ color: "var(--muted)" }}>{d}</div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthCells.map((date, i) => {
                      if (!date) return <div key={i} />;
                      const iso = toISO(date);
                      const isToday = iso === toISO(new Date());
                      const inWeek = visibleDates.some((w) => toISO(w) === iso);
                      const has = (monthData[iso]?.count ?? 0) > 0;
                      return (
                        <button
                          key={i}
                          type="button"
                          onClick={() => openDayFromMonth(date)}
                          className="planner-cal-day"
                          style={{
                            background: inWeek ? "var(--accent-soft)" : "transparent",
                            color: isToday ? "var(--accent)" : "var(--foreground)",
                            fontWeight: isToday ? 700 : 400,
                          }}
                          title="Jump to this week"
                        >
                          {date.getDate()}
                          {has && <span className="planner-cal-dot" />}
                        </button>
                      );
                    })}
                  </div>
                </aside>

                {/* Vertical list of the current week's days */}
                <div className="planner-daylist">
                  {loadingMeals ? (
                    <div className="animate-pulse space-y-2">
                      {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 rounded-2xl" style={{ background: "var(--surface-strong)" }} />
                      ))}
                    </div>
                  ) : (
                    visibleDates.map((date) => {
                      const iso = toISO(date);
                      const todayIso = toISO(new Date());
                      const isToday = iso === todayIso;
                      const kcal = caloriesByDate[iso] ?? 0;
                      const label = iso === todayIso ? "Today"
                        : iso === toISO(addDays(new Date(), 1)) ? "Tomorrow"
                        : iso === toISO(addDays(new Date(), -1)) ? "Yesterday"
                        : date.toLocaleDateString("en-GB", { weekday: "short", day: "numeric" });
                      const dayMeals = SLOTS.map((slot) => ({ slot, meal: getMeal(date, slot) })).filter((x) => x.meal);
                      const openAdd = (preset: { type?: Exclude<MealEntryType, "recipe">; recipe?: boolean }) => {
                        setDayMenuIso(null);
                        setQuickRecipeId("");
                        setQuickLabel("");
                        setQuickLeftoverFrom("");
                        setQuickType(preset.type ?? "food");
                        setQuickEntry({ date: iso, slot: "dinner" });
                      };
                      return (
                        <div key={iso} className="planner-day">
                          <div className="planner-day-head">
                            <span className="planner-day-name" style={{ color: isToday ? "var(--accent)" : "var(--foreground)" }}>
                              {label} <ChevronRight size={14} style={{ display: "inline", verticalAlign: "-2px", opacity: 0.5 }} />
                              {kcal > 0 && <span className="planner-day-cal" style={{ color: calorieColor(kcal), marginLeft: 8 }}>{kcal} Cal</span>}
                            </span>
                            <div className="planner-day-addwrap">
                              <button type="button" className="planner-day-plus" aria-label="Add to this day"
                                onClick={() => setDayMenuIso((cur) => (cur === iso ? null : iso))}>
                                <Plus size={16} />
                              </button>
                              {dayMenuIso === iso && (
                                <div className="planner-overflow-menu" onMouseLeave={() => setDayMenuIso(null)}>
                                  <button type="button" className="planner-overflow-item" onClick={() => openAdd({ recipe: true })}>🔖 Add saved recipe</button>
                                  <button type="button" className="planner-overflow-item" onClick={() => openAdd({ type: "food" })}>🥕 Add food</button>
                                  <button type="button" className="planner-overflow-item" onClick={() => openAdd({ type: "note" })}>📝 Add note</button>
                                  <button type="button" className="planner-overflow-item" onClick={() => { setDayMenuIso(null); setShowSnack(true); }}>🍽️ Log a snack</button>
                                  <a className="planner-overflow-item" href="/add?source=url" onClick={() => setDayMenuIso(null)}>🔗 Save recipe link</a>
                                  <a className="planner-overflow-item" href="/add" onClick={() => setDayMenuIso(null)}>＋ Create new recipe</a>
                                </div>
                              )}
                            </div>
                          </div>
                          {dayMeals.length > 0 && (
                            <div className="planner-day-meals">
                              {dayMeals.map(({ slot, meal }) => (
                                <SlotCell
                                  key={slot}
                                  date={date}
                                  slot={slot}
                                  meal={meal}
                                  recipe={meal ? getRecipe(meal.recipeId) : undefined}
                                  onRemove={() => meal && setRemoveTarget(meal)}
                                  onServings={(delta) => meal && void handleServings(meal.id, delta)}
                                  onCooked={() => meal && void openCookedModal(meal)}
                                  onRepeat={() => meal && void repeatMeal(meal)}
                                  mealStatus={meal ? mealStatuses[meal.id] : undefined}
                                  expanded={meal ? expandedMealId === meal.id : false}
                                  onExpand={() => meal && setExpandedMealId((prev) => prev === meal.id ? null : meal.id)}
                                  hasSelected={false}
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          </DndContext>

          {/* ── Meal history modal ─────────────────────────────────────────── */}
          {showHistory && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setShowHistory(false)}>
              <div className="rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>Meal history</p>
                  <button type="button" onClick={() => setShowHistory(false)} style={{ color: "var(--muted)" }}><X size={16} /></button>
                </div>
                {history.length === 0 ? (
                  <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>No past meals yet.</p>
                ) : (
                  <div className="space-y-1.5 max-h-80 overflow-y-auto">
                    {history.map((h, i) => (
                      <div key={i} className="flex items-center gap-3 text-sm py-1.5 border-b" style={{ borderColor: "var(--border)" }}>
                        <span className="tabular-nums flex-shrink-0" style={{ color: "var(--muted)", width: 72 }}>
                          {new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                        </span>
                        <span className="capitalize flex-shrink-0" style={{ color: "var(--muted)", width: 64, fontSize: "0.75rem" }}>{h.slot}</span>
                        <span className="flex-1 truncate" style={{ color: "var(--foreground)" }}>{h.title}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Templates modal ────────────────────────────────────────────── */}
          {showTemplates && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setShowTemplates(false)}>
              <div className="rounded-2xl p-6 w-full max-w-md shadow-xl space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center justify-between">
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>Meal templates</p>
                  <button type="button" onClick={() => setShowTemplates(false)} style={{ color: "var(--muted)" }}><X size={16} /></button>
                </div>

                {/* Save current week */}
                <div className="flex gap-2">
                  <input type="text" value={templateName} onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="Save this week as… (e.g. Gym Week)" maxLength={50}
                    onKeyDown={(e) => { if (e.key === "Enter") void saveTemplate(); }}
                    className="flex-1 rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                  <button type="button" onClick={() => void saveTemplate()} disabled={templateBusy || !templateName.trim()}
                    className="px-3 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
                    Save
                  </button>
                </div>

                {/* Existing templates */}
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {templates.length === 0 ? (
                    <p className="text-sm text-center py-4" style={{ color: "var(--muted)" }}>No templates yet.</p>
                  ) : (
                    templates.map((t) => (
                      <div key={t.id} className="flex items-center gap-2 rounded-xl px-3 py-2"
                        style={{ border: "1px solid var(--border)" }}>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: "var(--foreground)" }}>{t.name}</p>
                          <p className="text-xs" style={{ color: "var(--muted)" }}>{t.slots.length} meal{t.slots.length === 1 ? "" : "s"}</p>
                        </div>
                        <button type="button" onClick={() => void applyTemplate(t)} disabled={templateBusy}
                          className="text-xs px-3 py-1.5 rounded-lg font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
                          Apply
                        </button>
                        <button type="button" onClick={() => void deleteTemplate(t.id)} aria-label="Delete template"
                          style={{ color: "var(--muted)" }}><X size={14} /></button>
                      </div>
                    ))
                  )}
                </div>
                <p className="text-[11px]" style={{ color: "var(--muted)" }}>
                  Applying adds the template&apos;s meals to the week you&apos;re viewing (filled slots are kept).
                </p>
              </div>
            </div>
          )}

          {/* ── Quick (manual / non-recipe) entry modal ────────────────────── */}
          {quickEntry && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setQuickEntry(null)}>
              <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onClick={(e) => e.stopPropagation()}>
                <div>
                  <p className="font-semibold" style={{ color: "var(--foreground)" }}>Add a meal</p>
                  <p className="text-sm mt-0.5" style={{ color: "var(--muted)" }}>
                    {new Date(quickEntry.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
                  </p>
                </div>

                {/* Slot selector */}
                <div className="flex gap-1.5">
                  {SLOTS.map((s) => {
                    const active = quickEntry.slot === s;
                    return (
                      <button key={s} type="button" onClick={() => setQuickEntry((q) => (q ? { ...q, slot: s } : q))}
                        className="flex-1 py-1.5 rounded-lg text-xs font-medium capitalize"
                        style={{
                          border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                          background: active ? "var(--accent)" : "var(--surface)",
                          color: active ? "#fff" : "var(--foreground)",
                        }}>
                        {SLOT_ICONS[s]} {s}
                      </button>
                    );
                  })}
                </div>

                {/* Add a saved recipe */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Add a saved recipe</label>
                  <select value={quickRecipeId} onChange={(e) => setQuickRecipeId(e.target.value)}
                    className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}>
                    <option value="">— pick a recipe —</option>
                    {recipes.map((r) => (
                      <option key={r.id} value={r.id}>{r.title.split("|")[0].trim()}</option>
                    ))}
                  </select>
                </div>

                {/* Type chips (manual entries) */}
                <p className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)", opacity: quickRecipeId ? 0.4 : 1 }}>Or add manually</p>
                <div className="flex flex-wrap gap-1.5" style={{ opacity: quickRecipeId ? 0.4 : 1, pointerEvents: quickRecipeId ? "none" : "auto" }}>
                  {MANUAL_TYPES.map((t) => {
                    const active = quickType === t;
                    return (
                      <button key={t} type="button" onClick={() => setQuickType(t)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition"
                        style={{
                          border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
                          background: active ? "var(--accent)" : "var(--surface)",
                          color: active ? "#fff" : "var(--foreground)",
                        }}>
                        <span>{ENTRY_META[t].icon}</span>{ENTRY_META[t].label}
                      </button>
                    );
                  })}
                </div>

                {/* Leftover source picker */}
                {quickType === "leftover" && (
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                      Leftover from (optional)
                    </label>
                    <select value={quickLeftoverFrom} onChange={(e) => setQuickLeftoverFrom(e.target.value)}
                      className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                      style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}>
                      <option value="">— none —</option>
                      {plannedMeals.filter((m) => m.recipeId).map((m) => (
                        <option key={m.id} value={m.id}>
                          {(getRecipe(m.recipeId)?.title ?? "Recipe").split("|")[0].slice(0, 30)} · {m.date.slice(5)} {m.slot}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Label */}
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>
                    {quickType === "food" ? "Food" : "Label (optional)"}
                  </label>
                  <input type="text" value={quickLabel} onChange={(e) => setQuickLabel(e.target.value)}
                    placeholder={quickType === "food" ? "e.g. Milk with Ovomaltine" : ENTRY_META[quickType].label}
                    maxLength={60}
                    onKeyDown={(e) => { if (e.key === "Enter") void addManualEntry(); }}
                    className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>

                {/* Food: quantity, unit, calories */}
                {quickType === "food" && (
                  <div className="flex gap-2">
                    <div className="flex flex-col gap-1" style={{ width: 70 }}>
                      <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Qty</label>
                      <input type="number" min={0} step="0.5" value={quickQty} onChange={(e) => setQuickQty(e.target.value)}
                        className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                    </div>
                    <div className="flex flex-col gap-1 flex-1">
                      <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Unit</label>
                      <select value={quickUnit} onChange={(e) => setQuickUnit(e.target.value)}
                        className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }}>
                        {["glass", "mug", "cup", "whole", "portion", "slice", "piece", "g", "ml", "tbsp", "tsp"].map((u) => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1" style={{ width: 110 }}>
                      <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Calories</label>
                      <input type="number" min={0} value={quickKcal} onChange={(e) => setQuickKcal(e.target.value)}
                        placeholder={autoKcal != null ? `~${autoKcal}` : "kcal"}
                        className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                        style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setQuickEntry(null); setQuickRecipeId(""); }}
                    className="px-4 py-2 rounded-xl text-sm" style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                    Cancel
                  </button>
                  <button type="button" onClick={() => void confirmQuickAdd()} disabled={isAddingManual}
                    className="px-4 py-2 rounded-xl text-sm font-semibold" style={{ background: "var(--accent)", color: "#fff" }}>
                    {isAddingManual ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>
            </div>
          )}

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
                Drag a recipe from the right panel onto a slot, or click a recipe chip then click a slot.
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
          )}{/* end Plan tab */}

          {/* ── Queue tab ── */}
          {tab === "queue" && (
            <div>
              <p className="text-sm mb-4" style={{ color: "var(--muted)" }}>
                This is where your unscheduled meals go. Stage recipes here, then schedule them onto a day.
              </p>
              <div className="flex flex-wrap gap-2 mb-5">
                <select
                  value={queueAddRecipe}
                  onChange={(e) => setQueueAddRecipe(e.target.value)}
                  className="rounded-xl px-3 py-2 text-sm"
                  style={{ border: "1px solid var(--border)", background: "var(--surface)", color: "var(--foreground)", minWidth: 220 }}
                >
                  <option value="">Add a recipe to the queue…</option>
                  {recipes.map((r) => (
                    <option key={r.id} value={r.id}>{r.title.split("|")[0].trim()}</option>
                  ))}
                </select>
                <button type="button" onClick={() => void addRecipeToQueue()} disabled={!queueAddRecipe}
                  className="px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                  style={{ background: "var(--accent)", color: "#fff" }}>
                  + Add to queue
                </button>
              </div>
              {queueItems.length === 0 ? (
                <div className="text-center py-10 rounded-2xl" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
                  <p className="text-3xl mb-2">🗂</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>Your queue is empty.</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {queueItems.map((q) => {
                    const r = getRecipe(q.recipeId);
                    return (
                      <div key={q.id} className="flex items-center gap-3 p-3 rounded-2xl"
                        style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                        <span className="text-xl">{getCuisineTheme(r?.cuisine ?? "").emoji}</span>
                        <span className="flex-1 font-medium text-sm" style={{ color: "var(--foreground)" }}>
                          {r ? r.title.split("|")[0].trim() : (q.label ?? "Meal")}
                        </span>
                        <button type="button" title="Schedule"
                          onClick={() => { setScheduleItem(q); setScheduleDate(toISO(weekDates[0])); setScheduleSlot("dinner"); }}
                          className="p-2 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--accent)" }}>
                          <Calendar size={15} />
                        </button>
                        <button type="button" title="Add to shopping list"
                          onClick={() => void addQueueItemToList(q.recipeId)}
                          className="p-2 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                          <ShoppingCart size={15} />
                        </button>
                        <button type="button" title="Remove from queue"
                          onClick={() => void removeFromQueue(q.id)}
                          className="p-2 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                          <X size={15} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── Previous tab ── */}
          {tab === "previous" && (
            <div>
              <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
                <p className="text-sm" style={{ color: "var(--muted)", margin: 0 }}>
                  Meals you&apos;ve planned and snacks you&apos;ve logged.
                </p>
                <button type="button" className="planner-tab" onClick={() => setShowSnack(true)}>🍽️ Log a snack</button>
              </div>
              {history.length === 0 ? (
                <div className="text-center py-10 rounded-2xl" style={{ background: "var(--surface)", border: "1px dashed var(--border)" }}>
                  <p className="text-3xl mb-2">🕓</p>
                  <p className="text-sm" style={{ color: "var(--muted)" }}>No past meals yet.</p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {history.map((h, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm p-3 rounded-2xl"
                      style={{ background: "var(--surface)", border: "1px solid var(--border)" }}>
                      <span className="tabular-nums flex-shrink-0" style={{ color: "var(--muted)", width: 84 }}>
                        {new Date(h.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                      </span>
                      <span className="capitalize flex-shrink-0" style={{ color: "var(--muted)", width: 70 }}>{h.slot}</span>
                      <span className="font-medium" style={{ color: "var(--foreground)" }}>{h.title}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Log-a-snack modal ── */}
          {showSnack && (
            <LogSnackModal
              onClose={() => setShowSnack(false)}
              onLogged={() => { if (tab === "previous") void loadHistory(); }}
            />
          )}

          {/* ── Schedule-from-queue modal ── */}
          {scheduleItem && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4"
              style={{ background: "rgba(0,0,0,0.5)" }} onClick={() => setScheduleItem(null)}>
              <div className="rounded-2xl p-6 w-full max-w-sm shadow-xl space-y-4"
                style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
                onClick={(e) => e.stopPropagation()}>
                <p className="font-semibold" style={{ color: "var(--foreground)" }}>Schedule meal</p>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Date</label>
                  <input type="date" value={scheduleDate} onChange={(e) => setScheduleDate(e.target.value)}
                    className="rounded-xl px-3 py-2 text-sm"
                    style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>Slot</label>
                  <div className="flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                    {SLOTS.map((s, i) => (
                      <button key={s} type="button" onClick={() => setScheduleSlot(s)}
                        className="flex-1 py-2 text-xs font-medium transition capitalize"
                        style={{
                          background: scheduleSlot === s ? "var(--accent)" : "var(--surface)",
                          color: scheduleSlot === s ? "#fff" : "var(--foreground)",
                          borderRight: i < SLOTS.length - 1 ? "1px solid var(--border)" : undefined,
                        }}>
                        {SLOT_ICONS[s]} {s}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setScheduleItem(null)}
                    className="px-4 py-2 rounded-xl text-sm" style={{ color: "var(--muted)" }}>Cancel</button>
                  <button type="button" onClick={() => void scheduleFromQueue()}
                    className="px-4 py-2 rounded-xl text-sm font-medium"
                    style={{ background: "var(--accent)", color: "#fff" }}>✓ Schedule</button>
                </div>
              </div>
            </div>
          )}
        </div>{/* end page content */}
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

      {/* ── Mark as Cooked modal ──────────────────────────────────────────── */}
      <AnimatePresence>
        {cookedTarget && (
          <>
            {/* Backdrop */}
            <motion.div
              key="cooked-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => !isPendingCooked && setCookedTarget(null)}
            />
            {/* Modal */}
            <motion.div
              key="cooked-modal"
              initial={{ opacity: 0, scale: 0.92, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 24 }}
              transition={{ type: "spring", stiffness: 380, damping: 30 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl"
              style={{ background: "var(--surface)", border: "1px solid var(--border)" }}
              role="dialog"
              aria-modal
              onKeyDown={(e) => e.key === "Escape" && !isPendingCooked && setCookedTarget(null)}
            >
              <div className="px-5 pt-5 pb-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-base font-bold" style={{ color: "var(--foreground)" }}>
                    🍳 Mark as Cooked
                  </h2>
                  <button
                    type="button"
                    onClick={() => !isPendingCooked && setCookedTarget(null)}
                    className="p-1 rounded-full transition hover:bg-black/10"
                    style={{ color: "var(--muted)" }}
                  >
                    <X size={16} />
                  </button>
                </div>
                <p className="text-xs mb-4" style={{ color: "var(--muted)" }}>
                  {recipes.find((r) => r.id === cookedTarget.recipeId)?.title ?? "Recipe"} · {cookedTarget.slot}
                </p>

                {/* Servings multiplier */}
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
                  Servings multiplier
                </p>
                <div className="flex gap-2 mb-4">
                  {[0.5, 1, 1.5, 2, 3].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCookedMultiplier(m)}
                      className="flex-1 py-1.5 rounded-lg text-xs font-semibold transition"
                      style={{
                        background: cookedMultiplier === m ? "var(--accent)" : "var(--surface-strong)",
                        color: cookedMultiplier === m ? "#fff" : "var(--foreground)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      {m}×
                    </button>
                  ))}
                </div>

                {/* Ingredient preview */}
                {cookedIngredients.length > 0 && (
                  <>
                    <p className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--muted)" }}>
                      Pantry deduction preview
                    </p>
                    <ul className="space-y-1 max-h-48 overflow-y-auto mb-4">
                      {cookedIngredients.map((ing, i) => {
                        const scaled = ing.neededBase * cookedMultiplier;
                        return (
                          <li key={i} className="flex items-center gap-2 text-xs py-1 border-b last:border-b-0" style={{ borderColor: "var(--border)", color: "var(--foreground)" }}>
                            <span className="flex-1 truncate">{ing.name}</span>
                            <span className="tabular-nums text-[10px]" style={{ color: "var(--muted)" }}>
                              {ing.tier === 3
                                ? "—"
                                : scaled >= 1000
                                ? `${(scaled / 1000).toFixed(1)}${ing.baseUnit === "g" ? "kg" : "L"}`
                                : `${Math.round(scaled)}${ing.baseUnit}`}
                            </span>
                            {ing.tier === 3
                              ? <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "var(--surface-strong)", color: "var(--muted)" }}>skip</span>
                              : <span className="text-[9px] px-1.5 py-0.5 rounded" style={{ background: "rgba(34,197,94,0.1)", color: "#16a34a" }}>deduct</span>
                            }
                          </li>
                        );
                      })}
                    </ul>
                  </>
                )}

                {/* Footer buttons */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={isPendingCooked}
                    onClick={() => confirmCooked(true)}
                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition disabled:opacity-50"
                    style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface-strong)" }}
                  >
                    Skip deduction
                  </button>
                  <button
                    type="button"
                    disabled={isPendingCooked}
                    onClick={() => confirmCooked(false)}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition disabled:opacity-50"
                    style={{ background: "var(--accent)", color: "#fff" }}
                  >
                    {isPendingCooked
                      ? <Loader2 size={14} className="animate-spin" />
                      : <UtensilsCrossed size={14} />}
                    Confirm &amp; deduct
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
