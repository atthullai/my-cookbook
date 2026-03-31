"use client";

import type { FormEvent } from "react";
import type { EquipmentDraft, IngredientDraft } from "@/lib/recipe-types";

type RecipeFormProps = {
  title: string;
  titleDe: string;
  authorName: string;
  learnedFrom: string;
  descriptionEn: string;
  descriptionDe: string;
  category: string;
  tags: string;
  ingredientGroupEn: string;
  ingredientGroupDe: string;
  ingredients: IngredientDraft[];
  steps: string;
  stepsDe: string;
  notesEn: string;
  notesDe: string;
  sourceUrl: string;
  videoUrl: string;
  servings: string;
  equipment: EquipmentDraft[];
  imageUrls: string;
  saving: boolean;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (value: string) => void;
  onTitleDeChange: (value: string) => void;
  onAuthorNameChange: (value: string) => void;
  onLearnedFromChange: (value: string) => void;
  onDescriptionEnChange: (value: string) => void;
  onDescriptionDeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onIngredientGroupEnChange: (value: string) => void;
  onIngredientGroupDeChange: (value: string) => void;
  onIngredientAdd: () => void;
  onIngredientRemove: (index: number) => void;
  onIngredientChange: (index: number, field: keyof IngredientDraft, value: string) => void;
  onStepsChange: (value: string) => void;
  onStepsDeChange: (value: string) => void;
  onNotesEnChange: (value: string) => void;
  onNotesDeChange: (value: string) => void;
  onSourceUrlChange: (value: string) => void;
  onVideoUrlChange: (value: string) => void;
  onServingsChange: (value: string) => void;
  onEquipmentAdd: () => void;
  onEquipmentRemove: (index: number) => void;
  onEquipmentChange: (index: number, field: keyof EquipmentDraft, value: string) => void;
  onImageUrlsChange: (value: string) => void;
};

export default function RecipeForm(props: RecipeFormProps) {
  return (
    <form onSubmit={props.onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
      {/* These top-level fields define who owns the recipe and where it came from. */}
      <input className="input" value={props.title} onChange={(event) => props.onTitleChange(event.target.value)} placeholder="Title (EN)" />
      <input className="input" value={props.titleDe} onChange={(event) => props.onTitleDeChange(event.target.value)} placeholder="Title (DE)" />
      <input className="input" value={props.authorName} onChange={(event) => props.onAuthorNameChange(event.target.value)} placeholder="Author name" />
      <input
        className="input"
        value={props.learnedFrom}
        onChange={(event) => props.onLearnedFromChange(event.target.value)}
        placeholder="Learned from (mom, dad, granny, teacher...)"
      />

      <textarea className="input" value={props.descriptionEn} onChange={(event) => props.onDescriptionEnChange(event.target.value)} placeholder="Description (EN)" />
      <textarea className="input" value={props.descriptionDe} onChange={(event) => props.onDescriptionDeChange(event.target.value)} placeholder="Description (DE)" />

      <input className="input" value={props.category} onChange={(event) => props.onCategoryChange(event.target.value)} placeholder="Category" />
      <input className="input" value={props.tags} onChange={(event) => props.onTagsChange(event.target.value)} placeholder="Tags (comma separated)" />
      <input className="input" value={props.servings} onChange={(event) => props.onServingsChange(event.target.value)} placeholder="Servings" />

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Ingredient Section</h3>
        <p style={{ marginBottom: 12 }}>Everything is bilingual now, so the `DE` button can switch ingredients too.</p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
          <input
            className="input"
            value={props.ingredientGroupEn}
            onChange={(event) => props.onIngredientGroupEnChange(event.target.value)}
            placeholder="Section title (EN)"
          />
          <input
            className="input"
            value={props.ingredientGroupDe}
            onChange={(event) => props.onIngredientGroupDeChange(event.target.value)}
            placeholder="Section title (DE)"
          />
        </div>

        {props.ingredients.map((ingredient, index) => (
          <div
            key={`ingredient-${index}`}
            style={{
              display: "grid",
              gridTemplateColumns: "110px 110px 1fr 1fr auto",
              gap: 8,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <input
              className="input"
              placeholder="Amount"
              value={ingredient.amount}
              onChange={(event) => props.onIngredientChange(index, "amount", event.target.value)}
            />
            <input
              className="input"
              placeholder="Unit"
              value={ingredient.unit}
              onChange={(event) => props.onIngredientChange(index, "unit", event.target.value)}
            />
            <input
              className="input"
              placeholder="Ingredient (EN)"
              value={ingredient.name_en}
              onChange={(event) => props.onIngredientChange(index, "name_en", event.target.value)}
            />
            <input
              className="input"
              placeholder="Ingredient (DE)"
              value={ingredient.name_de}
              onChange={(event) => props.onIngredientChange(index, "name_de", event.target.value)}
            />
            <button className="button" type="button" onClick={() => props.onIngredientRemove(index)}>
              Remove
            </button>
          </div>
        ))}

        <button className="button" type="button" onClick={props.onIngredientAdd}>
          + Add Ingredient
        </button>
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Instructions</h3>
        <p style={{ marginBottom: 12 }}>Use `##` headings to keep long recipes beautifully sectioned.</p>
        <textarea
          className="input"
          value={props.steps}
          onChange={(event) => props.onStepsChange(event.target.value)}
          placeholder={"Steps (EN)\n\n## Base\n1. Prep ingredients\n2. Cook gently"}
        />
        <textarea className="input" value={props.stepsDe} onChange={(event) => props.onStepsDeChange(event.target.value)} placeholder="Steps (DE)" />
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Equipment</h3>
        {props.equipment.map((item, index) => (
          <div key={`equipment-${index}`} style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8 }}>
            <input
              className="input"
              placeholder="Equipment (EN)"
              value={item.label_en}
              onChange={(event) => props.onEquipmentChange(index, "label_en", event.target.value)}
            />
            <input
              className="input"
              placeholder="Equipment (DE)"
              value={item.label_de}
              onChange={(event) => props.onEquipmentChange(index, "label_de", event.target.value)}
            />
            <button className="button" type="button" onClick={() => props.onEquipmentRemove(index)}>
              Remove
            </button>
          </div>
        ))}

        <button className="button" type="button" onClick={props.onEquipmentAdd}>
          + Add Equipment
        </button>
      </div>

      <textarea className="input" value={props.notesEn} onChange={(event) => props.onNotesEnChange(event.target.value)} placeholder="Notes (EN)" />
      <textarea className="input" value={props.notesDe} onChange={(event) => props.onNotesDeChange(event.target.value)} placeholder="Notes (DE)" />

      <input className="input" value={props.sourceUrl} onChange={(event) => props.onSourceUrlChange(event.target.value)} placeholder="Source URL" />
      <input className="input" value={props.videoUrl} onChange={(event) => props.onVideoUrlChange(event.target.value)} placeholder="Video URL" />
      <textarea
        className="input"
        value={props.imageUrls}
        onChange={(event) => props.onImageUrlsChange(event.target.value)}
        placeholder={"Photo URLs (one per line)\nhttps://..."}
      />

      <button className="button button-primary" type="submit" disabled={props.saving}>
        {props.saving ? "Saving..." : props.submitLabel}
      </button>
    </form>
  );
}
