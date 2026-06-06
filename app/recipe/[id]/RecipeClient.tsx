"use client";

// RECIPE READER MAP
// This file is the actual recipe reading/cooking page.
// It controls language switching, serving-size scaling, ingredient checkboxes, equipment checkboxes, print, and nutrition display.
// If the recipe page looks wrong or you want a new reader feature, this is the file to edit.

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AppIcon from "@/components/AppIcon";
import BadgeChip from "@/components/BadgeChip";
import type { AppLanguage, RecipeAmount, RecipeIngredientGroup, RecipeRecord } from "@/lib/recipe-types";
import {
  getEquipmentLabel,
  getIngredientGroupLabel,
  getIngredientLabel,
  getRecipeDescription,
  getRecipeNotes,
  getRecipeNutritionNote,
  getRecipeStorage,
  getRecipeTips,
  getRecipeTitle,
} from "@/lib/recipe-types";
import {
  buildRecipeHighlights,
  deriveNutritionClaimTags,
  extractLinks,
  getMacroBalance,
  getNutritionHighlights,
  getNutritionItems,
  getRecipeCoverImage,
  hasNotes,
  parseInstructionSections,
} from "@/lib/recipe-view";
import { calculateHealthScore, normalizeRecipeIngredientOntology } from "@/lib/ingredient-ontology";
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
  const recipeNotes = getRecipeNotes(recipe, lang);
  const recipeTips = getRecipeTips(recipe, lang);
  const recipeStorage = getRecipeStorage(recipe, lang);
  const recipeNutritionNote = getRecipeNutritionNote(recipe, lang);
  const recipeSections = parseInstructionSections(recipe, lang);
  const ingredientGroups: RecipeIngredientGroup[] = useMemo(() => recipe.ingredients ?? [], [recipe.ingredients]);
  const recipeLinks = extractLinks(recipe);
  const highlights = buildRecipeHighlights(recipe, lang);
  const faqItems = recipe.faq ?? [];
  const troubleshootingItems = recipe.troubleshooting ?? [];
  const stepPhotos = recipe.step_photos ?? [];
  const coverImage = getRecipeCoverImage(recipe);
  const displayBadges = [...new Set([...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")])];
  const nutritionItems = getNutritionItems(recipe, lang);
  const macroBalance = getMacroBalance(recipe);
  const nutritionHighlights = getNutritionHighlights(recipe, lang);
  const healthScore = calculateHealthScore(recipe.nutrition ?? null);
  const allIngredientItems = (recipe.ingredients ?? []).flatMap((g) => g.items);
  const nutritionMeta = deriveNutritionMeta(allIngredientItems);
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

      {/* Jump links make longer recipes feel closer to the reference food sites. */}
      <div className="card card-accent" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 8 }}>{lang === "de" ? "Springe zu" : "Jump To"}</h3>
        <div className="section-link-grid">
          <a className="button" href="#ingredients">
            <AppIcon name="recipe" size={16} />
            {lang === "de" ? "Zutaten" : "Ingredients"}
          </a>
          {recipe.equipment && recipe.equipment.length > 0 ? (
            <a className="button" href="#equipment">
              <AppIcon name="onepot" size={16} />
              {lang === "de" ? "Equipment" : "Equipment"}
            </a>
          ) : null}
          <a className="button" href="#instructions">
            <AppIcon name="book" size={16} />
            {lang === "de" ? "Anleitung" : "Instructions"}
          </a>
          {hasNotes(recipe, lang) ? (
            <a className="button" href="#notes">
              {lang === "de" ? "Notizen" : "Notes"}
            </a>
          ) : null}
          {recipeTips ? (
            <a className="button" href="#tips">
              {lang === "de" ? "Tipps" : "Tips"}
            </a>
          ) : null}
          {recipeStorage ? (
            <a className="button" href="#storage">
              {lang === "de" ? "Aufbewahrung" : "Storage"}
            </a>
          ) : null}
          {faqItems.length > 0 ? (
            <a className="button" href="#faq">
              FAQ
            </a>
          ) : null}
          {troubleshootingItems.length > 0 ? (
            <a className="button" href="#troubleshooting">
              {lang === "de" ? "Fehlersuche" : "Troubleshooting"}
            </a>
          ) : null}
          {stepPhotos.length > 0 ? (
            <a className="button" href="#step-photos">
              {lang === "de" ? "Schrittfotos" : "Step Photos"}
            </a>
          ) : null}
          {recipeLinks.length > 0 ? (
            <a className="button" href="#links">
              {lang === "de" ? "Links" : "Links"}
            </a>
          ) : null}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 8 }}>{lang === "de" ? "Portionen" : "Servings"}</h3>

        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button
            type="button"
            className="button"
            onClick={() => setMultiplier((m) => Math.max(0.25, parseFloat((m - 0.25).toFixed(2))))}
            aria-label="Decrease multiplier"
            style={{ padding: "4px 10px", fontSize: 16, lineHeight: 1 }}
          >−</button>
          <input
            type="number"
            min={0.25}
            max={10}
            step={0.25}
            value={multiplier}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              if (!isNaN(v) && v >= 0.25 && v <= 10) setMultiplier(v);
            }}
            aria-label="Serving multiplier"
            style={{
              width: 60, textAlign: "center", fontSize: 14,
              border: "1px solid var(--border)", borderRadius: 8,
              background: "var(--surface)", color: "var(--foreground)",
              padding: "4px 6px",
            }}
          />
          <span style={{ fontSize: 13, color: "var(--muted)" }}>×</span>
          <button
            type="button"
            className="button"
            onClick={() => setMultiplier((m) => Math.min(10, parseFloat((m + 0.25).toFixed(2))))}
            aria-label="Increase multiplier"
            style={{ padding: "4px 10px", fontSize: 16, lineHeight: 1 }}
          >+</button>
        </div>
        <p style={{ marginTop: 10, marginBottom: 0 }}>
          {lang === "de" ? "Mengen skalieren sauber von der Basisportion." : "Amounts scale cleanly from the base serving size."}
        </p>
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
            <h3>{lang === "de" ? "Zutaten" : "Ingredients"}</h3>

            {ingredientGroups.map((group, groupIndex) => (
              <div key={ingredientGroupId(recipe.id, group.group_en, groupIndex)} style={{ marginBottom: 16 }}>
                <h4 style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{getIngredientGroupLabel(group, lang)}</h4>

                {group.items.map((ingredient, ingredientIndex) => {
                  const itemId = ingredientRowId(recipe.id, group.group_en, getIngredientLabel(ingredient, lang), ingredientIndex);
                  const isChecked = checked.includes(itemId);
                  const baseAmount = parseAmount(ingredient.amount);
                  const scaledAmount = baseAmount === null ? null : baseAmount * multiplier;
                  const isToTaste = ingredient.isToTaste || ingredient.unit === "to taste";
                  const amountLabel = scaledAmount === null || isToTaste ? "" : formatAmount(scaledAmount);
                  const ontology = normalizeRecipeIngredientOntology(ingredient);

                  return (
                    <button key={itemId} type="button" onClick={() => toggleCheck(itemId)} className="check-row" aria-pressed={isChecked} style={{ opacity: isChecked ? 0.55 : 1 }}>
                      <span className={isChecked ? "checkmark-box checked" : "checkmark-box"}>{isChecked ? "✓" : ""}</span>
                      <span style={{ textDecoration: isChecked ? "line-through" : "none" }}>
                        {amountLabel}
                        {ingredient.unit && ingredient.unit !== "whole" && ingredient.unit !== "clove" ? ` ${ingredient.unit === "ml" ? "mL" : ingredient.unit === "l" ? "L" : ingredient.unit}` : ""}
                        {getIngredientLabel(ingredient, lang) ? ` ${getIngredientLabel(ingredient, lang)}` : ""}
                        {ingredient.preparation ? `, ${ingredient.preparation}` : ""}
                        {ingredient.optional ? " (optional)" : ""}
                        {ingredient.garnish ? " (garnish)" : ""}
                      </span>
                      {(() => {
                        const w = ontology.estimatedWeightGrams;
                        const conf = ontology.weightConfidence;
                        if (!w || w <= 0) return conf === 'unknown' ? (
                          <span className="ingredient-weight" style={{ color: 'var(--muted)', opacity: 0.5 }}>?</span>
                        ) : null;
                        const prefix = conf === 'exact' ? '' : conf === 'measured' ? '~' : '≈';
                        const color = conf === 'estimated' ? '#b45309' : conf === 'unknown' ? '#dc2626' : 'inherit';
                        return (
                          <span className="ingredient-weight" style={{ color }}>{prefix}{w}g est.</span>
                        );
                      })()}
                      {ingredient.note && (
                        <span className="text-xs italic" style={{ color: 'var(--muted)' }}> ({ingredient.note})</span>
                      )}
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

          {recipeSections.map((section, sectionIndex) => (
            <div key={stableCompositeId(recipe.id, "section", section.title, sectionIndex)} style={{ marginBottom: 16 }}>
              {section.title && recipeSections.length > 1 ? <h4 style={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>{section.title}</h4> : null}
              <ol className="instruction-list">
                {section.steps.map((step, index) => (
                  <li key={cookingStepId(recipe.id, section.title, step, index)} className={allSteps[activeStep]?.step === step ? "active-step" : ""} style={{ listStyle: "decimal" }}>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      </div>

      {stepPhotos.length > 0 ? (
        <div id="step-photos" className="card" style={{ marginBottom: 20 }}>
          <h3>{lang === "de" ? "Schritt-fur-Schritt Fotos" : "Step-by-Step Photos"}</h3>
          <div className="photo-grid">
            {stepPhotos.map((item, index) => (
              <div key={stableCompositeId(recipe.id, "step-photo", item.image_url, item.step_number, index)}>
                <Image
                  src={item.image_url}
                  alt={`${recipeTitle} step ${item.step_number || index + 1}`}
                  className="recipe-photo"
                  width={1200}
                  height={800}
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                />
                <p style={{ marginTop: 8, marginBottom: 0 }}>
                  {item.step_number ? `${lang === "de" ? "Schritt" : "Step"} ${item.step_number}: ` : ""}
                  {lang === "de" ? item.caption_de || item.caption_en : item.caption_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {recipeTips ? (
        <div id="tips" className="card" style={{ marginBottom: 20 }}>
          <h3>{lang === "de" ? "Tipps und Tricks" : "Tips and Tricks"}</h3>
          <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{recipeTips}</p>
        </div>
      ) : null}

      {recipeStorage ? (
        <div id="storage" className="card" style={{ marginBottom: 20 }}>
          <h3>{lang === "de" ? "Aufbewahrung" : "Storage"}</h3>
          <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{recipeStorage}</p>
        </div>
      ) : null}

      {faqItems.length > 0 ? (
        <div id="faq" className="card" style={{ marginBottom: 20 }}>
          <h3>FAQ</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqItems.map((item, index) => (
              <div key={stableCompositeId(recipe.id, "faq", item.question_en, index)}>
                <h4 style={{ marginBottom: 6 }}>{lang === "de" ? item.question_de || item.question_en : item.question_en}</h4>
                <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
                  {lang === "de" ? item.answer_de || item.answer_en : item.answer_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {troubleshootingItems.length > 0 ? (
        <div id="troubleshooting" className="card" style={{ marginBottom: 20 }}>
          <h3>{lang === "de" ? "Fehlersuche" : "Troubleshooting"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {troubleshootingItems.map((item, index) => (
              <div key={stableCompositeId(recipe.id, "troubleshooting", item.issue_en, index)}>
                <h4 style={{ marginBottom: 6 }}>{lang === "de" ? item.issue_de || item.issue_en : item.issue_en}</h4>
                <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>
                  {lang === "de" ? item.fix_de || item.fix_en : item.fix_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {recipeNotes ? (
        <div id="notes" className="card" style={{ marginBottom: 20 }}>
          <h3>{lang === "de" ? "Notizen" : "Notes"}</h3>
          <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{recipeNotes}</p>
        </div>
      ) : null}

      {recipeLinks.length > 0 ? (
        <div id="links" className="card">
          <h3>{lang === "de" ? "Links" : "Links"}</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recipeLinks.map((link) => (
              <a key={link} href={link} target="_blank" rel="noreferrer">
                {link}
              </a>
            ))}
          </div>
        </div>
      ) : null}


      <div className="card nutrition-panel" style={{ marginTop: 20 }}>
        <div className="nutrition-panel-header">
          <div>
            <h3 style={{ marginBottom: 8 }}>{lang === "de" ? "Nahrwerte" : "Nutrition Facts"}</h3>
            <p style={{ marginBottom: 0 }}>
              {lang === "de"
                ? "Die Nahrwerte werden fur dieses Rezept manuell eingetragen und pro Portion angezeigt."
                : "Nutrition values are entered manually for this recipe and shown per serving."}
            </p>
          </div>
          <button className="button button-primary" type="button" onClick={() => setShowNutrition((current) => !current)}>
            <AppIcon name="protein" size={16} />
            {lang === "de" ? (showNutrition ? "Nahrwerte ausblenden" : "Nahrwerte anzeigen") : showNutrition ? "Hide Nutrition" : "Show Nutrition"}
          </button>
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
