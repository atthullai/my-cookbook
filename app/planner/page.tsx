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
  DndContext, DragEndEvent, DragOverlay, DragStartEvent,
  PointerSensor, useSensor, useSensors, useDroppable, useDraggable,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, ShoppingCart, X, Search, Minus, Plus, Calendar, UtensilsCrossed, Loader2 } from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import { getCuisineTheme } from "@/lib/cuisine-themes";
import ConfirmDialog from "@/components/ConfirmDialog";
import type { RecipeSummary, PlannedMeal, MealSlot, MealEntryType } from "@/types";
import { CATEGORY_MAP } from "@/lib/pantry-items";
import { convertToBase } from "@/lib/conversion";
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
  restaurant: { icon: "🍽", label: "Restaurant" },
  delivery:   { icon: "🛵", label: "Delivery" },
  leftover:   { icon: "♻️", label: "Leftover" },
  frozen:     { icon: "🧊", label: "Frozen / ready meal" },
  other:      { icon: "🍴", label: "Other" },
};
const MANUAL_TYPES = Object.keys(ENTRY_META) as Exclude<MealEntryType, "recipe">[];

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
function DraggableRecipeChip({
  recipe, isSelected, onSelect,
}: {
  recipe: RecipeSummary;
  isSelected?: boolean;
  onSelect?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `recipe-${recipe.id}`,
    data: { recipeId: recipe.id, title: recipe.title, cuisine: recipe.cuisine },
  });
  const theme = getCuisineTheme(recipe.cuisine);

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        ...(isSelected
          ? { background: "var(--accent)", borderColor: "var(--accent-strong)", color: "#fff" }
          : {}),
      }}
      {...listeners}
      {...attributes}
      onClick={onSelect}
      className={[
        "flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium cursor-grab active:cursor-grabbing",
        "transition-all duration-150 select-none border",
        isSelected ? "" : [theme.cardGradient, theme.textColor].join(" "),
        isDragging ? "opacity-50 shadow-2xl scale-95 rotate-1" : "shadow-sm hover:shadow-md hover:scale-[1.02]",
      ].join(" ")}
    >
      {recipe.imageUrl ? (
        <Image
          src={recipe.imageUrl}
          alt=""
          width={24}
          height={24}
          className="rounded-md object-cover flex-shrink-0"
        />
      ) : (
        <span className="text-sm flex-shrink-0">{theme.emoji}</span>
      )}
      <span className="truncate flex-1 leading-tight text-xs">{recipe.title}</span>
    </div>
  );
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
  mealStatus?:  MealCheckResult;
  expanded?:    boolean;
  onExpand?:    () => void;
  onClickPlan?: () => void;
  hasSelected?: boolean;
}

