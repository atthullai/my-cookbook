"use client";

import Image from "next/image";
import { useState } from "react";
import type { AppLanguage, RecipeAmount, RecipeIngredientGroup, RecipeRecord } from "@/lib/recipe-types";
import {
  getEquipmentLabel,
  getIngredientGroupLabel,
  getIngredientLabel,
  getRecipeDescription,
  getRecipeNotes,
  getRecipeSteps,
  getRecipeTitle,
} from "@/lib/recipe-types";
import { buildRecipeHighlights, extractLinks, hasNotes, parseInstructionSections } from "@/lib/recipe-view";

type RecipeClientProps = {
  recipe: RecipeRecord;
};

export default function RecipeClient({ recipe }: RecipeClientProps) {
  const [multiplier, setMultiplier] = useState(1);
  const [checked, setChecked] = useState<string[]>([]);
  const [checkedEquipment, setCheckedEquipment] = useState<string[]>([]);
  const [lang, setLang] = useState<AppLanguage>("en");

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

  const recipeTitle = getRecipeTitle(recipe, lang);
  const recipeDescription = getRecipeDescription(recipe, lang);
  const recipeNotes = getRecipeNotes(recipe, lang);
  const recipeSections = parseInstructionSections(getRecipeSteps(recipe, lang));
  const ingredientGroups: RecipeIngredientGroup[] = recipe.ingredients ?? [];
  const recipeLinks = extractLinks(recipe);
  const highlights = buildRecipeHighlights(recipe);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ marginTop: 16 }}>
      {/* Keep header controls together because language and serving size both change the same recipe view. */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 16,
          flexWrap: "wrap",
          marginBottom: 20,
        }}
      >
        <div>
          <h1>{recipeTitle}</h1>
          <p style={{ marginBottom: 0 }}>{recipe.category || "Uncategorized"}</p>
          <p style={{ marginTop: 8, marginBottom: 0 }}>
            By {recipe.author_name || "Saran"}
            {recipe.learned_from ? ` • Learned from ${recipe.learned_from}` : ""}
          </p>
        </div>

        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
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
          <a className="button" href="#instructions">
            Instructions
          </a>
          {hasNotes(recipe, lang) ? (
            <a className="button" href="#notes">
              Notes
            </a>
          ) : null}
          {recipe.equipment && recipe.equipment.length > 0 ? (
            <a className="button" href="#equipment">
              Equipment
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

      <div id="instructions" className="card" style={{ marginBottom: recipeNotes ? 20 : 0 }}>
        <h3>Steps</h3>

        {recipeSections.map((section) => (
          <div key={section.title} style={{ marginBottom: 16 }}>
            <h4>{section.title}</h4>
            <ol style={{ marginBottom: 0 }}>
              {section.steps.map((step, index) => (
                <li key={`${section.title}-${index}`}>{step}</li>
              ))}
            </ol>
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
    </div>
  );
}
