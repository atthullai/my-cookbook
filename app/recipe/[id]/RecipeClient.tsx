"use client";

// RECIPE READER MAP
// This file is the actual recipe reading/cooking page.
// It controls language switching, serving-size scaling, ingredient checkboxes, equipment checkboxes, print, and nutrition display.
// If the recipe page looks wrong or you want a new reader feature, this is the file to edit.

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppIcon from "@/components/AppIcon";
import BadgeChip from "@/components/BadgeChip";
import IngredientIcon from "@/components/IngredientIcon";
import type { AppLanguage, RecipeAmount, RecipeIngredientGroup, RecipeRecord } from "@/lib/recipe-types";
import {
  getEquipmentLabel,
  getIngredientGroupLabel,
  getIngredientLabel,
  getInstructionStepSections,
  getRecipeDescription,
  getRecipeNutritionNote,
  getRecipeTitle,
} from "@/lib/recipe-types";
import {
  buildRecipeHighlights,
  deriveNutritionClaimTags,
  getMacroBalance,
  getNutrientImpactSplit,
  getNutritionHighlights,
  getNutritionItems,
  getRecipeCoverImage,
  parseInstructionSections,
} from "@/lib/recipe-view";
import { matchIngredientsInStep } from "@/lib/step-ingredients";
import { convertForDisplay, type UnitSystem } from "@/lib/unit-display";
import { calculateHealthScore } from "@/lib/ingredient-ontology";
import { NutritionBadge } from "@/components/NutritionBadge";
import { deriveNutritionMeta } from "@/lib/nutrition-confidence";
import { cookingStepId, ingredientGroupId, ingredientRowId, nutritionTagId, recipeBadgeId, recipeTimingId, stableCompositeId } from "@/lib/stable-ids";
import { findEquipmentItem } from "@/lib/equipment-library";
import { useLibrary } from "@/components/LibraryProvider";
import { logCookDb } from "@/lib/library";
import { supabase } from "@/lib/supabase";
import { mapRecipeRows } from "@/lib/recipe-db";
import { toRecipeSummaries } from "@/lib/recipe-adapter";
import RecipeRail from "@/components/RecipeRail";
import RecipeFeedback from "@/components/RecipeFeedback";
import { usePreferences } from "@/components/PreferencesProvider";
import { detectAllergens, ALLERGEN_LABELS } from "@/lib/allergens";
import type { RecipeSummary } from "@/types";
import toast, { Toaster } from "react-hot-toast";

// One running kitchen timer (cooking mode supports several at once).
interface CookTimer { id: number; label: string; total: number; left: number; running: boolean }

const COOK_PROGRESS_KEY = "cookbook:cooking-progress";

const APPLIANCE_LABEL: Record<string, string> = {
  cooktop: "Cooktop",
  oven: "Oven",
  blender: "Blender",
  "pressure-cooker": "Pressure cooker",
  microwave: "Microwave",
  grill: "Grill",
};

function beep() {
  try {
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "sine"; osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.7);
    osc.start(); osc.stop(ctx.currentTime + 0.7);
  } catch { /* audio not available */ }
}

