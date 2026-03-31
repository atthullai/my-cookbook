"use client";

import Image from "next/image";
import { useState } from "react";
import type { AppLanguage, RecipeAmount, RecipeIngredientGroup, RecipeRecord } from "@/lib/recipe-types";
import {
  getEquipmentLabel,
  getRecipeStorage,
  getIngredientGroupLabel,
  getIngredientLabel,
  getRecipeDescription,
  getRecipeNotes,
  getRecipeSteps,
  getRecipeTips,
  getRecipeTitle,
} from "@/lib/recipe-types";
import { buildRecipeHighlights, extractLinks, hasNotes, parseInstructionSections } from "@/lib/recipe-view";

type RecipeClientProps = {
  recipe: RecipeRecord;
};

type NutritionApiResponse = {
  calories: number;
  totalWeight: number;
  yield: number;
  dietLabels: string[];
  healthLabels: string[];
  totalNutrients: Record<
    string,
    {
      label?: string;
      quantity?: number;
      unit?: string;
    }
  >;
};

export default function RecipeClient({ recipe }: RecipeClientProps) {
  // These local UI states are purely for the reader experience and are not persisted to the database.
  const [multiplier, setMultiplier] = useState(1);
  const [checked, setChecked] = useState<string[]>([]);
  const [checkedEquipment, setCheckedEquipment] = useState<string[]>([]);
  const [lang, setLang] = useState<AppLanguage>("en");
  const [showNutrition, setShowNutrition] = useState(false);
  const [nutritionLoading, setNutritionLoading] = useState(false);
  const [nutritionError, setNutritionError] = useState("");
  const [nutrition, setNutrition] = useState<NutritionApiResponse | null>(null);

  // Accept strings, numbers, and fractions because stored recipe data may evolve over time.
  const parseAmount = (value: RecipeAmount): number | null => {
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
    if (value === 0.5) return "1/2";
    if (value === 0.25) return "1/4";
    if (value === 0.75) return "3/4";
    return Number(value.toFixed(2)).toString();
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
  const recipeSections = parseInstructionSections(getRecipeSteps(recipe, lang));
  const ingredientGroups: RecipeIngredientGroup[] = recipe.ingredients ?? [];
  const recipeLinks = extractLinks(recipe);
  const highlights = buildRecipeHighlights(recipe);
  const faqItems = recipe.faq ?? [];
  const troubleshootingItems = recipe.troubleshooting ?? [];
  const stepPhotos = recipe.step_photos ?? [];

  const handlePrint = () => {
    window.print();
  };

  const loadNutrition = async () => {
    if (nutrition || nutritionLoading) {
      return;
    }

    setNutritionLoading(true);
    setNutritionError("");

    try {
      const response = await fetch("/api/nutrition", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipe,
        }),
      });

      const data = (await response.json()) as NutritionApiResponse & { error?: string };

      if (!response.ok) {
        setNutritionError(data.error || "Could not calculate nutrition facts.");
        setNutritionLoading(false);
        return;
      }

      setNutrition(data);
    } catch {
      setNutritionError("Could not calculate nutrition facts.");
    }

    setNutritionLoading(false);
  };

  const toggleNutrition = async () => {
    const nextValue = !showNutrition;
    setShowNutrition(nextValue);

    if (nextValue) {
      await loadNutrition();
    }
  };

  const servingsCount = nutrition?.yield || recipe.servings || 1;
  const nutritionItems = nutrition
    ? [
        { key: "ENERC_KCAL", label: "Calories", unit: "kcal" },
        { key: "FAT", label: "Fat", unit: "g" },
        { key: "FASAT", label: "Saturated Fat", unit: "g" },
        { key: "CHOCDF", label: "Carbohydrates", unit: "g" },
        { key: "FIBTG", label: "Fiber", unit: "g" },
        { key: "SUGAR", label: "Sugar", unit: "g" },
        { key: "PROCNT", label: "Protein", unit: "g" },
        { key: "NA", label: "Sodium", unit: "mg" },
      ]
    : [];

  return (
    <div style={{ marginTop: 16 }}>
      {/* Keep header controls together because language and serving size both change the same recipe view. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          marginBottom: 20,
        }}
      >
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          <h1>{recipeTitle}</h1>
          <p style={{ marginBottom: 0 }}>{recipe.category || "Uncategorized"}</p>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            By {recipe.author_name || "Saran"}
            {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", flexShrink: 0, marginLeft: "auto", justifyContent: "flex-end" }}>
          <button className="button" type="button" onClick={handlePrint}>
            Print
          </button>
          <button className="button" type="button" onClick={() => setLang("en")}>
            EN
          </button>
          <button className="button" type="button" onClick={() => setLang("de")}>
            DE
          </button>
        </div>
      </div>

      {recipeDescription ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 8 }}>Description</h3>
          <p style={{ marginBottom: 0 }}>{recipeDescription}</p>
        </div>
      ) : null}

      {/* Photos are optional. If a recipe has none yet, the rest of the page still works cleanly. */}
      {recipe.image_urls && recipe.image_urls.length > 0 ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 10 }}>Photos</h3>
          <div className="photo-grid">
            {recipe.image_urls.map((imageUrl, index) => (
              <Image
                key={`${imageUrl}-${index}`}
                src={imageUrl}
                alt={`${recipeTitle} photo ${index + 1}`}
                className="recipe-photo"
                width={1200}
                height={800}
              />
            ))}
          </div>
        </div>
      ) : null}

      {recipe.video_url ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 8 }}>Video</h3>
          <p style={{ marginBottom: 12 }}>Open the original reel for the source recipe video.</p>
          <a className="button button-primary" href={recipe.video_url} target="_blank" rel="noreferrer">
            Watch Video
          </a>
        </div>
      ) : null}

      {highlights.length > 0 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
          {highlights.map((highlight) => (
            <span key={highlight} className="chip">
              {highlight}
            </span>
          ))}
        </div>
      ) : null}

      {recipe.tags.length > 0 ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {recipe.tags.map((tag) => (
            <span
              key={`${recipe.id}-${tag}`}
              style={{
                fontSize: 12,
                border: "1px solid rgba(89, 58, 34, 0.18)",
                padding: "4px 8px",
                borderRadius: 999,
                background: "rgba(255, 250, 241, 0.8)",
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Jump links make longer recipes feel closer to the reference food sites. */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 8 }}>Jump To</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="button" href="#ingredients">
            Ingredients
          </a>
          {recipe.equipment && recipe.equipment.length > 0 ? (
            <a className="button" href="#equipment">
              Equipment
            </a>
          ) : null}
          <a className="button" href="#instructions">
            Instructions
          </a>
          {hasNotes(recipe, lang) ? (
            <a className="button" href="#notes">
              Notes
            </a>
          ) : null}
          {recipeTips ? (
            <a className="button" href="#tips">
              Tips
            </a>
          ) : null}
          {recipeStorage ? (
            <a className="button" href="#storage">
              Storage
            </a>
          ) : null}
          {faqItems.length > 0 ? (
            <a className="button" href="#faq">
              FAQ
            </a>
          ) : null}
          {troubleshootingItems.length > 0 ? (
            <a className="button" href="#troubleshooting">
              Troubleshooting
            </a>
          ) : null}
          {stepPhotos.length > 0 ? (
            <a className="button" href="#step-photos">
              Step Photos
            </a>
          ) : null}
          {recipeLinks.length > 0 ? (
            <a className="button" href="#links">
              Links
            </a>
          ) : null}
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20 }}>
        <p>Servings</p>

        <div style={{ display: "flex", gap: 8 }}>
          {[0.5, 1, 2].map((value) => (
            <button
              key={value}
              className="button"
              type="button"
              onClick={() => setMultiplier(value)}
              style={{ background: multiplier === value ? "#f0d6c5" : undefined }}
            >
              {value}x
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients and equipment both use checklist-style interactions because they are "work through" sections. */}
      <div id="ingredients" className="card" style={{ marginBottom: 24 }}>
        <h3>Ingredients</h3>

        {ingredientGroups.map((group, groupIndex) => (
          <div key={`${group.group_en}-${groupIndex}`} style={{ marginBottom: 16 }}>
            <h4>{getIngredientGroupLabel(group, lang)}</h4>

            {group.items.map((ingredient, ingredientIndex) => {
              const itemId = `${groupIndex}-${ingredientIndex}`;
              const isChecked = checked.includes(itemId);
              const baseAmount = parseAmount(ingredient.amount);
              const scaledAmount = baseAmount === null ? null : baseAmount * multiplier;
              const amountLabel = scaledAmount === null ? "" : formatAmount(scaledAmount);

              return (
                <div
                  key={itemId}
                  onClick={() => toggleCheck(itemId)}
                  style={{
                    cursor: "pointer",
                    opacity: isChecked ? 0.55 : 1,
                    display: "flex",
                    gap: 8,
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <span>{isChecked ? "☑" : "☐"}</span>
                  <span style={{ textDecoration: isChecked ? "line-through" : "none" }}>
                    {amountLabel}
                    {ingredient.unit ? ` ${ingredient.unit}` : ""}
                    {getIngredientLabel(ingredient, lang) ? ` ${getIngredientLabel(ingredient, lang)}` : ""}
                  </span>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {recipe.equipment && recipe.equipment.length > 0 ? (
        <div id="equipment" className="card" style={{ marginBottom: recipeNotes || recipeLinks.length > 0 ? 20 : 0 }}>
          <h3>Equipment</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recipe.equipment.map((item) => (
              <button
                key={item.label_en}
                type="button"
                onClick={() => toggleEquipmentCheck(item.label_en)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: 0,
                  border: 0,
                  textAlign: "left",
                  cursor: "pointer",
                  color: "inherit",
                }}
              >
                <span>{checkedEquipment.includes(item.label_en) ? "☑" : "☐"}</span>
                <span style={{ textDecoration: checkedEquipment.includes(item.label_en) ? "line-through" : "none" }}>
                  {getEquipmentLabel(item, lang)}
                </span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div id="instructions" className="card" style={{ marginBottom: recipeNotes ? 20 : 0 }}>
        <h3>Instructions</h3>

        {recipeSections.map((section, sectionIndex) => (
          <div key={`${section.title}-${sectionIndex}`} style={{ marginBottom: 16 }}>
            {section.title && recipeSections.length > 1 ? <h4>{section.title}</h4> : null}
            <ol style={{ marginBottom: 0, listStyle: "decimal", paddingLeft: "1.5rem" }}>
              {section.steps.map((step, index) => (
                <li key={`${section.title}-${index}`} style={{ listStyle: "decimal" }}>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        ))}
      </div>

      {stepPhotos.length > 0 ? (
        <div id="step-photos" className="card" style={{ marginBottom: 20 }}>
          <h3>Step-by-Step Photos</h3>
          <div className="photo-grid">
            {stepPhotos.map((item, index) => (
              <div key={`${item.image_url}-${index}`}>
                <Image
                  src={item.image_url}
                  alt={`${recipeTitle} step ${item.step_number || index + 1}`}
                  className="recipe-photo"
                  width={1200}
                  height={800}
                />
                <p style={{ marginTop: 8, marginBottom: 0 }}>
                  {item.step_number ? `Step ${item.step_number}: ` : ""}
                  {lang === "de" ? item.caption_de || item.caption_en : item.caption_en}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {recipeTips ? (
        <div id="tips" className="card" style={{ marginBottom: 20 }}>
          <h3>Tips and Tricks</h3>
          <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{recipeTips}</p>
        </div>
      ) : null}

      {recipeStorage ? (
        <div id="storage" className="card" style={{ marginBottom: 20 }}>
          <h3>Storage</h3>
          <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{recipeStorage}</p>
        </div>
      ) : null}

      {faqItems.length > 0 ? (
        <div id="faq" className="card" style={{ marginBottom: 20 }}>
          <h3>FAQ</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {faqItems.map((item, index) => (
              <div key={`${item.question_en}-${index}`}>
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
          <h3>Troubleshooting</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {troubleshootingItems.map((item, index) => (
              <div key={`${item.issue_en}-${index}`}>
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
        <div id="notes" className="card" style={{ marginBottom: recipeLinks.length > 0 ? 20 : 0 }}>
          <h3>Notes</h3>
          <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{recipeNotes}</p>
        </div>
      ) : null}

      {recipeLinks.length > 0 ? (
        <div id="links" className="card">
          <h3>Links</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {recipeLinks.map((link) => (
              <a key={link} href={link} target="_blank" rel="noreferrer">
                {link}
              </a>
            ))}
          </div>
        </div>
      ) : null}

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ marginBottom: 8 }}>Nutrition Facts</h3>
            <p style={{ marginBottom: 0 }}>
              Calculated from the ingredient list and current servings when nutrition is enabled.
            </p>
          </div>
          <button className="button button-primary" type="button" onClick={() => void toggleNutrition()}>
            {showNutrition ? "Hide Nutrition" : "Show Nutrition"}
          </button>
        </div>

        {showNutrition ? (
          <div style={{ marginTop: 16 }}>
            {nutritionLoading ? <p style={{ marginBottom: 0 }}>Calculating nutrition...</p> : null}
            {nutritionError ? <p style={{ marginBottom: 0 }}>{nutritionError}</p> : null}

            {nutrition ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ marginBottom: 0 }}>
                  Per serving, based on {servingsCount} serving{servingsCount === 1 ? "" : "s"}.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  {nutritionItems.map((item) => {
                    const nutrient = item.key === "ENERC_KCAL" ? null : nutrition.totalNutrients[item.key];
                    const quantity =
                      item.key === "ENERC_KCAL"
                        ? nutrition.calories / servingsCount
                        : (nutrient?.quantity ?? 0) / servingsCount;

                    return (
                      <div key={item.key} className="chip" style={{ justifyContent: "space-between" }}>
                        <span>{item.label}</span>
                        <strong>
                          {Number.isFinite(quantity) ? quantity.toFixed(item.unit === "mg" ? 0 : 1) : "0"}
                          {item.unit ? ` ${item.unit}` : ""}
                        </strong>
                      </div>
                    );
                  })}
                </div>

                {nutrition.dietLabels.length > 0 ? (
                  <div>
                    <h4 style={{ marginBottom: 8 }}>Diet Labels</h4>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {nutrition.dietLabels.map((label) => (
                        <span key={label} className="chip">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {nutrition.healthLabels.length > 0 ? (
                  <div>
                    <h4 style={{ marginBottom: 8 }}>Health Labels</h4>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                      {nutrition.healthLabels.slice(0, 12).map((label) => (
                        <span key={label} className="chip">
                          {label}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
