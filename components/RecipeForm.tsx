"use client";

import Image from "next/image";
import type { FormEvent } from "react";
import type {
  EquipmentDraft,
  FaqDraft,
  IngredientDraft,
  IngredientGroupDraft,
  InstructionSectionDraft,
  NutritionDraft,
  StepPhotoDraft,
  TroubleshootingDraft,
} from "@/lib/recipe-types";
import AppIcon from "@/components/AppIcon";
import BadgeChip from "@/components/BadgeChip";
import { BADGE_OPTIONS, DIFFICULTY_OPTIONS } from "@/lib/recipe-types";

// This component is intentionally "dumb": it renders the full recipe editor UI,
// while the pages decide how data is loaded, translated, validated, and saved.
type RecipeFormProps = {
  title: string;
  titleDe: string;
  authorName: string;
  learnedFrom: string;
  descriptionEn: string;
  descriptionDe: string;
  category: string;
  cuisine: string;
  cuisineDe: string;
  course: string;
  courseDe: string;
  difficulty: string;
  difficultyDe: string;
  prepTime: string;
  cookTime: string;
  totalTime: string;
  tags: string;
  badges: string[];
  ingredientGroups: IngredientGroupDraft[];
  instructionSections: InstructionSectionDraft[];
  notesEn: string;
  notesDe: string;
  tipsEn: string;
  tipsDe: string;
  storageEn: string;
  storageDe: string;
  nutrition: NutritionDraft;
  faq: FaqDraft[];
  troubleshooting: TroubleshootingDraft[];
  stepPhotos: StepPhotoDraft[];
  sourceUrl: string;
  videoUrl: string;
  servings: string;
  equipment: EquipmentDraft[];
  imageUrls: string;
  coverImageUrl: string;
  saving: boolean;
  estimatingNutrition: boolean;
  refreshingCoverPhoto: boolean;
  submitLabel: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onTitleChange: (value: string) => void;
  onTitleDeChange: (value: string) => void;
  onAuthorNameChange: (value: string) => void;
  onLearnedFromChange: (value: string) => void;
  onDescriptionEnChange: (value: string) => void;
  onDescriptionDeChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCuisineChange: (value: string) => void;
  onCuisineDeChange: (value: string) => void;
  onCourseChange: (value: string) => void;
  onCourseDeChange: (value: string) => void;
  onDifficultyChange: (value: string) => void;
  onDifficultyDeChange: (value: string) => void;
  onPrepTimeChange: (value: string) => void;
  onCookTimeChange: (value: string) => void;
  onTotalTimeChange: (value: string) => void;
  onTagsChange: (value: string) => void;
  onBadgeToggle: (badge: string) => void;
  onIngredientGroupAdd: () => void;
  onIngredientGroupRemove: (groupIndex: number) => void;
  onIngredientGroupChange: (groupIndex: number, field: keyof Omit<IngredientGroupDraft, "items">, value: string) => void;
  onIngredientAdd: (groupIndex: number) => void;
  onIngredientRemove: (groupIndex: number, ingredientIndex: number) => void;
  onIngredientChange: (groupIndex: number, ingredientIndex: number, field: keyof IngredientDraft, value: string) => void;
  onInstructionSectionAdd: () => void;
  onInstructionSectionRemove: (index: number) => void;
  onInstructionSectionChange: (index: number, field: keyof InstructionSectionDraft, value: string) => void;
  onNotesEnChange: (value: string) => void;
  onNotesDeChange: (value: string) => void;
  onTipsEnChange: (value: string) => void;
  onTipsDeChange: (value: string) => void;
  onStorageEnChange: (value: string) => void;
  onStorageDeChange: (value: string) => void;
  onNutritionChange: (field: keyof NutritionDraft, value: string) => void;
  onFaqAdd: () => void;
  onFaqRemove: (index: number) => void;
  onFaqChange: (index: number, field: keyof FaqDraft, value: string) => void;
  onTroubleshootingAdd: () => void;
  onTroubleshootingRemove: (index: number) => void;
  onTroubleshootingChange: (index: number, field: keyof TroubleshootingDraft, value: string) => void;
  onStepPhotoAdd: () => void;
  onStepPhotoRemove: (index: number) => void;
  onStepPhotoChange: (index: number, field: keyof StepPhotoDraft, value: string) => void;
  onSourceUrlChange: (value: string) => void;
  onVideoUrlChange: (value: string) => void;
  onServingsChange: (value: string) => void;
  onEquipmentAdd: () => void;
  onEquipmentRemove: (index: number) => void;
  onEquipmentChange: (index: number, field: keyof EquipmentDraft, value: string) => void;
  onImageUrlsChange: (value: string) => void;
  onCoverImageUrlChange: (value: string) => void;
  onEstimateNutrition: () => void;
  onUseSourceCoverPhoto: () => void;
};