function fmtClock(secs: number): string {
  const m = Math.floor(secs / 60).toString().padStart(2, "0");
  const s = (secs % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

type RecipeClientProps = {
  recipe: RecipeRecord;
};

export default function RecipeClient({ recipe }: RecipeClientProps) {
  // Record this view so it appears in "Recently Viewed" (Library + Home).
  const { trackView } = useLibrary();
  const { prefs } = usePreferences();
  useEffect(() => {
    trackView(String(recipe.id));
    // Only track once per mount per recipe.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id]);

  // Show Edit / Delete only to the recipe's owner.
  const [canEdit, setCanEdit] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (alive) setCanEdit(Boolean(user && recipe.user_id && user.id === recipe.user_id));
    })();
    return () => { alive = false; };
  }, [recipe.user_id]);

  const handleDeleteRecipe = useCallback(async () => {
    setDeleting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { window.location.href = "/login"; return; }
      const { error } = await supabase.from("recipes").delete().eq("id", recipe.id).eq("user_id", user.id);
      if (error) throw error;
      toast.success("Recipe deleted");
      window.location.href = "/library";
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to delete");
      setDeleting(false);
    }
  }, [recipe.id]);
  // These local UI states are purely for the reader experience and are not persisted to the database.
  const [multiplier, setMultiplier] = useState(1);
  const checkedStorageKey = `cookbook:recipe:${recipe.id}:checked-ingredients`;
  const [checked, setChecked] = useState<string[]>(() => {
    if (typeof window === "undefined") return [];
    const stored = window.localStorage.getItem(checkedStorageKey);
    return stored ? (JSON.parse(stored) as string[]) : [];
  });
  const [checkedEquipment, setCheckedEquipment] = useState<string[]>([]);
  const [lang, setLang] = useState<AppLanguage>("en");
  const [unitSystem, setUnitSystem] = useState<UnitSystem>("metric");
  const [showAllNutrients, setShowAllNutrients] = useState(false);
  const [showNutrition, setShowNutrition] = useState(Boolean(recipe.nutrition));
  const [activeStep, setActiveStep] = useState(0);
  const [isCookingMode, setIsCookingMode] = useState(false);
  const [timers, setTimers] = useState<CookTimer[]>([]);
  const timerIdRef = useRef(0);

  // Accept strings, numbers, and fractions because stored recipe data may evolve over time.
  const parseAmount = (value: RecipeAmount): number | null => {
    // Ingredient amounts can be "2", "0.5", "1/2", a number, or blank.
    // This helper turns the ones we understand into a number so serving scaling can work.
    if (value === null || value === "") {
      return null;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    const trimmedValue = value.trim();
    const directNumber = Number(trimmedValue);

    if (!Number.isNaN(directNumber)) {
      return directNumber;
    }

    if (trimmedValue.includes("/")) {
      const [numeratorValue, denominatorValue] = trimmedValue.split("/");
      const numerator = Number(numeratorValue);
      const denominator = Number(denominatorValue);

      if (!Number.isNaN(numerator) && !Number.isNaN(denominator) && denominator !== 0) {
        return numerator / denominator;
      }
    }

    return null;
  };

  const formatAmount = (value: number) => {
    const fractions: [number, string][] = [
      [1/8,  "1/8"],  [1/4,  "1/4"],  [1/3,  "1/3"],
      [3/8,  "3/8"],  [1/2,  "1/2"],  [2/3,  "2/3"],
      [5/8,  "5/8"],  [3/4,  "3/4"],  [7/8,  "7/8"],
    ];
    const whole = Math.floor(value);
    const frac  = value - whole;
    const match = fractions.find(([f]) => Math.abs(frac - f) < 0.02);
    if (match) {
      return whole > 0 ? `${whole} ${match[1]}` : match[1];
    }
    const rounded = Number(value.toFixed(2));
    return rounded % 1 === 0 ? String(rounded) : rounded.toString();
  };

  const toggleCheck = (index: string) => {
    setChecked((currentChecked) =>
      currentChecked.includes(index)
        ? currentChecked.filter((item) => item !== index)
        : [...currentChecked, index]
    );
  };

  const toggleEquipmentCheck = (item: string) => {
    setCheckedEquipment((currentChecked) =>
      currentChecked.includes(item)
        ? currentChecked.filter((value) => value !== item)
        : [...currentChecked, item]
    );
  };

  // All language-sensitive labels flow through helpers so the page component stays readable.
  const recipeTitle = getRecipeTitle(recipe, lang);
  const recipeDescription = getRecipeDescription(recipe, lang);
  const recipeNutritionNote = getRecipeNutritionNote(recipe, lang);
  const recipeSections = parseInstructionSections(recipe, lang);
  const ingredientGroups: RecipeIngredientGroup[] = useMemo(() => recipe.ingredients ?? [], [recipe.ingredients]);
  const highlights = buildRecipeHighlights(recipe, lang);
  const coverImage = getRecipeCoverImage(recipe);
  const displayBadges = [...new Set([...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")])];
  const nutritionItems = getNutritionItems(recipe, lang);
  const macroBalance = getMacroBalance(recipe);
  const nutritionHighlights = getNutritionHighlights(recipe, lang);
  const healthScore = calculateHealthScore(recipe.nutrition ?? null);
  const allIngredientItems = (recipe.ingredients ?? []).flatMap((g) => g.items);
  const nutritionMeta = deriveNutritionMeta(allIngredientItems);

  // Structured steps (chips + heat/time/tool cues) — falls back to text-only on legacy recipes.
  const stepSections = useMemo(() => getInstructionStepSections(recipe, lang), [recipe, lang]);
  // Canonical-name → ingredient lookup so step `ingredientRefs` resolve to a chip.
  const ingredientByKey = useMemo(() => {
    const map = new Map<string, (typeof allIngredientItems)[number]>();
    for (const item of allIngredientItems) {
      const key = (item.canonicalName || item.name_en || "").trim().toLowerCase();
      if (key) map.set(key, item);
    }
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.ingredients]);
  const score10 = healthScore !== null ? Math.round(healthScore) / 10 : null;
  const impactSplit = useMemo(() => getNutrientImpactSplit(recipe, lang), [recipe, lang]);

  // Display string for an ingredient amount, respecting the serving multiplier and the
  // metric/imperial Convert Units toggle. Returns "" for to-taste / unmeasured items.
  const ingredientAmountLabel = useCallback(
    (amount: RecipeAmount, unit: string, isToTaste: boolean): string => {
      const base = parseAmount(amount);
      if (base === null || isToTaste) return "";
      const scaled = base * multiplier;
      const u = unit?.trim() ?? "";
      const converted = u ? convertForDisplay(scaled, u, unitSystem) : null;
      if (converted) return `${formatAmount(converted.amount)} ${converted.unit}`;
      const unitLabel = u && u !== "whole" && u !== "clove" ? (u === "ml" ? "mL" : u === "l" ? "L" : u) : "";
      return `${formatAmount(scaled)}${unitLabel ? ` ${unitLabel}` : ""}`;
    },
    [multiplier, unitSystem],
  );
  const allSteps = useMemo(
    () =>
      recipeSections.flatMap((section) =>
        section.steps.map((step, index) => ({
          section: section.title,
          step,
          id: cookingStepId(recipe.id, section.title, step, index),
        }))
      ),
    [recipe.id, recipeSections]
  );
  useEffect(() => {
    window.localStorage.setItem(checkedStorageKey, JSON.stringify(checked));
  }, [checked, checkedStorageKey]);

  // Hide the site header while cooking so the full screen is recipe content.
  useEffect(() => {
    if (isCookingMode) {
      document.body.classList.add("cooking-mode");
    } else {
      document.body.classList.remove("cooking-mode");
    }
    return () => { document.body.classList.remove("cooking-mode"); };
  }, [isCookingMode]);

  // ── Cooking resume ─────────────────────────────────────────────────────────
  const stepKey = `cookbook:recipe:${recipe.id}:cook-step`;

  const enterCooking = useCallback(() => {
    try {
      const saved = window.localStorage.getItem(stepKey);
      if (saved) setActiveStep(Math.max(0, parseInt(saved, 10) || 0));
    } catch { /* ignore */ }
    setIsCookingMode(true);
  }, [stepKey]);

  const exitCooking = useCallback(() => setIsCookingMode(false), []);

  const finishCooking = useCallback(() => {
    void logCookDb(String(recipe.id)); // adds to Recently Cooked
    try {
      window.localStorage.removeItem(stepKey);
      window.localStorage.removeItem(COOK_PROGRESS_KEY);
    } catch { /* ignore */ }
    setTimers([]);
    setIsCookingMode(false);
    setActiveStep(0);
  }, [recipe.id, stepKey]);

  // Persist progress while cooking so Home can show "Continue Cooking".
  useEffect(() => {
    if (!isCookingMode) return;
    try {
      window.localStorage.setItem(stepKey, String(activeStep));
      window.localStorage.setItem(COOK_PROGRESS_KEY, JSON.stringify({
        recipeId: String(recipe.id),
        title: recipeTitle,
        step: activeStep,
        total: allSteps.length,
        ts: Date.now(),
      }));
    } catch { /* ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCookingMode, activeStep]);

  // Ingredients referenced by the current step (for highlighting).
  const stepIngredients = useMemo(() => {
    if (!isCookingMode) return [];
    const text = (allSteps[activeStep]?.step ?? "").toLowerCase();
    if (!text) return [];
    const names = new Set<string>();
    for (const group of ingredientGroups) {
      for (const item of group.items) {
        const name = getIngredientLabel(item, lang);
        const key = name?.trim().toLowerCase();
        if (key && key.length > 2 && text.includes(key)) names.add(name.trim());
      }
    }
    return [...names].slice(0, 8);
  }, [isCookingMode, activeStep, allSteps, ingredientGroups, lang]);

  // Allergens present in this recipe; which of them the user flagged.
  const recipeAllergens = useMemo(
    () => detectAllergens(ingredientGroups.flatMap((g) => g.items).map((it) => getIngredientLabel(it, "en") || it.name_en)),
    [ingredientGroups],
  );
  const myAllergenHits = recipeAllergens.filter((a) => prefs.allergies.includes(a));

  // ── Recipe actions: add to grocery / add to plan ───────────────────────────
  const [actionBusy, setActionBusy] = useState(false);
  const [showPlan, setShowPlan]     = useState(false);
  const [planDate, setPlanDate]     = useState(() => new Date().toISOString().slice(0, 10));
  const [planSlot, setPlanSlot]     = useState("dinner");

  const addToGrocery = useCallback(async () => {
    setActionBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in"); return; }
      const rows = ingredientGroups.flatMap((g) => g.items)
        .filter((it) => (it.name_en ?? "").trim() && !it.optional && !it.garnish)
        .map((it) => {
          const amt = parseAmount(it.amount);
          return {
            user_id: user.id,
            name: getIngredientLabel(it, "en") || it.name_en,
            quantity: amt && amt > 0 ? amt * multiplier : 1,
            unit: it.unit && it.unit !== "to taste" && it.unit !== "whole" ? it.unit : null,
            category: "other",
            checked: false,
            source: "manual",
            list_name: "My List",
          };
        });
      if (rows.length === 0) { toast("No ingredients to add"); return; }
      const { error } = await supabase.from("shopping_list").insert(rows);
      if (error) throw error;
      toast.success(`Added ${rows.length} ingredients to your shopping list`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to shopping list");
    } finally {
      setActionBusy(false);
    }
  }, [ingredientGroups, multiplier]);

  const addToPlan = useCallback(async () => {
    setActionBusy(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { toast.error("Please log in"); return; }
      const { error } = await supabase.from("planned_meals").upsert({
        user_id: user.id, meal_date: planDate, meal_slot: planSlot,
        recipe_id: Number(recipe.id), servings: 1, entry_type: "recipe",
      }, { onConflict: "user_id,meal_date,meal_slot" });
      if (error) throw error;
      toast.success("Added to your meal plan");
      setShowPlan(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add to plan");
    } finally {
      setActionBusy(false);
    }
  }, [planDate, planSlot, recipe.id]);

  // ── "You may also like" — similar public recipes ───────────────────────────
  const [similar, setSimilar] = useState<RecipeSummary[]>([]);
  useEffect(() => {
    let alive = true;
    (async () => {
      const { data } = await supabase.from("recipes").select("*").eq("is_public", true).limit(80);
      if (!alive || !data) return;
      const me = toRecipeSummaries(mapRecipeRows([recipe]))[0];
      const others = toRecipeSummaries(mapRecipeRows(data)).filter((r) => r.id !== String(recipe.id));
      const myTags = new Set(me?.tags ?? []);
      const scored = others
        .map((r) => ({
          r,
          score: (r.cuisine === me?.cuisine ? 2 : 0) + r.tags.filter((t) => myTags.has(t)).length,
        }))
        .sort((a, b) => b.score - a.score);
      const top = scored.filter((s) => s.score > 0).slice(0, 8).map((s) => s.r);
      setSimilar(top.length > 0 ? top : others.slice(0, 8));
    })();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recipe.id]);

  // Tick all running timers once per second; alert when one reaches zero.
  const anyRunning = timers.some((t) => t.running && t.left > 0);
  useEffect(() => {
    if (!anyRunning) return;
    const interval = window.setInterval(() => {
      setTimers((prev) => {
        const finished: string[] = [];
        const next = prev.map((t) => {
          if (!t.running || t.left <= 0) return t;
          const left = t.left - 1;
          if (left === 0) { finished.push(t.label); return { ...t, left, running: false }; }
          return { ...t, left };
        });
        if (finished.length > 0) {
          beep();
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            finished.forEach((label) => new Notification("Timer done", { body: label }));
          }
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [anyRunning]);

  const addTimer = useCallback((label: string, seconds: number) => {
    if (typeof Notification !== "undefined" && Notification.permission === "default") {
      void Notification.requestPermission();
    }
    setTimers((prev) => [...prev, { id: ++timerIdRef.current, label, total: seconds, left: seconds, running: true }]);
  }, []);
  const toggleTimer = useCallback((id: number) => {
    setTimers((prev) => prev.map((t) => t.id === id ? { ...t, running: !t.running && t.left > 0 } : t));
  }, []);
  const removeTimer = useCallback((id: number) => {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={isCookingMode ? "cooking-mode-shell" : ""} style={{ marginTop: 16 }}>
      <Toaster position="top-right" />

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => !deleting && setConfirmDelete(false)}>
          <div className="card" style={{ maxWidth: 360, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Delete this recipe?</h3>
            <p style={{ color: "var(--muted)" }}>This permanently removes &ldquo;{recipeTitle}&rdquo;. This can&apos;t be undone.</p>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end", marginTop: 12 }}>
              <button className="button" type="button" onClick={() => setConfirmDelete(false)} disabled={deleting}>Cancel</button>
              <button className="button" type="button" onClick={() => void handleDeleteRecipe()} disabled={deleting}
                style={{ background: "var(--berry)", color: "#fff" }}>
                {deleting ? "Deleting…" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Nutrition balance score — full nutrient breakdown */}
      {showAllNutrients && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowAllNutrients(false)}>
          <div className="card nutrient-modal" onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
              <h3 style={{ margin: 0 }}>{lang === "de" ? "Nährwert-Balance" : "Nutrition balance score"}</h3>
              <button type="button" aria-label="Close" className="button" onClick={() => setShowAllNutrients(false)}>✕</button>
            </div>
            <p style={{ color: "var(--muted)", fontSize: "0.85rem", marginTop: 8 }}>
              {lang === "de"
                ? "Nährstoffe werden relativ zur empfohlenen Tagesmenge eingeordnet — grün = positiver Beitrag, rot = in Maßen genießen."
                : "Nutrients are classified relative to daily values — green = positive impact, red = enjoy in moderation."}
              {score10 !== null ? ` ${score10.toFixed(1)}/10.` : ""}
            </p>
            {impactSplit.positive.length > 0 && (
              <>
                <h4 style={{ marginBottom: 8 }}>{lang === "de" ? "Positiver Beitrag" : "Nutrients with positive impact"}</h4>
                <div className="impact-list">
                  {impactSplit.positive.map((n) => (
                    <div key={n.key} className="impact-row">
                      <span className="impact-name">{n.label} <small>{n.value}{n.unit}</small></span>
                      <span className="impact-bar"><i className="impact-fill pos" style={{ width: `${n.percent}%` }} /></span>
                    </div>
                  ))}
                </div>
              </>
            )}
            {impactSplit.negative.length > 0 && (
              <>
                <h4 style={{ margin: "16px 0 8px" }}>{lang === "de" ? "In Maßen genießen" : "Nutrients with negative impact"}</h4>
                <div className="impact-list">
                  {impactSplit.negative.map((n) => (
                    <div key={n.key} className="impact-row">
                      <span className="impact-name">{n.label} <small>{n.value}{n.unit}</small></span>
                      <span className="impact-bar"><i className="impact-fill neg" style={{ width: `${n.percent}%` }} /></span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Add-to-plan picker */}
      {showPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4" style={{ background: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowPlan(false)}>
          <div className="card" style={{ maxWidth: 360, width: "100%" }} onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: 12 }}>Add to meal plan</h3>
            <label className="eyebrow" htmlFor="plan-date">Date</label>
            <input id="plan-date" type="date" value={planDate} onChange={(e) => setPlanDate(e.target.value)}
              className="input" style={{ width: "100%", marginBottom: 12 }} />
            <label className="eyebrow" htmlFor="plan-slot">Meal</label>
            <select id="plan-slot" value={planSlot} onChange={(e) => setPlanSlot(e.target.value)}
              className="input" style={{ width: "100%", marginBottom: 16 }}>
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="snack">Snack</option>
            </select>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button className="button" type="button" onClick={() => setShowPlan(false)}>Cancel</button>
              <button className="button button-primary" type="button" onClick={() => void addToPlan()} disabled={actionBusy}>
                {actionBusy ? "Adding…" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Keep header controls together because language and serving size both change the same recipe view. */}
      <div className="hero-panel" style={{ marginBottom: 20 }}>
        <div className="hero-copy">
          <p className="eyebrow">{lang === "de" ? "Rezeptseite" : "Recipe Page"}</p>
          <h1>{recipeTitle}</h1>
          <p>{recipeDescription || recipe.category || "Uncategorized"}</p>
          <p style={{ marginTop: 8, marginBottom: 0, fontSize: "0.98rem" }}>
            By {recipe.author_name || "Atthuzhai"}
            {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
          </p>
        </div>

        <div className="hero-actions">
          {canEdit && (
            <a className="button button-primary" href={`/edit/${recipe.id}`}>
              <AppIcon name="recipe" size={16} />
              Edit
            </a>
          )}
          {canEdit && (
            <button className="button" type="button" onClick={() => setConfirmDelete(true)} style={{ color: "var(--berry)" }}>
              <AppIcon name="delete" size={16} />
              Delete
            </button>
          )}
          <button className="button" type="button" onClick={handlePrint}>
            <AppIcon name="print" size={16} />
            Print
          </button>
          <button className="button button-primary" type="button" onClick={() => (isCookingMode ? exitCooking() : enterCooking())}>
            <AppIcon name="quick" size={16} />
            {isCookingMode ? "Exit Cooking" : "Cooking Mode"}
          </button>
          <button className="button" type="button" onClick={() => void addToGrocery()} disabled={actionBusy}>
            🛒 Add to list
          </button>
          <button className="button" type="button" onClick={() => setShowPlan(true)} disabled={actionBusy}>
            📅 Add to plan
          </button>
          <div className="segmented-control" aria-label="Recipe language">
            <button className={lang === "en" ? "button active" : "button"} type="button" onClick={() => setLang("en")}>
              EN
            </button>
            <button className={lang === "de" ? "button active" : "button"} type="button" onClick={() => setLang("de")}>
              DE
            </button>
          </div>
        </div>
      </div>

      {recipeAllergens.length > 0 && (
        <div className="card" style={{
          marginBottom: 16,
          borderColor: myAllergenHits.length > 0 ? "rgba(192,57,43,0.5)" : "var(--border)",
          background: myAllergenHits.length > 0 ? "rgba(192,57,43,0.08)" : "var(--surface)",
        }}>
          <strong style={{ color: myAllergenHits.length > 0 ? "#c0392b" : "var(--foreground)" }}>
            {myAllergenHits.length > 0 ? "⚠ " : ""}Contains:{" "}
          </strong>
          {recipeAllergens.map((a, i) => (
            <span key={a} style={{ color: prefs.allergies.includes(a) ? "#c0392b" : "var(--muted)", fontWeight: prefs.allergies.includes(a) ? 700 : 400 }}>
              {i > 0 ? ", " : ""}{ALLERGEN_LABELS[a]}
            </span>
          ))}
          {myAllergenHits.length > 0 && (
            <p style={{ margin: "6px 0 0", fontSize: "0.85rem", color: "#c0392b" }}>
              This recipe contains ingredients you flagged as allergens.
            </p>
          )}
        </div>
      )}

      <div className="recipe-detail-layout">
        {coverImage ? (
          <div className="card">
            <Image
              src={coverImage}
              alt={`${recipeTitle} cover`}
              className="recipe-cover-photo"
              width={1600}
              height={1000}
              onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
            />
          </div>
        ) : null}

        <div className="card recipe-summary-card">
          <h2 style={{ marginBottom: 10 }}>{lang === "de" ? "Auf einen Blick" : "At a Glance"}</h2>
          <div className="recipe-card-meta">
            {highlights.map((highlight) => (
              <span key={recipeTimingId(recipe.id, "highlight", highlight)} className="meta-pill">{highlight}</span>
            ))}
          </div>

          {displayBadges.length > 0 ? (
            <div className="filter-chips">
              {displayBadges.map((badge) => (
                <BadgeChip key={recipeBadgeId(recipe.id, badge)} badge={badge} lang={lang} />
              ))}
            </div>
          ) : null}

          {recipe.tags.length > 0 ? (
            <div className="filter-chips">
              {recipe.tags.map((tag) => (
                <span key={stableCompositeId(recipe.id, "tag", tag)} className="chip">
                  {tag}
                </span>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      {isCookingMode && (
        <div className="cooking-toolbar" aria-label="Cooking controls">
          <button className="button" type="button" onClick={() => setActiveStep((current) => Math.max(0, current - 1))}>
            Previous
          </button>
          <span className="toolbar-status">
            Step {allSteps.length === 0 ? 0 : activeStep + 1} / {allSteps.length}
          </span>
          <button className="button" type="button" onClick={() => {
            setActiveStep((current) => Math.min(Math.max(allSteps.length - 1, 0), current + 1));
          }}>
            Next
          </button>
          <button className="button button-soft" type="button" onClick={() => addTimer("1 min", 60)}>+1m</button>
          <button className="button button-soft" type="button" onClick={() => addTimer("5 min", 300)}>+5m</button>
          <button className="button button-soft" type="button" onClick={() => addTimer("10 min", 600)}>+10m</button>
          <button className="button button-primary" type="button" onClick={finishCooking}>
            Done cooking ✓
          </button>
        </div>
      )}

      {/* Active timers (multiple supported) */}
      {isCookingMode && timers.length > 0 && (
        <div className="card" style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center", marginBottom: 12 }}>
          {timers.map((t) => (
            <div key={t.id} style={{
              display: "inline-flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 999,
              border: "1px solid var(--border)",
              background: t.left === 0 ? "rgba(220,80,80,0.12)" : "var(--surface)",
            }}>
              <span style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{t.label}</span>
              <strong style={{ fontVariantNumeric: "tabular-nums", color: t.left === 0 ? "#c0392b" : "var(--foreground)" }}>
                {t.left === 0 ? "done!" : fmtClock(t.left)}
              </strong>
              {t.left > 0 && (
                <button className="button button-soft" type="button" style={{ padding: "2px 8px", fontSize: "0.75rem" }}
                  onClick={() => toggleTimer(t.id)}>
                  {t.running ? "Pause" : "Start"}
                </button>
              )}
              <button type="button" aria-label="Remove timer" onClick={() => removeTimer(t.id)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--muted)" }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {isCookingMode && allSteps[activeStep] ? (
        <div className="card cooking-focus-card">
          <p className="eyebrow">{allSteps[activeStep].section}</p>
          <h2>{allSteps[activeStep].step}</h2>
          {stepIngredients.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 12 }}>
              <span style={{ fontSize: "0.78rem", color: "var(--muted)", alignSelf: "center" }}>Uses:</span>
              {stepIngredients.map((name) => (
                <span key={name} style={{
                  padding: "3px 10px", borderRadius: 999, fontSize: "0.78rem", fontWeight: 600,
                  background: "rgba(192,138,45,0.14)", color: "var(--accent-strong)",
                }}>{name}</span>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {/* Ingredients and equipment both use checklist-style interactions because they are "work through" sections. */}
      <div className="reader-section-grid">
        <div className="reader-stack">
          <div id="ingredients" className="card">
            <div className="ingredients-head">
              <h3 style={{ margin: 0 }}>{lang === "de" ? "Zutaten" : "Ingredients"}</h3>
              <button className="button button-primary" type="button" onClick={() => void addToGrocery()} disabled={actionBusy}>
                🛒 {lang === "de" ? "Zur Liste" : "Add to list"}
              </button>
            </div>
            <div className="ingredients-controls">
              <div className="serving-stepper" aria-label={lang === "de" ? "Portionen" : "Servings"}>
                <button type="button" onClick={() => setMultiplier((m) => Math.max(0.25, parseFloat((m - 0.25).toFixed(2))))} aria-label="Decrease servings">−</button>
                <span>{formatAmount((recipe.servings || 1) * multiplier)} {lang === "de" ? "Portionen" : "servings"}</span>
                <button type="button" onClick={() => setMultiplier((m) => Math.min(40, parseFloat((m + 0.25).toFixed(2))))} aria-label="Increase servings">+</button>
              </div>
              <button
                className="button"
                type="button"
                onClick={() => setUnitSystem((s) => (s === "metric" ? "imperial" : "metric"))}
                title={lang === "de" ? "Einheiten umrechnen" : "Convert Units"}
              >
                ⇄ {lang === "de" ? "Einheiten" : "Convert Units"} · {unitSystem === "metric" ? "Metric" : "Imperial"}
              </button>
            </div>

            {ingredientGroups.map((group, groupIndex) => (
              <div key={ingredientGroupId(recipe.id, group.group_en, groupIndex)} style={{ marginBottom: 16 }}>
                <h4 style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{getIngredientGroupLabel(group, lang)}</h4>

                {group.items.map((ingredient, ingredientIndex) => {
                  const label = getIngredientLabel(ingredient, lang);
                  const itemId = ingredientRowId(recipe.id, group.group_en, label, ingredientIndex);
                  const isChecked = checked.includes(itemId);
                  const isToTaste = ingredient.isToTaste || ingredient.unit === "to taste";
                  const amountLabel = ingredientAmountLabel(ingredient.amount, ingredient.unit, isToTaste);
                  // Grey sub-note line: preparation / optional / garnish / to-taste / free note.
                  const subParts = [
                    ingredient.preparation || "",
                    isToTaste ? (lang === "de" ? "nach Geschmack" : "to taste") : "",
                    ingredient.optional ? (lang === "de" ? "optional" : "optional") : "",
                    ingredient.garnish ? (lang === "de" ? "Garnitur" : "garnish") : "",
                    ingredient.note || "",
                  ].filter(Boolean);

                  return (
                    <button key={itemId} type="button" onClick={() => toggleCheck(itemId)} className="check-row ingredient-row" aria-pressed={isChecked} style={{ opacity: isChecked ? 0.55 : 1 }}>
                      <span className={isChecked ? "checkmark-box checked" : "checkmark-box"}>{isChecked ? "✓" : ""}</span>
                      <span className="ingredient-row-icon" aria-hidden="true">
                        <IngredientIcon name={ingredient.name_en || label} size={22} />
                      </span>
                      <span className="ingredient-row-text" style={{ textDecoration: isChecked ? "line-through" : "none" }}>
                        <span className="ingredient-row-main">
                          {amountLabel ? <strong>{amountLabel}</strong> : null}
                          {amountLabel ? " " : ""}
                          {label}
                        </span>
                        {subParts.length > 0 ? <small className="ingredient-subnote">{subParts.join(" · ")}</small> : null}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {recipe.equipment && recipe.equipment.length > 0 ? (
            <div id="equipment" className="card">
              <h3>Equipment</h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(88px, 1fr))",
                  gap: 10,
                }}
              >
                {recipe.equipment.map((item) => {
                  const label = getEquipmentLabel(item, lang);
                  const isChecked = checkedEquipment.includes(item.label_en);
                  // Resolve image: stored image > canonical library lookup > null
                  const imageSrc = item.image ?? findEquipmentItem(item.label_en)?.image ?? null;
                  return (
                    <button
                      key={stableCompositeId(recipe.id, "equipment", item.label_en)}
                      type="button"
                      aria-pressed={isChecked}
                      aria-label={`${getEquipmentLabel(item, lang)} — ${isChecked ? "ready" : "not ready"}`}
                      onClick={() => toggleEquipmentCheck(item.label_en)}
                      style={{
                        position: "relative",
                        width: "100%",
                        aspectRatio: "1 / 1",
                        borderRadius: 12,
                        overflow: "hidden",
                        border: isChecked
                          ? "3px solid var(--color-primary, #e67e22)"
                          : "3px solid transparent",
                        cursor: "pointer",
                        background: "#f3f4f6",
                        padding: 0,
                        opacity: isChecked ? 0.55 : 1,
                        transition: "opacity 0.2s, border-color 0.15s",
                      }}
                      title={label}
                    >
                      {imageSrc ? (
                        <Image
                          src={imageSrc}
                          alt={label}
                          fill
                          sizes="(max-width: 600px) 28vw, 110px"
                          style={{ objectFit: "cover" }}
                          unoptimized
                          onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                        />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 32 }}>
                          🔧
                        </div>
                      )}
                      {/* gradient label */}
                      <div
                        style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          right: 0,
                          padding: "6px 4px 6px",
                          background: isChecked
                            ? "rgba(0,0,0,0.6)"
                            : "linear-gradient(transparent, rgba(0,0,0,0.7))",
                          color: "#fff",
                          fontSize: 10,
                          fontWeight: 600,
                          lineHeight: 1.25,
                          textAlign: "center",
                          wordBreak: "break-word",
                          textDecoration: isChecked ? "line-through" : "none",
                        }}
                      >
                        {label}
                      </div>
                      {/* check badge */}
                      {isChecked && (
                        <div
                          style={{
                            position: "absolute",
                            top: 5,
                            right: 5,
                            width: 20,
                            height: 20,
                            borderRadius: "50%",
                            background: "var(--color-primary, #e67e22)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#fff",
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          ✓
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>

        <div id="instructions" className="card">
          <h3>{lang === "de" ? "Anleitung" : "Instructions"}</h3>

          {stepSections.map((section, sectionIndex) => (
            <div key={stableCompositeId(recipe.id, "section", section.title, sectionIndex)} style={{ marginBottom: 16 }}>
              {section.title && stepSections.length > 1 ? <h4 style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{section.title}</h4> : null}
              <ol className="instruction-list">
                {section.steps.map((step, index) => {
                  const refKeys = step.ingredientRefs.length > 0
                    ? step.ingredientRefs
                    : matchIngredientsInStep(step.text, allIngredientItems);
                  const chips = refKeys
                    .map((k) => ingredientByKey.get(k))
                    .filter((it): it is NonNullable<typeof it> => Boolean(it));
                  const heatLabel = step.heat
                    ? (lang === "de"
                        ? { low: "Niedrig", medium: "Mittel", high: "Hoch" }[step.heat]
                        : { low: "Low", medium: "Med", high: "High" }[step.heat])
                    : null;
                  const cues = [
                    step.appliance ? APPLIANCE_LABEL[step.appliance] ?? step.appliance : null,
                    heatLabel,
                    step.durationMin ? `${step.durationMin} min` : null,
                  ].filter(Boolean) as string[];
                  return (
                    <li key={cookingStepId(recipe.id, section.title, step.text, index)} className={allSteps[activeStep]?.step === step.text ? "active-step" : ""} style={{ listStyle: "decimal" }}>
                      <div className="step-text">{step.text}</div>
                      {(chips.length > 0 || cues.length > 0 || step.tools.length > 0) && (
                        <div className="step-meta">
                          {chips.map((it, ci) => {
                            const amt = ingredientAmountLabel(it.amount, it.unit, it.isToTaste || it.unit === "to taste");
                            return (
                              <span key={`chip-${ci}`} className="step-chip">
                                <IngredientIcon name={it.name_en || getIngredientLabel(it, lang)} size={15} />
                                {getIngredientLabel(it, lang)}{amt ? <em>{amt}</em> : null}
                              </span>
                            );
                          })}
                          {cues.length > 0 && <span className="step-cue">{cues.join(" · ")}</span>}
                          {step.tools.map((t) => (
                            <span key={`tool-${t}`} className="step-tool">🔧 {t}</span>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      </div>

      <div className="card nutrition-panel" style={{ marginTop: 20 }}>
        <div className="nutrition-panel-header">
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {score10 !== null && (
              <div className="nutrition-score-badge" title={lang === "de" ? "Nährwert-Balance" : "Nutrition balance score"}>
                <strong>{score10.toFixed(1)}</strong>
                <small>/10</small>
              </div>
            )}
            <div>
              <h3 style={{ marginBottom: 4 }}>{lang === "de" ? "Nährwert-Balance" : "Nutrition balance score"}</h3>
              <p style={{ marginBottom: 0, fontSize: "0.85rem", color: "var(--muted)" }}>
                {lang === "de"
                  ? "Auf einer Skala von 1–10, basierend auf der Nährstoffdichte. Pro Portion."
                  : "On a 1–10 scale, based on nutrient density. Per serving."}
              </p>
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {(impactSplit.positive.length > 0 || impactSplit.negative.length > 0) && (
              <button className="button" type="button" onClick={() => setShowAllNutrients(true)}>
                {lang === "de" ? "Alle Nährstoffe" : "View all nutrients"}
              </button>
            )}
            <button className="button button-primary" type="button" onClick={() => setShowNutrition((current) => !current)}>
              <AppIcon name="protein" size={16} />
              {lang === "de" ? (showNutrition ? "Nahrwerte ausblenden" : "Nahrwerte anzeigen") : showNutrition ? "Hide Nutrition" : "Show Nutrition"}
            </button>
          </div>
        </div>

        {showNutrition ? (
          <div className="nutrition-reveal">
            {recipe.nutrition ? (
              <div className="nutrition-stack">
                <div className="nutrition-hero">
                  <div className="nutrition-calorie-dial" aria-label={lang === "de" ? "Kalorien pro Portion" : "Calories per serving"}>
                    <span>{recipe.nutrition.calories_kcal || "--"}</span>
                    <small>kcal</small>
                  </div>
                  <div style={{ flex: 1 }}>
                    <p className="eyebrow">{lang === "de" ? "Pro Portion" : "Per serving"}</p>
                    <p style={{ marginBottom: 0 }}>
                      {(() => {
                        const base = recipe.servings || 1;
                        const scaled = Math.round(base * multiplier * 10) / 10;
                        if (lang === "de") {
                          return multiplier !== 1
                            ? `Basierend auf ${scaled} Portion${scaled === 1 ? "" : "en"} (${multiplier}×).`
                            : `Basierend auf ${base} Portion${base === 1 ? "" : "en"}.`;
                        }
                        return multiplier !== 1
                          ? `Based on ${scaled} serving${scaled === 1 ? "" : "s"} (${multiplier}×).`
                          : `Based on ${base} serving${base === 1 ? "" : "s"}.`;
                      })()}
                    </p>
                    {nutritionHighlights.length > 0 ? (
                      <div className="nutrition-highlight-row">
                        {nutritionHighlights.map((item) => (
                          <span key={nutritionTagId(recipe.id, item.key)} className="nutrition-highlight">
                            <strong>{item.dailyPercent}%</strong>
                            {item.label}
                          </span>
                        ))}
                      </div>
                    ) : null}
                  </div>
                  <NutritionBadge
                    source={nutritionMeta.source}
                    confidence={nutritionMeta.confidence}
                    unmatchedCount={nutritionMeta.unmatchedCount}
                    totalCount={nutritionMeta.totalCount}
                  />
                </div>

                {macroBalance.length > 0 ? (
                  <div className="macro-card">
                    <div className="macro-bar" aria-label={lang === "de" ? "Makronahrstoff-Verteilung" : "Macronutrient balance"}>
                      {macroBalance.map((item) => (
                        <span key={nutritionTagId(recipe.id, item.key)} className={`macro-segment macro-${item.key}`} style={{ width: `${item.percent}%` }} />
                      ))}
                    </div>
                    <div className="macro-legend">
                      {macroBalance.map((item) => (
                        <span key={nutritionTagId(recipe.id, `legend-${item.key}`)}>
                          <i className={`macro-dot macro-${item.key}`} />
                          {lang === "de" ? item.label_de : item.label_en}: {item.value}g
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="nutrition-fact-grid">
                  {healthScore !== null ? (
                    <div className="nutrition-fact-card nutrition-energy">
                      <div className="nutrition-fact-topline">
                        <span>{lang === "de" ? "Gesundheitswert" : "Health score"}</span>
                        <strong>{healthScore}/100</strong>
                      </div>
                    </div>
                  ) : null}
                  {nutritionItems.map((item) => (
                    <div key={nutritionTagId(recipe.id, item.key)} className={`nutrition-fact-card nutrition-${item.group}`}>
                      <div className="nutrition-fact-topline">
                        <span>{item.label}</span>
                        <strong>
                          {item.value}
                          {item.unit ? ` ${item.unit}` : ""}
                        </strong>
                      </div>
                      {item.dailyPercent !== null ? (
                        <div className="nutrition-dv">
                          <span style={{ width: `${Math.min(item.dailyPercent, 100)}%` }} />
                          <small>{item.dailyPercent}% DV</small>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>

                {recipeNutritionNote ? <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{recipeNutritionNote}</p> : null}
              </div>
            ) : (
              <p style={{ marginBottom: 0 }}>{lang === "de" ? "Noch keine Nahrwerte hinterlegt." : "No nutrition facts added yet."}</p>
            )}
          </div>
        ) : null}
      </div>

      {/* Ratings + personal notes */}
      {!isCookingMode && (
        <div style={{ marginTop: 24 }}>
          <RecipeFeedback recipeId={String(recipe.id)} />
        </div>
      )}

      {/* You may also like */}
      {!isCookingMode && similar.length > 0 && (
        <div style={{ marginTop: 28 }}>
          <RecipeRail title={lang === "de" ? "Das könnte dir auch gefallen" : "You may also like"} recipes={similar} />
        </div>
      )}
    </div>
  );
}
