"use client";

import Image from "next/image";
import { useState } from "react";
import type { AppLanguage, RecipeAmount, RecipeIngredientGroup, RecipeRecord } from "@/lib/recipe-types";
import {
  getBadgeLabel,
  getEquipmentLabel,
  getIngredientGroupLabel,
  getIngredientLabel,
  getRecipeCourse,
  getRecipeCuisine,
  getRecipeDescription,
  getRecipeDifficulty,
  getRecipeNotes,
  getRecipeNutritionNote,
  getRecipeStorage,
  getRecipeTips,
  getRecipeTitle,
} from "@/lib/recipe-types";
import { buildRecipeHighlights, deriveNutritionClaimTags, extractLinks, getRecipeCoverImage, hasNotes, parseInstructionSections } from "@/lib/recipe-view";

type RecipeClientProps = {
  recipe: RecipeRecord;
};

export default function RecipeClient({ recipe }: RecipeClientProps) {
  // These local UI states are purely for the reader experience and are not persisted to the database.
  const [multiplier, setMultiplier] = useState(1);
  const [checked, setChecked] = useState<string[]>([]);
  const [checkedEquipment, setCheckedEquipment] = useState<string[]>([]);
  const [lang, setLang] = useState<AppLanguage>("en");
  const [showNutrition, setShowNutrition] = useState(false);

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
  const recipeNutritionNote = getRecipeNutritionNote(recipe, lang);
  const recipeSections = parseInstructionSections(recipe, lang);
  const ingredientGroups: RecipeIngredientGroup[] = recipe.ingredients ?? [];
  const recipeLinks = extractLinks(recipe);
  const highlights = buildRecipeHighlights(recipe, lang);
  const faqItems = recipe.faq ?? [];
  const troubleshootingItems = recipe.troubleshooting ?? [];
  const stepPhotos = recipe.step_photos ?? [];
  const coverImage = getRecipeCoverImage(recipe);
  const galleryImages = recipe.image_urls.filter((imageUrl) => imageUrl !== coverImage);
  const displayBadges = [...new Set([...recipe.badges, ...deriveNutritionClaimTags(recipe, "en")])];

  const handlePrint = () => {
    window.print();
  };

  const nutritionItems = recipe.nutrition
    ? [
        { label_en: "Calories", label_de: "Kalorien", value: recipe.nutrition.calories_kcal, unit: "kcal" },
        { label_en: "Fat", label_de: "Fett", value: recipe.nutrition.fat_g, unit: "g" },
        { label_en: "Saturated Fat", label_de: "Gesattigte Fettsauren", value: recipe.nutrition.saturated_fat_g, unit: "g" },
        { label_en: "Carbohydrates", label_de: "Kohlenhydrate", value: recipe.nutrition.carbs_g, unit: "g" },
        { label_en: "Fiber", label_de: "Ballaststoffe", value: recipe.nutrition.fiber_g, unit: "g" },
        { label_en: "Sugar", label_de: "Zucker", value: recipe.nutrition.sugar_g, unit: "g" },
        { label_en: "Protein", label_de: "Protein", value: recipe.nutrition.protein_g, unit: "g" },
        { label_en: "Sodium", label_de: "Natrium", value: recipe.nutrition.sodium_mg, unit: "mg" },
        { label_en: "Cholesterol", label_de: "Cholesterin", value: recipe.nutrition.cholesterol_mg, unit: "mg" },
        { label_en: "Potassium", label_de: "Kalium", value: recipe.nutrition.potassium_mg, unit: "mg" },
        { label_en: "Calcium", label_de: "Kalzium", value: recipe.nutrition.calcium_mg, unit: "mg" },
        { label_en: "Iron", label_de: "Eisen", value: recipe.nutrition.iron_mg, unit: "mg" },
        { label_en: "Magnesium", label_de: "Magnesium", value: recipe.nutrition.magnesium_mg, unit: "mg" },
        { label_en: "Phosphorus", label_de: "Phosphor", value: recipe.nutrition.phosphorus_mg, unit: "mg" },
        { label_en: "Zinc", label_de: "Zink", value: recipe.nutrition.zinc_mg, unit: "mg" },
        { label_en: "Vitamin A", label_de: "Vitamin A", value: recipe.nutrition.vitamin_a_mcg, unit: "mcg" },
        { label_en: "Vitamin C", label_de: "Vitamin C", value: recipe.nutrition.vitamin_c_mg, unit: "mg" },
        { label_en: "Vitamin D", label_de: "Vitamin D", value: recipe.nutrition.vitamin_d_mcg, unit: "mcg" },
        { label_en: "Vitamin E", label_de: "Vitamin E", value: recipe.nutrition.vitamin_e_mg, unit: "mg" },
        { label_en: "Vitamin K", label_de: "Vitamin K", value: recipe.nutrition.vitamin_k_mcg, unit: "mcg" },
        { label_en: "Vitamin B6", label_de: "Vitamin B6", value: recipe.nutrition.vitamin_b6_mg, unit: "mg" },
        { label_en: "Vitamin B12", label_de: "Vitamin B12", value: recipe.nutrition.vitamin_b12_mcg, unit: "mcg" },
        { label_en: "Folate", label_de: "Folat", value: recipe.nutrition.folate_mcg, unit: "mcg" },
      ].filter((item) => item.value.trim())
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
          flexWrap: "wrap",
        }}
      >
        <div style={{ flex: "1 1 0", minWidth: 0 }}>
          <h1>{recipeTitle}</h1>
          <p style={{ marginBottom: 0 }}>{recipe.category || "Uncategorized"}</p>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            By {recipe.author_name || "Atthuzhai"}
            {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
          </p>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            {[getRecipeCuisine(recipe, lang), getRecipeCourse(recipe, lang), getRecipeDifficulty(recipe, lang)].filter(Boolean).join(" • ")}
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

      {coverImage ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <Image src={coverImage} alt={`${recipeTitle} cover`} className="recipe-cover-photo" width={1600} height={1000} />
        </div>
      ) : null}

      {recipeDescription ? (
        <div className="card" style={{ marginBottom: 20 }}>
          <h3 style={{ marginBottom: 8 }}>{lang === "de" ? "Beschreibung" : "Description"}</h3>
          <p style={{ marginBottom: 0 }}>{recipeDescription}</p>
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

      {displayBadges.length > 0 ? (
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
          {displayBadges.map((badge) => (
            <span key={badge} className="chip">
              {getBadgeLabel(badge, lang)}
            </span>
          ))}
        </div>
      ) : null}

      {recipe.tags.length > 0 ? (
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 20 }}>
          {recipe.tags.map((tag) => (
            <span key={`${recipe.id}-${tag}`} className="chip">
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      {/* Jump links make longer recipes feel closer to the reference food sites. */}
      <div className="card" style={{ marginBottom: 20 }}>
        <h3 style={{ marginBottom: 8 }}>{lang === "de" ? "Springe zu" : "Jump To"}</h3>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <a className="button" href="#ingredients">
            {lang === "de" ? "Zutaten" : "Ingredients"}
          </a>
          {recipe.equipment && recipe.equipment.length > 0 ? (
            <a className="button" href="#equipment">
              {lang === "de" ? "Equipment" : "Equipment"}
            </a>
          ) : null}
          <a className="button" href="#instructions">
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
          {galleryImages.length > 0 ? (
            <a className="button" href="#photos">
              {lang === "de" ? "Fotos" : "Photos"}
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
        <p>{lang === "de" ? "Portionen" : "Servings"}</p>

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
        <h3>{lang === "de" ? "Zutaten" : "Ingredients"}</h3>

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
        <div id="equipment" className="card" style={{ marginBottom: 20 }}>
          <h3>{lang === "de" ? "Equipment" : "Equipment"}</h3>
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

      <div id="instructions" className="card" style={{ marginBottom: 20 }}>
        <h3>{lang === "de" ? "Anleitung" : "Instructions"}</h3>

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
          <h3>{lang === "de" ? "Schritt-fur-Schritt Fotos" : "Step-by-Step Photos"}</h3>
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
          <h3>{lang === "de" ? "Fehlersuche" : "Troubleshooting"}</h3>
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
        <div id="notes" className="card" style={{ marginBottom: 20 }}>
          <h3>{lang === "de" ? "Notizen" : "Notes"}</h3>
          <p style={{ marginBottom: 0, whiteSpace: "pre-wrap" }}>{recipeNotes}</p>
        </div>
      ) : null}

      {galleryImages.length > 0 ? (
        <div id="photos" className="card" style={{ marginBottom: 20 }}>
          <h3>{lang === "de" ? "Weitere Fotos" : "More Photos"}</h3>
          <div className="photo-grid">
            {galleryImages.map((imageUrl, index) => (
              <Image key={`${imageUrl}-${index}`} src={imageUrl} alt={`${recipeTitle} photo ${index + 1}`} className="recipe-photo" width={1200} height={800} />
            ))}
          </div>
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

      <div className="card" style={{ marginTop: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <h3 style={{ marginBottom: 8 }}>{lang === "de" ? "Nahrwerte" : "Nutrition Facts"}</h3>
            <p style={{ marginBottom: 0 }}>
              {lang === "de"
                ? "Die Nahrwerte werden fur dieses Rezept manuell eingetragen und pro Portion angezeigt."
                : "Nutrition values are entered manually for this recipe and shown per serving."}
            </p>
          </div>
          <button className="button button-primary" type="button" onClick={() => setShowNutrition((current) => !current)}>
            {lang === "de" ? (showNutrition ? "Nahrwerte ausblenden" : "Nahrwerte anzeigen") : showNutrition ? "Hide Nutrition" : "Show Nutrition"}
          </button>
        </div>

        {showNutrition ? (
          <div style={{ marginTop: 16 }}>
            {recipe.nutrition ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <p style={{ marginBottom: 0 }}>
                  {lang === "de"
                    ? `Pro Portion, basierend auf ${recipe.servings || 1} Portion${recipe.servings === 1 ? "" : "en"}.`
                    : `Per serving, based on ${recipe.servings || 1} serving${recipe.servings === 1 ? "" : "s"}.`}
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
                  {nutritionItems.map((item) => (
                    <div key={item.label_en} className="chip" style={{ justifyContent: "space-between" }}>
                      <span>{lang === "de" ? item.label_de : item.label_en}</span>
                      <strong>
                        {item.value}
                        {item.unit ? ` ${item.unit}` : ""}
                      </strong>
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