export default function RecipeForm(props: RecipeFormProps) {
  return (
    <form onSubmit={props.onSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
      {/* Recipe identity and ownership fields sit first because they shape the whole record. */}
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

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 8 }}>
        <input className="input" value={props.category} onChange={(event) => props.onCategoryChange(event.target.value)} placeholder="Category" />
        <input className="input" value={props.cuisine} onChange={(event) => props.onCuisineChange(event.target.value)} placeholder="Cuisine" />
        <input className="input" value={props.cuisineDe} onChange={(event) => props.onCuisineDeChange(event.target.value)} placeholder="Cuisine (DE)" />
        <input className="input" value={props.course} onChange={(event) => props.onCourseChange(event.target.value)} placeholder="Course" />
        <input className="input" value={props.courseDe} onChange={(event) => props.onCourseDeChange(event.target.value)} placeholder="Course (DE)" />
        <select className="input" value={props.difficulty} onChange={(event) => props.onDifficultyChange(event.target.value)}>
          <option value="">Difficulty</option>
          {DIFFICULTY_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <input className="input" value={props.difficultyDe} onChange={(event) => props.onDifficultyDeChange(event.target.value)} placeholder="Difficulty (DE)" />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 8 }}>
        <input className="input" value={props.prepTime} onChange={(event) => props.onPrepTimeChange(event.target.value)} placeholder="Prep time" />
        <input className="input" value={props.cookTime} onChange={(event) => props.onCookTimeChange(event.target.value)} placeholder="Cooking time" />
        <input className="input" value={props.totalTime} onChange={(event) => props.onTotalTimeChange(event.target.value)} placeholder="Total time" />
        <input className="input" value={props.servings} onChange={(event) => props.onServingsChange(event.target.value)} placeholder="Servings" />
      </div>

      <input className="input" value={props.tags} onChange={(event) => props.onTagsChange(event.target.value)} placeholder="Tags (comma separated)" />

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Quick Badge Filters</h3>
        <p style={{ marginBottom: 12 }}>These are the easy filter buttons shown on home and recipe index pages.</p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BADGE_OPTIONS.map((badge) => {
            const isActive = props.badges.includes(badge);

            return (
              <BadgeChip key={badge} badge={badge} lang="en" active={isActive} asButton onClick={() => props.onBadgeToggle(badge)} />
            );
          })}
        </div>
      </div>

      {/* Ingredient sections are nested so the editor matches the structure shown on the recipe page. */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <div>
            <h3 style={{ marginBottom: 8 }}>Ingredient Sections</h3>
            <p style={{ marginBottom: 0 }}>Use as many sections as you want: dough, filling, tempering, garnish, and so on.</p>
          </div>
          <button className="button" type="button" onClick={props.onIngredientGroupAdd}>
            <AppIcon name="add" size={16} />
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
                <AppIcon name="delete" size={16} />
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
                  <AppIcon name="delete" size={16} />
                  Remove
                </button>
              </div>
            ))}

            <button className="button" type="button" onClick={() => props.onIngredientAdd(groupIndex)}>
              <AppIcon name="add" size={16} />
              + Add Ingredient
            </button>
          </div>
        ))}
      </div>

      {/* Instruction sections let you keep main steps, filling steps, garnish steps, and so on clearly separated. */}
      <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <div>
            <h3 style={{ marginBottom: 8 }}>Instruction Sections</h3>
            <p style={{ marginBottom: 0 }}>Create sections like Dough, Filling, Assembly. Inside each section, use one step per line.</p>
          </div>
          <button className="button" type="button" onClick={props.onInstructionSectionAdd}>
            <AppIcon name="add" size={16} />
            + Add Instruction Section
          </button>
        </div>

        {props.instructionSections.map((section, index) => (
          <div key={`instruction-section-${index}`} className="card" style={{ marginBottom: 12, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: 8, marginBottom: 8 }}>
              <input
                className="input"
                value={section.title_en}
                onChange={(event) => props.onInstructionSectionChange(index, "title_en", event.target.value)}
                placeholder="Section title (EN)"
              />
              <input
                className="input"
                value={section.title_de}
                onChange={(event) => props.onInstructionSectionChange(index, "title_de", event.target.value)}
                placeholder="Section title (DE)"
              />
              <button className="button" type="button" onClick={() => props.onInstructionSectionRemove(index)}>
                <AppIcon name="delete" size={16} />
                Remove Section
              </button>
            </div>
            <textarea
              className="input"
              value={section.steps_en}
              onChange={(event) => props.onInstructionSectionChange(index, "steps_en", event.target.value)}
              placeholder={"Step 1 in English\nStep 2 in English\nStep 3 in English"}
            />
            <textarea
              className="input"
              value={section.steps_de}
              onChange={(event) => props.onInstructionSectionChange(index, "steps_de", event.target.value)}
              placeholder={"Schritt 1 auf Deutsch\nSchritt 2 auf Deutsch\nSchritt 3 auf Deutsch"}
            />
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <div>
            <h3 style={{ marginBottom: 8 }}>Step-by-Step Photos</h3>
            <p style={{ marginBottom: 0 }}>Add these manually when you really want process photos. Imported recipes no longer auto-fill them.</p>
          </div>
          <button className="button" type="button" onClick={props.onStepPhotoAdd}>
            <AppIcon name="add" size={16} />
            + Add Step Photo
          </button>
        </div>

        {props.stepPhotos.map((item, index) => (
          <div key={`step-photo-${index}`} className="card" style={{ marginBottom: 12, padding: 16 }}>
            <div style={{ display: "grid", gridTemplateColumns: "110px 1fr auto", gap: 8, marginBottom: 8 }}>
              <input
                className="input"
                value={item.step_number}
                onChange={(event) => props.onStepPhotoChange(index, "step_number", event.target.value)}
                placeholder="Step #"
              />
              <input
                className="input"
                value={item.image_url}
                onChange={(event) => props.onStepPhotoChange(index, "image_url", event.target.value)}
                placeholder="Photo URL"
              />
              <button className="button" type="button" onClick={() => props.onStepPhotoRemove(index)}>
                <AppIcon name="delete" size={16} />
                Remove
              </button>
            </div>
            <input
              className="input"
              value={item.caption_en}
              onChange={(event) => props.onStepPhotoChange(index, "caption_en", event.target.value)}
              placeholder="Caption (EN)"
            />
            <input
              className="input"
              value={item.caption_de}
              onChange={(event) => props.onStepPhotoChange(index, "caption_de", event.target.value)}
              placeholder="Caption (DE)"
            />
          </div>
        ))}
      </div>

      {/* Equipment is bilingual too, which lets the checklist switch cleanly with the language toggle. */}
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
              <AppIcon name="delete" size={16} />
              Remove
            </button>
          </div>
        ))}

        <button className="button" type="button" onClick={props.onEquipmentAdd}>
          <AppIcon name="add" size={16} />
          + Add Equipment
        </button>
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Tips and Tricks</h3>
        <textarea className="input" value={props.tipsEn} onChange={(event) => props.onTipsEnChange(event.target.value)} placeholder="Tips & Tricks (EN)" />
        <textarea className="input" value={props.tipsDe} onChange={(event) => props.onTipsDeChange(event.target.value)} placeholder="Tips & Tricks (DE)" />
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Storage</h3>
        <textarea className="input" value={props.storageEn} onChange={(event) => props.onStorageEnChange(event.target.value)} placeholder="Storage Instructions (EN)" />
        <textarea className="input" value={props.storageDe} onChange={(event) => props.onStorageDeChange(event.target.value)} placeholder="Storage Instructions (DE)" />
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 8 }}>Nutrition Facts</h3>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 12 }}>
          <p style={{ marginBottom: 0 }}>
            Enter per-serving nutrition values manually, or estimate them from the ingredient list. Labels will show in English or German automatically on the recipe page.
          </p>
          <button className="button" type="button" onClick={props.onEstimateNutrition} disabled={props.estimatingNutrition}>
            <AppIcon name="protein" size={16} />
            {props.estimatingNutrition ? "Estimating..." : "Estimate From Ingredients"}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 8 }}>
          <input className="input" value={props.nutrition.calories_kcal} onChange={(event) => props.onNutritionChange("calories_kcal", event.target.value)} placeholder="Calories (kcal)" />
          <input className="input" value={props.nutrition.fat_g} onChange={(event) => props.onNutritionChange("fat_g", event.target.value)} placeholder="Fat (g)" />
          <input className="input" value={props.nutrition.saturated_fat_g} onChange={(event) => props.onNutritionChange("saturated_fat_g", event.target.value)} placeholder="Saturated Fat (g)" />
          <input className="input" value={props.nutrition.carbs_g} onChange={(event) => props.onNutritionChange("carbs_g", event.target.value)} placeholder="Carbs (g)" />
          <input className="input" value={props.nutrition.fiber_g} onChange={(event) => props.onNutritionChange("fiber_g", event.target.value)} placeholder="Fiber (g)" />
          <input className="input" value={props.nutrition.sugar_g} onChange={(event) => props.onNutritionChange("sugar_g", event.target.value)} placeholder="Sugar (g)" />
          <input className="input" value={props.nutrition.protein_g} onChange={(event) => props.onNutritionChange("protein_g", event.target.value)} placeholder="Protein (g)" />
          <input className="input" value={props.nutrition.sodium_mg} onChange={(event) => props.onNutritionChange("sodium_mg", event.target.value)} placeholder="Sodium (mg)" />
          <input className="input" value={props.nutrition.cholesterol_mg} onChange={(event) => props.onNutritionChange("cholesterol_mg", event.target.value)} placeholder="Cholesterol (mg)" />
          <input className="input" value={props.nutrition.potassium_mg} onChange={(event) => props.onNutritionChange("potassium_mg", event.target.value)} placeholder="Potassium (mg)" />
          <input className="input" value={props.nutrition.calcium_mg} onChange={(event) => props.onNutritionChange("calcium_mg", event.target.value)} placeholder="Calcium (mg)" />
          <input className="input" value={props.nutrition.iron_mg} onChange={(event) => props.onNutritionChange("iron_mg", event.target.value)} placeholder="Iron (mg)" />
          <input className="input" value={props.nutrition.magnesium_mg} onChange={(event) => props.onNutritionChange("magnesium_mg", event.target.value)} placeholder="Magnesium (mg)" />
          <input className="input" value={props.nutrition.phosphorus_mg} onChange={(event) => props.onNutritionChange("phosphorus_mg", event.target.value)} placeholder="Phosphorus (mg)" />
          <input className="input" value={props.nutrition.zinc_mg} onChange={(event) => props.onNutritionChange("zinc_mg", event.target.value)} placeholder="Zinc (mg)" />
          <input className="input" value={props.nutrition.vitamin_a_mcg} onChange={(event) => props.onNutritionChange("vitamin_a_mcg", event.target.value)} placeholder="Vitamin A (mcg)" />
          <input className="input" value={props.nutrition.vitamin_c_mg} onChange={(event) => props.onNutritionChange("vitamin_c_mg", event.target.value)} placeholder="Vitamin C (mg)" />
          <input className="input" value={props.nutrition.vitamin_d_mcg} onChange={(event) => props.onNutritionChange("vitamin_d_mcg", event.target.value)} placeholder="Vitamin D (mcg)" />
          <input className="input" value={props.nutrition.vitamin_e_mg} onChange={(event) => props.onNutritionChange("vitamin_e_mg", event.target.value)} placeholder="Vitamin E (mg)" />
          <input className="input" value={props.nutrition.vitamin_k_mcg} onChange={(event) => props.onNutritionChange("vitamin_k_mcg", event.target.value)} placeholder="Vitamin K (mcg)" />
          <input className="input" value={props.nutrition.vitamin_b6_mg} onChange={(event) => props.onNutritionChange("vitamin_b6_mg", event.target.value)} placeholder="Vitamin B6 (mg)" />
          <input className="input" value={props.nutrition.vitamin_b12_mcg} onChange={(event) => props.onNutritionChange("vitamin_b12_mcg", event.target.value)} placeholder="Vitamin B12 (mcg)" />
          <input className="input" value={props.nutrition.folate_mcg} onChange={(event) => props.onNutritionChange("folate_mcg", event.target.value)} placeholder="Folate (mcg)" />
        </div>
        <textarea className="input" value={props.nutrition.note_en} onChange={(event) => props.onNutritionChange("note_en", event.target.value)} placeholder="Nutrition note (EN)" />
        <textarea className="input" value={props.nutrition.note_de} onChange={(event) => props.onNutritionChange("note_de", event.target.value)} placeholder="Nutrition note (DE)" />
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <div>
            <h3 style={{ marginBottom: 8 }}>FAQ</h3>
            <p style={{ marginBottom: 0 }}>Add common questions and answers for the recipe.</p>
          </div>
          <button className="button" type="button" onClick={props.onFaqAdd}>
            <AppIcon name="add" size={16} />
            + Add FAQ
          </button>
        </div>

        {props.faq.map((item, index) => (
          <div key={`faq-${index}`} className="card" style={{ marginBottom: 12, padding: 16 }}>
            <input
              className="input"
              value={item.question_en}
              onChange={(event) => props.onFaqChange(index, "question_en", event.target.value)}
              placeholder="Question (EN)"
            />
            <input
              className="input"
              value={item.question_de}
              onChange={(event) => props.onFaqChange(index, "question_de", event.target.value)}
              placeholder="Question (DE)"
            />
            <textarea
              className="input"
              value={item.answer_en}
              onChange={(event) => props.onFaqChange(index, "answer_en", event.target.value)}
              placeholder="Answer (EN)"
            />
            <textarea
              className="input"
              value={item.answer_de}
              onChange={(event) => props.onFaqChange(index, "answer_de", event.target.value)}
              placeholder="Answer (DE)"
            />
            <button className="button" type="button" onClick={() => props.onFaqRemove(index)}>
              <AppIcon name="delete" size={16} />
              Remove FAQ
            </button>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 10 }}>
          <div>
            <h3 style={{ marginBottom: 8 }}>Troubleshooting</h3>
            <p style={{ marginBottom: 0 }}>List common problems and how to fix them.</p>
          </div>
          <button className="button" type="button" onClick={props.onTroubleshootingAdd}>
            <AppIcon name="add" size={16} />
            + Add Issue
          </button>
        </div>

        {props.troubleshooting.map((item, index) => (
          <div key={`troubleshooting-${index}`} className="card" style={{ marginBottom: 12, padding: 16 }}>
            <input
              className="input"
              value={item.issue_en}
              onChange={(event) => props.onTroubleshootingChange(index, "issue_en", event.target.value)}
              placeholder="Problem (EN)"
            />
            <input
              className="input"
              value={item.issue_de}
              onChange={(event) => props.onTroubleshootingChange(index, "issue_de", event.target.value)}
              placeholder="Problem (DE)"
            />
            <textarea
              className="input"
              value={item.fix_en}
              onChange={(event) => props.onTroubleshootingChange(index, "fix_en", event.target.value)}
              placeholder="Fix (EN)"
            />
            <textarea
              className="input"
              value={item.fix_de}
              onChange={(event) => props.onTroubleshootingChange(index, "fix_de", event.target.value)}
              placeholder="Fix (DE)"
            />
            <button className="button" type="button" onClick={() => props.onTroubleshootingRemove(index)}>
              <AppIcon name="delete" size={16} />
              Remove Issue
            </button>
          </div>
        ))}
      </div>

      <textarea className="input" value={props.notesEn} onChange={(event) => props.onNotesEnChange(event.target.value)} placeholder="Notes (EN)" />
      <textarea className="input" value={props.notesDe} onChange={(event) => props.onNotesDeChange(event.target.value)} placeholder="Notes (DE)" />
      <input className="input" value={props.sourceUrl} onChange={(event) => props.onSourceUrlChange(event.target.value)} placeholder="Source URL" />
      <input className="input" value={props.videoUrl} onChange={(event) => props.onVideoUrlChange(event.target.value)} placeholder="Video URL" />
      <div className="card" style={{ marginBottom: 0 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap", marginBottom: 10 }}>
          <div>
            <h3 style={{ marginBottom: 8 }}>Cover Photo</h3>
            <p style={{ marginBottom: 0 }}>Paste an image URL, or use the source page to refill the best recipe cover automatically.</p>
          </div>
          <button className="button" type="button" onClick={props.onUseSourceCoverPhoto} disabled={props.refreshingCoverPhoto}>
            <AppIcon name="recipe" size={16} />
            {props.refreshingCoverPhoto ? "Refreshing Cover..." : "Use Source Cover Photo"}
          </button>
        </div>
        <input className="input" value={props.coverImageUrl} onChange={(event) => props.onCoverImageUrlChange(event.target.value)} placeholder="Cover photo URL" />
        <p style={{ marginTop: 10, marginBottom: 10 }}>
          Tip: on most recipe websites, right-click the photo and choose “Copy Image Address”, then paste it here.
        </p>
        {props.coverImageUrl ? (
          <Image
            src={props.coverImageUrl}
            alt="Cover preview"
            className="recipe-cover-photo"
            width={1200}
            height={800}
            style={{ height: 240, objectFit: "cover" }}
          />
        ) : null}
      </div>

      <button className="button button-primary" type="submit" disabled={props.saving}>
        <AppIcon name="recipe" size={16} />
        {props.saving ? "Saving..." : props.submitLabel}
      </button>
    </form>
  );
}