function SlotCell({ date, slot, meal, recipe, onRemove, onServings, onCooked, mealStatus, expanded, onExpand, onClickPlan, hasSelected }: SlotCellProps) {
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
            {/* Mark as cooked */}
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onCooked(); }}
              className="ml-auto p-0.5 rounded-full bg-black/15 hover:bg-green-500/80 transition text-white flex-shrink-0"
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
                      🛒 Add missing to shopping list
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
            <span className="text-[11px] font-semibold leading-tight line-clamp-2 flex-1" style={{ color: "var(--foreground)" }}>
              <span className="mr-1">{ENTRY_META[(meal.entryType ?? "other") as Exclude<MealEntryType, "recipe">]?.icon ?? "🍴"}</span>
              {meal.label || ENTRY_META[(meal.entryType ?? "other") as Exclude<MealEntryType, "recipe">]?.label || "Meal"}
            </span>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onRemove(); }}
              className="p-0.5 rounded-full transition flex-shrink-0"
              style={{ background: "rgba(0,0,0,0.08)", color: "var(--muted)" }}
              aria-label="Remove"
            >
              <X size={8} />
            </button>
          </div>
          <span className="text-[9px] uppercase tracking-wide font-semibold mt-1" style={{ color: "var(--muted)", opacity: 0.7 }}>
            {ENTRY_META[(meal.entryType ?? "other") as Exclude<MealEntryType, "recipe">]?.label ?? "Meal"}
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
  const gridCols = `60px repeat(${visibleDates.length}, 1fr)`;

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
    setView("day");
  };

  const [plannedMeals,  setPlannedMeals]  = useState<PlannedMeal[]>([]);
  const [recipes,       setRecipes]       = useState<RecipeSummary[]>([]);
  const [loadingMeals,  setLoadingMeals]  = useState(true);
  const [activeId,      setActiveId]      = useState<string | null>(null);
  const [removeTarget,  setRemoveTarget]  = useState<PlannedMeal | null>(null);
  const [isRemoving,    setIsRemoving]    = useState(false);
  const [sidebarSearch, setSidebarSearch] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState<string | null>(null);

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

  // ── Expiry suggestions banner ──────────────────────────────────────────────
  interface ExpirySuggestion {
    items: { name: string; daysLeft: number }[];
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

  // ── Quick (manual / non-recipe) entry modal ───────────────────────────────
  const [quickEntry, setQuickEntry] = useState<{ date: string; slot: MealSlot } | null>(null);
  const [quickType, setQuickType]   = useState<Exclude<MealEntryType, "recipe">>("restaurant");
  const [quickLabel, setQuickLabel] = useState("");
  const [quickLeftoverFrom, setQuickLeftoverFrom] = useState<string>(""); // source planned_meal id
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
      // Score each recipe by how many expiring items it uses
      type ScoredSuggestion = { items: { name: string; daysLeft: number }[]; recipe: RecipeSummary };
      const scored: ScoredSuggestion[] = [];
      for (const raw of rawForSuggestions) {
        const recipe = allRecipesForSuggestions.find((r) => r.id === String(raw.id));
        if (!recipe) continue;
        const matchedItems: { name: string; daysLeft: number }[] = [];
        for (const pantryItem of expiringPantry) {
          const nameL = (pantryItem.name as string).toLowerCase();
          const daysLeft = Math.ceil((new Date(pantryItem.expiry_date as string).getTime() - now) / 86_400_000);
          const matches = raw.ingredients.some((g) =>
            g.items.some((i) => i.name_en.toLowerCase().includes(nameL) || nameL.includes(i.name_en.toLowerCase()))
          );
          if (matches) matchedItems.push({ name: pantryItem.name as string, daysLeft });
        }
        if (matchedItems.length > 0) {
          matchedItems.sort((a, b) => a.daysLeft - b.daysLeft);
          scored.push({ items: matchedItems, recipe });
        }
      }
      scored.sort((a, b) => b.items.length - a.items.length);
      setExpirySuggestions(scored.slice(0, 3));

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
        .select("meal_date, recipe_id, servings")
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
  const handleClickPlan = useCallback(async (date: string, slot: MealSlot) => {
    if (!selectedRecipeId) return;
    if (plannedMeals.find((m) => m.date === date && m.slot === slot)) {
      toast.error("Slot already filled — remove the current meal first");
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { data, error } = await supabase.from("planned_meals").insert({
        user_id: user.id, meal_date: date, meal_slot: slot,
        recipe_id: parseInt(selectedRecipeId), servings: 1,
      }).select().single();
      if (error) {
        if (error.message.includes("relation") || error.message.includes("does not exist")) {
          setMigrationNeeded(true);
        } else throw error;
        return;
      }
      setPlannedMeals((prev) => [...prev, {
        id: data.id as string, date: data.meal_date as string,
        slot: data.meal_slot as MealSlot, recipeId: String(data.recipe_id), servings: 1,
      }]);
      const recipe = recipes.find((r) => r.id === selectedRecipeId);
      toast.success(`${recipe?.title ?? "Recipe"} → ${slot}`, { duration: 2500 });
      setSelectedRecipeId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add meal");
    }
  }, [selectedRecipeId, plannedMeals, recipes]);

  // ── Empty-slot click: plan selected recipe, else open quick-entry modal ────
  const handleEmptySlotClick = useCallback((date: string, slot: MealSlot) => {
    if (selectedRecipeId) { void handleClickPlan(date, slot); return; }
    setQuickType("restaurant");
    setQuickLabel("");
    setQuickLeftoverFrom("");
    setQuickEntry({ date, slot });
  }, [selectedRecipeId, handleClickPlan]);

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

      const { data, error } = await supabase.from("planned_meals").insert({
        user_id: user.id, meal_date: quickEntry.date, meal_slot: quickEntry.slot,
        recipe_id: null, servings: 1, entry_type: quickType, label, leftover_of: leftoverOf,
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
      }]);
      toast.success(`${ENTRY_META[quickType].icon} ${label} → ${quickEntry.slot}`, { duration: 2500 });
      setQuickEntry(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add entry");
    } finally {
      setIsAddingManual(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quickEntry, quickType, quickLabel, quickLeftoverFrom, plannedMeals]);

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

  const filteredRecipes = sidebarSearch.trim()
    ? recipes.filter((r) => r.title.toLowerCase().includes(sidebarSearch.toLowerCase()))
    : recipes;

  const activeRecipe = activeId ? recipes.find((r) => `recipe-${r.id}` === activeId) : null;

  const weekLabel = view === "month"
    ? monthAnchor.toLocaleDateString("en-GB", { month: "long", year: "numeric" })
    : view === "day"
    ? weekDates[dayIndex].toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })
    : `${monday.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${addDays(monday, 6).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;

  // ── Week stats ─────────────────────────────────────────────────────────────
  const weekStats = useMemo(() => {
    const totalMeals = plannedMeals.length;
    const uniqueCuisines = new Set(
      plannedMeals.map((m) => getRecipe(m.recipeId)?.cuisine).filter(Boolean)
    ).size;
    return { totalMeals, uniqueCuisines };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plannedMeals, recipes]);

  const mealCountForDate = (date: Date) => SLOTS.filter((slot) => getMeal(date, slot)).length;

  // Per-day calorie totals (per-serving kcal × planned servings), keyed by ISO date.
  const caloriesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const date of weekDates) {
      let kcal = 0;
      for (const slot of SLOTS) {
        const meal = getMeal(date, slot);
        if (!meal) continue;
        const r = getRecipe(meal.recipeId);
        if (r?.nutrition?.calories) kcal += r.nutrition.calories * (meal.servings || 1);
      }
      map[toISO(date)] = Math.round(kcal);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekDates, plannedMeals, recipes]);

  return (
    <>
      <Toaster position="top-right" />

      <main className="min-h-screen" style={{ background: "var(--background)" }}>

        {/* ── Page hero ── */}
        <section
          className="relative overflow-hidden px-5 pt-10 pb-8 border-b"
          style={{
            background: "radial-gradient(ellipse 70% 60% at 80% 0%, rgba(212,168,83,.07) 0%, transparent 60%), radial-gradient(ellipse 50% 80% at 5% 100%, rgba(232,132,74,.05) 0%, transparent 60%), var(--linen)",
            borderColor: "var(--border)",
          }}
        >
          <div className="max-w-screen-xl mx-auto">

            {/* ── Migration banner ── */}
            <AnimatePresence>
              {migrationNeeded && (
                <motion.div
                  initial={{ opacity: 0, y: -16 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -16 }}
                  className="mb-5 rounded-2xl p-4 flex gap-3 items-start"
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

            <div className="flex items-end justify-between gap-5 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px w-5" style={{ background: "var(--saffron)" }} />
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: "var(--saffron)" }}>
                    Weekly menu
                  </span>
                </div>
                <h1 className="font-bold leading-tight mb-1" style={{ fontSize: "clamp(2rem, 4vw, 2.75rem)", color: "var(--foreground)" }}>
                  This Week&apos;s <em style={{ color: "var(--accent)", fontStyle: "italic" }}>Plan</em>
                </h1>
                <p className="text-sm italic" style={{ color: "var(--muted)" }}>
                  {loadingMeals ? "Loading…" : `${weekStats.totalMeals} meal${weekStats.totalMeals !== 1 ? "s" : ""} planned`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {plannedMeals.length > 0 && (
                  <button
                    type="button"
                    onClick={() => void handleClearWeek()}
                    className="px-3 py-2 rounded-xl text-sm transition"
                    style={{ color: "var(--muted)", border: "1px solid var(--border)", background: "var(--surface)" }}
                  >
                    Clear week
                  </button>
                )}
                <Link
                  href="/planner/shopping"
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition"
                  style={{ border: "1px solid var(--border)", color: "var(--foreground)", background: "var(--surface)" }}
                >
                  <ShoppingCart size={15} /> Shopping list
                </Link>
                <button
                  type="button"
                  onClick={() => void load()}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition"
                  style={{ background: "var(--accent)", color: "#fff" }}
                  title="Re-check pantry sufficiency"
                >
                  ↻ Check pantry
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-screen-xl mx-auto px-5 py-5">

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

            {/* Week / Day / Month toggle */}
            <div className="inline-flex rounded-xl overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              {(["week", "day", "month"] as const).map((v) => (
                <button key={v} type="button" onClick={() => setView(v)}
                  className="px-3 py-1.5 text-xs font-semibold capitalize transition"
                  style={{
                    background: view === v ? "var(--accent)" : "var(--surface)",
                    color: view === v ? "#fff" : "var(--muted)",
                  }}>
                  {v}
                </button>
              ))}
            </div>
            {!loadingMeals && weekStats.uniqueCuisines > 0 && (
              <p className="text-sm" style={{ color: "var(--muted)" }}>
                <span className="font-semibold" style={{ color: "var(--foreground)" }}>{weekStats.uniqueCuisines}</span>
                {" "}cuisine{weekStats.uniqueCuisines !== 1 ? "s" : ""} this week
              </p>
            )}
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
            <div className="rounded-2xl mb-5 overflow-hidden"
              style={{ border: "1px solid rgba(245,158,11,0.28)" }}>
              <div className="flex items-center justify-between px-4 py-2.5"
                style={{ background: "rgba(245,158,11,0.10)" }}>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "#b45309" }}>
                  ⏰ Use soon
                </span>
                <button type="button"
                  onClick={() => {
                    setExpiryBannerDismissed(true);
                    if (typeof window !== "undefined") localStorage.setItem("planner-expiry-banner-dismissed", String(Date.now()));
                  }}
                  className="text-xs opacity-50 hover:opacity-100 transition"
                  style={{ color: "var(--muted)" }}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="divide-y" style={{ borderColor: "rgba(245,158,11,0.12)" }}>
                {expirySuggestions.map((s, i) => (
                  <div key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium mb-0.5" style={{ color: "var(--foreground)" }}>
                        {s.items.map((item, idx) => (
                          <span key={idx}>
                            {idx > 0 && <span style={{ color: "var(--muted)" }}>, </span>}
                            <strong>{item.name}</strong>
                            <span className="ml-1 font-normal" style={{ color: "#b45309" }}>
                              ({item.daysLeft === 0 ? "today!" : item.daysLeft === 1 ? "exp tomorrow" : `exp in ${item.daysLeft}d`})
                            </span>
                          </span>
                        ))}
                      </p>
                      <p className="text-xs" style={{ color: "var(--muted)" }}>
                        Suggested: <span className="font-semibold" style={{ color: "var(--foreground)" }}>{s.recipe.title}</span>
                        {s.items.length > 1 && <span> uses {s.items.length === 2 ? "both" : `all ${s.items.length}`} →</span>}
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => {
                        setAddToPlanSuggestion(s);
                        setAddToPlanDay(toISO(monday));
                        setAddToPlanSlot("dinner");
                      }}
                      className="flex-shrink-0 text-xs px-3 py-1.5 rounded-lg font-medium transition whitespace-nowrap"
                      style={{ background: "var(--accent)", color: "#fff" }}
                    >
                      Add to plan ↗
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── DnD context ────────────────────────────────────────────────── */}
          <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={(e) => void handleDragEnd(e)}>
            <div className="flex flex-col gap-5">

              {/* ── Weekly grid ────────────────────────────────────────────── */}
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
                ) : view === "month" ? (
                  <div style={{ minWidth: 320 }}>
                    {/* Weekday header */}
                    <div className="grid grid-cols-7 gap-1.5 mb-1">
                      {DAYS.map((d) => (
                        <div key={d} className="text-center text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--muted)" }}>{d}</div>
                      ))}
                    </div>
                    {/* Day cells */}
                    <div className="grid grid-cols-7 gap-1.5">
                      {monthCells.map((date, i) => {
                        if (!date) return <div key={i} />;
                        const iso = toISO(date);
                        const info = monthData[iso];
                        const isToday = iso === toISO(new Date());
                        const dotColor = calorieColor(info?.kcal ?? 0);
                        return (
                          <button key={i} type="button" onClick={() => openDayFromMonth(date)}
                            className="rounded-xl p-1.5 text-left transition min-h-[62px] flex flex-col hover:shadow-sm"
                            style={{ border: `1px solid ${isToday ? "var(--accent)" : "var(--border)"}`, background: "var(--surface)" }}
                            title="Open day">
                            <span className="text-xs font-bold" style={{ color: isToday ? "var(--accent)" : "var(--foreground)" }}>
                              {date.getDate()}
                            </span>
                            {info && info.count > 0 && (
                              <>
                                <div className="flex gap-0.5 mt-1 flex-wrap">
                                  {[...Array(Math.min(info.count, 4))].map((_, d) => (
                                    <span key={d} className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                                  ))}
                                </div>
                                {info.kcal > 0 && (
                                  <span className="text-[9px] mt-auto font-semibold tabular-nums" style={{ color: dotColor }}>
                                    {info.kcal} kcal
                                  </span>
                                )}
                              </>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div style={{ minWidth: 560 }}>
                    {/* Day headers */}
                    <div className="grid gap-1.5 mb-2" style={{ gridTemplateColumns: gridCols }}>
                      <div />
                      {visibleDates.map((date, i) => {
                        const isToday = toISO(date) === toISO(new Date());
                        const mealCount = mealCountForDate(date);
                        const kcal = caloriesByDate[toISO(date)] ?? 0;
                        const dotColor = calorieColor(kcal);
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
                                  <div key={d} className="w-1 h-1 rounded-full" style={{ background: dotColor }} />
                                ))}
                              </div>
                            )}
                            {kcal > 0 && (
                              <div className="text-[9px] font-semibold mt-0.5 tabular-nums" style={{ color: dotColor }}>
                                {kcal} kcal
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
                        style={{ gridTemplateColumns: gridCols }}
                      >
                        {/* Slot label — sticky so it remains visible when grid scrolls horizontally */}
                        <div
                          className="flex flex-col items-center justify-center rounded-xl px-1 py-2"
                          style={{ ...SLOT_STYLES[slot], position: "sticky", left: 0, zIndex: 2 }}
                        >
                          <span className="text-lg leading-none">{SLOT_ICONS[slot]}</span>
                          <span className="text-[8px] font-semibold capitalize mt-0.5 opacity-70">{slot}</span>
                        </div>

                        {/* Day cells */}
                        {visibleDates.map((date, i) => {
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
                              onCooked={() => meal && void openCookedModal(meal)}
                              mealStatus={meal ? mealStatuses[meal.id] : undefined}
                              expanded={meal ? expandedMealId === meal.id : false}
                              onExpand={() => meal && setExpandedMealId((prev) => prev === meal.id ? null : meal.id)}
                              onClickPlan={!meal ? () => handleEmptySlotClick(toISO(date), slot) : undefined}
                              hasSelected={!!selectedRecipeId}
                            />
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Recipe panel (BELOW) ───────────────────────────────────── */}
              <div>
                <div className="rounded-2xl p-4 shadow-sm"
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

                  <p
                    className="text-[10px] mb-2 leading-snug transition-colors"
                    style={{ color: selectedRecipeId ? "var(--accent)" : "var(--muted)", opacity: selectedRecipeId ? 1 : 0.75 }}
                  >
                    {selectedRecipeId
                      ? "✓ Recipe selected — click any empty slot to plan it"
                      : "Click a recipe then click an empty slot to plan it. Or drag."}
                  </p>

                  <div className="flex flex-wrap gap-1.5">
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
                        <DraggableRecipeChip
                          key={r.id}
                          recipe={r}
                          isSelected={selectedRecipeId === r.id}
                          onSelect={() => setSelectedRecipeId((prev) => prev === r.id ? null : r.id)}
                        />
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
                  <p className="text-sm mt-0.5 capitalize" style={{ color: "var(--muted)" }}>
                    {new Date(quickEntry.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })} · {quickEntry.slot}
                  </p>
                </div>

                {/* Type chips */}
                <div className="flex flex-wrap gap-1.5">
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
                    Label (optional)
                  </label>
                  <input type="text" value={quickLabel} onChange={(e) => setQuickLabel(e.target.value)}
                    placeholder={ENTRY_META[quickType].label}
                    maxLength={60}
                    onKeyDown={(e) => { if (e.key === "Enter") void addManualEntry(); }}
                    className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ border: "1px solid var(--border)", background: "var(--background)", color: "var(--foreground)" }} />
                </div>

                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => setQuickEntry(null)}
                    className="px-4 py-2 rounded-xl text-sm" style={{ border: "1px solid var(--border)", color: "var(--muted)" }}>
                    Cancel
                  </button>
                  <button type="button" onClick={() => void addManualEntry()} disabled={isAddingManual}
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
