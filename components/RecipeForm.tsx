"use client";

import type { FormEvent } from "react";
import type { IngredientDraft } from "@/lib/recipe-types";

type RecipeFormProps = {
  title: string;
  titleDe: string;
  category: string;
  tags: string;
  steps: string;
  stepsDe: string;
  ingredients: IngredientDraft[];
  saving: boolean;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (value: string) => void;
  onTitleDeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onStepsChange: (value: string) => void;
  onStepsDeChange: (value: string) => void;
  onIngredientAdd: () => void;
  onIngredientRemove: (index: number) => void;
  onIngredientChange: (index: number, field: keyof IngredientDraft, value: string) => void;
};

export default function RecipeForm({
  title,
  titleDe,
  category,
  tags,
  steps,
  stepsDe,
  ingredients,
  saving,
  submitLabel,
  onSubmit,
  onTitleChange,
  onTitleDeChange,
  onCategoryChange,
  onTagsChange,
  onStepsChange,
  onStepsDeChange,
  onIngredientAdd,
  onIngredientRemove,
  onIngredientChange,
}: RecipeFormProps) {
  return (
    <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
      {/* These core fields form the stable backbone of the recipe record. */}
      <input className="input" value={title} onChange={(event) => onTitleChange(event.target.value)} placeholder="Title (EN)" />

      <input
        className="input"
        value={titleDe}
        onChange={(event) => onTitleDeChange(event.target.value)}
        placeholder="Title (DE)"
      />

      <input
        className="input"
        value={category}
        onChange={(event) => onCategoryChange(event.target.value)}
        placeholder="Category"
      />

      <input
        className="input"
        value={tags}
        onChange={(event) => onTagsChange(event.target.value)}
        placeholder="Tags (comma separated)"
      />

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Ingredients</h3>
        <p style={{ marginBottom: 12 }}>Use one section for now. The data shape already supports multiple ingredient groups later.</p>

        {ingredients.map((ingredient, index) => (
          <div
            key={`ingredient-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 120px minmax(0, 1fr) auto",
              gap: 8,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <input
              className="input"
              placeholder="Amount"
              value={ingredient.amount}
              onChange={(event) => onIngredientChange(index, "amount", event.target.value)}
            />

            <input
              className="input"
              placeholder="Unit"
              value={ingredient.unit}
              onChange={(event) => onIngredientChange(index, "unit", event.target.value)}
            />

            <input
              className="input"
              placeholder="Ingredient"
              value={ingredient.name}
              onChange={(event) => onIngredientChange(index, "name", event.target.value)}
            />

            <button className="button" type="button" onClick={() => onIngredientRemove(index)}>
              Remove
            </button>
          </div>
        ))}

        <button className="button" type="button" onClick={onIngredientAdd}>
          + Add Ingredient
        </button>
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Instructions</h3>
        <p style={{ marginBottom: 12 }}>
          Tip: use `## Dough`, `## Filling`, `## Bake` style headings to create sectioned instructions automatically.
        </p>

        <textarea
          className="input"
          value={steps}
          onChange={(event) => onStepsChange(event.target.value)}
          placeholder={"Steps (EN)\n\n## Dough\n1. Mix ingredients\n2. Rest the dough\n\n## Bake\n1. Preheat oven"}
        />

        <textarea
          className="input"
          value={stepsDe}
          onChange={(event) => onStepsDeChange(event.target.value)}
          placeholder="Steps (DE)"
        />
      </div>

      <button className="button button-primary" type="submit" disabled={saving}>
        {saving ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
