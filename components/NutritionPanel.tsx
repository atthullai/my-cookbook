"use client";

/**
 * NutritionPanel — per-serving nutrition display with macro progress bars.
 *
 * - Calories shown large, color-coded via calorieColor().
 * - Each macro has a progress bar vs. daily value.
 * - Skeleton state when status === "pending".
 * - "Nutrition unavailable" state when status === "failed".
 * - Small "USDA" or "Edamam" source badge.
 *
 * Usage:
 *   <NutritionPanel nutrition={recipe.nutrition} status={recipe.nutritionStatus} source="usda" />
 */
import { motion } from "framer-motion";
import type { NutritionInfo, NutritionStatus } from "@/types";
import { calorieColor, DAILY_VALUES } from "@/lib/nutrition";

interface NutritionPanelProps {
  nutrition?: NutritionInfo;
  status:     NutritionStatus;
  source?:    "usda" | "edamam";
  onRetry?:   () => void;
}

interface MacroRowProps {
  label:    string;
  value:    number;
  unit:     string;
  dailyVal: number;
  color:    string;
}

/** Single macro row: label, value, and a progress bar vs. daily value */
function MacroRow({ label, value, unit, dailyVal, color }: MacroRowProps) {
  const pct = Math.min(Math.round((value / dailyVal) * 100), 100);
  return (
    <div className="space-y-0.5">
      <div className="flex justify-between text-xs text-gray-600">
        <span>{label}</span>
        <span className="font-medium text-gray-800">{value}{unit}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
      <p className="text-[10px] text-gray-400">{pct}% DV</p>
    </div>
  );
}

/** Skeleton placeholder while nutrition is loading */
function SkeletonPanel() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-8 w-24 bg-gray-200 rounded" />
      {[...Array(5)].map((_, i) => (
        <div key={i} className="space-y-1">
          <div className="flex justify-between">
            <div className="h-3 w-16 bg-gray-200 rounded" />
            <div className="h-3 w-10 bg-gray-200 rounded" />
          </div>
          <div className="h-1.5 bg-gray-200 rounded-full" />
        </div>
      ))}
    </div>
  );
}

export default function NutritionPanel({ nutrition, status, source, onRetry }: NutritionPanelProps) {
  if (status === "pending") return <SkeletonPanel />;

  if (status === "failed" || !nutrition) {
    return (
      <div className="text-center py-6 space-y-2">
        <p className="text-sm text-gray-400">Nutrition unavailable</p>
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="text-xs text-indigo-600 hover:text-indigo-800 underline"
          >
            Try again
          </button>
        )}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-4"
    >
      {/* Calorie headline */}
      <div className="flex items-baseline gap-2">
        <span className={`text-3xl font-bold tabular-nums ${calorieColor(nutrition.calories)}`}>
          {nutrition.calories}
        </span>
        <span className="text-sm text-gray-500">kcal / serving</span>

        {/* Data source badge */}
        {source && (
          <span className="ml-auto text-[10px] font-medium uppercase tracking-wide text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
            {source === "usda" ? "USDA" : "Edamam"}
          </span>
        )}
      </div>

      {/* Macro progress bars */}
      <div className="space-y-3">
        <MacroRow
          label="Protein"     value={nutrition.protein}       unit="g"
          dailyVal={DAILY_VALUES.protein}       color="bg-purple-400"
        />
        <MacroRow
          label="Carbs"       value={nutrition.carbohydrates}  unit="g"
          dailyVal={DAILY_VALUES.carbohydrates} color="bg-amber-400"
        />
        <MacroRow
          label="Fat"         value={nutrition.fat}            unit="g"
          dailyVal={DAILY_VALUES.fat}           color="bg-rose-400"
        />
        <MacroRow
          label="Fibre"       value={nutrition.fiber}          unit="g"
          dailyVal={DAILY_VALUES.fiber}         color="bg-green-400"
        />
        <MacroRow
          label="Sugar"       value={nutrition.sugar}          unit="g"
          dailyVal={DAILY_VALUES.sugar}         color="bg-pink-300"
        />
        <MacroRow
          label="Sodium"      value={nutrition.sodium}         unit="mg"
          dailyVal={DAILY_VALUES.sodium}        color="bg-blue-300"
        />
      </div>

      {nutrition.servingSize > 0 && (
        <p className="text-[11px] text-gray-400 pt-1 border-t border-gray-100">
          Per ~{nutrition.servingSize}g serving
        </p>
      )}
    </motion.div>
  );
}
