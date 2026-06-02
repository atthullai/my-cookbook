"use client";

// RECIPE READER MAP
// This file is the actual recipe reading/cooking page.
// It controls language switching, serving-size scaling, ingredient checkboxes, equipment checkboxes, print, and nutrition display.
// If the recipe page looks wrong or you want a new reader feature, this is the file to edit.

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
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

type RecipeClientProps = {
  recipe: RecipeRecord;
};

export default function RecipeClient({ recipe }: RecipeClientProps) {
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
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);
  const [isCookingMode, setIsCookingMode] = useState(false);

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
  const ingredientGroups: RecipeIngredientGroup[] = recipe.ingredients ?? [];
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

  useEffect(() => {
    if (!timerRunning) return;
    const interval = window.setInterval(() => {
      setTimerSeconds((current) => {
        const next = Math.max(0, current - 1);
        if (next === 0) {
          window.setTimeout(() => setTimerRunning(false), 0);
        }
        return next;
      });
    }, 1000);
    return () => window.clearInterval(interval);
  }, [timerRunning]);

  const handlePrint = () => {
    window.print();
  };

  const timerLabel = `${Math.floor(timerSeconds / 60)
    .toString()
    .padStart(2, "0")}:${(timerSeconds % 60).toString().padStart(2, "0")}`;

  return (
    <div className={isCookingMode ? "cooking-mode-shell" : ""} style={{ marginTop: 16 }}>
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
          <button className="button button-primary" type="button" onClick={() => setIsCookingMode((current) => !current)}>
            <AppIcon name="quick" size={16} />
            {isCookingMode ? "Exit Cooking" : "Cooking Mode"}
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
          <button className="button button-soft" type="button" onClick={() => { setTimerSeconds(300); setTimerRunning(true); }}>
            5 min
          </button>
          <button className="button button-soft" type="button" onClick={() => { setTimerSeconds(600); setTimerRunning(true); }}>
            10 min
          </button>
          <button className="button" type="button" onClick={() => setTimerRunning((current) => !current)} disabled={timerSeconds === 0}>
            {timerRunning ? "Pause" : "Start"} {timerLabel}
          </button>
        </div>
      )}

      {isCookingMode && allSteps[activeStep] ? (
        <div className="card cooking-focus-card">
          <p className="eyebrow">{allSteps[activeStep].section}</p>
          <h2>{allSteps[activeStep].step}</h2>
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
                    <button key={itemId} type="button" onClick={() => toggleCheck(itemId)} className="check-row" style={{ opacity: isChecked ? 0.55 : 1 }}>
                      <span className={isChecked ? "checkmark-box checked" : "checkmark-box"}>{isChecked ? "✓" : ""}</span>
                      <span style={{ textDecoration: isChecked ? "line-through" : "none" }}>
                        {amountLabel}
                        {ingredient.unit ? ` ${ingredient.unit}` : ""}
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
    </div>
  );
}
