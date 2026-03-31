"use client";

import type { FormEvent } from "react";
import type { EquipmentDraft, IngredientDraft, IngredientGroupDraft } from "@/lib/recipe-types";

type RecipeFormProps = {
  title: string;
  titleDe: string;
  authorName: string;
  learnedFrom: string;
  descriptionEn: string;
  descriptionDe: string;
  category: string;
  tags: string;
  ingredientGroups: IngredientGroupDraft[];
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
  onIngredientGroupAdd: () => void;
  onIngredientGroupRemove: (groupIndex: number) => void;
  onIngredientGroupChange: (groupIndex: number, field: keyof Omit<IngredientGroupDraft, "items">, value: string) => void;
  onIngredientAdd: (groupIndex: number) => void;
  onIngredientRemove: (groupIndex: number, ingredientIndex: number) => void;
  onIngredientChange: (groupIndex: number, ingredientIndex: number, field: keyof IngredientDraft, value: string) => void;
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
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <div>
            <h3 style={{ marginBottom: 8 }}>Ingredient Sections</h3>
            <p style={{ marginBottom: 0 }}>Use as many sections as you want: dough, filling, tempering, garnish, and so on.</p>
          </div>
          <button className="button" type="button" onClick={props.onIngredientGroupAdd}>
            + Add Section
          </button>
        </div>

        {props.ingredientGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="card" style={{ marginBottom: 12, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 10 }}>
              <input
                className="input"
                value={group.group_en}
                onChange={(event) => props.onIngredientGroupChange(groupIndex, "group_en", event.target.value)}
                placeholder="Section title (EN)"
              />
              <input
                className="input"
                value={group.group_de}
                onChange={(event) => props.onIngredientGroupChange(groupIndex, "group_de", event.target.value)}
                placeholder="Section title (DE)"
              />
              <button className="button" type="button" onClick={() => props.onIngredientGroupRemove(groupIndex)}>
                Remove Section
              </button>
            </div>

            {group.items.map((ingredient, ingredientIndex) => (
              <div
                key={`ingredient-${groupIndex}-${ingredientIndex}`}
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
                  onChange={(event) => props.onIngredientChange(groupIndex, ingredientIndex, "amount", event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Unit"
                  value={ingredient.unit}
                  onChange={(event) => props.onIngredientChange(groupIndex, ingredientIndex, "unit", event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Ingredient (EN)"
                  value={ingredient.name_en}
                  onChange={(event) => props.onIngredientChange(groupIndex, ingredientIndex, "name_en", event.target.value)}
                />
                <input
                  className="input"
                  placeholder="Ingredient (DE)"
                  value={ingredient.name_de}
                  onChange={(event) => props.onIngredientChange(groupIndex, ingredientIndex, "name_de", event.target.value)}
                />
                <button className="button" type="button" onClick={() => props.onIngredientRemove(groupIndex, ingredientIndex)}>
                  Remove
                </button>
              </div>
            ))}

            <button className="button" type="button" onClick={() => props.onIngredientAdd(groupIndex)}>
              + Add Ingredient
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Instructions</h3>
        <p style={{ marginBottom: 12 }}>Write normal numbered instructions. One step per line is fine.</p>
        <textarea className="input" value={props.steps} onChange={(event) => props.onStepsChange(event.target.value)} placeholder={"1. Prep ingredients\n2. Cook gently\n3. Finish and serve"} />
        <textarea className="input" value={props.stepsDe} onChange={(event) => props.onStepsDeChange(event.target.value)} placeholder="1. Zutaten vorbereiten\n2. Sanft kochen\n3. Fertig servieren" />
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
      <textarea className="input" value={props.imageUrls} onChange={(event) => props.onImageUrlsChange(event.target.value)} placeholder={"Photo URLs (one per line)\nhttps://..."} />

      <button className="button button-primary" type="submit" disabled={props.saving}>
        {props.saving ? "Saving..." : props.submitLabel}
      </button>
    </form>
  );
}
