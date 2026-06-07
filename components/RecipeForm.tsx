"use client";

// RECIPE FORM MAP
// This is the big editor used by both Add Recipe and Edit Recipe.
// It does not save anything by itself. Parent pages pass in values and "onChange" functions.
// Think of this as the visible form, and app/add + app/edit as the brains that save/load data.

import Image from "next/image";
import { useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { FormEvent } from "react";
import type {
  EquipmentDraft,
  FaqDraft,
  IngredientDraft,
  IngredientGroupDraft,
  InstructionSectionDraft,
  InstructionStepDraft,
  NutritionDraft,
  StepPhotoDraft,
  TroubleshootingDraft,
} from "@/lib/recipe-types";
import AppIcon from "@/components/AppIcon";
import InstructionStepsEditor, { type StepIngredientOption } from "@/components/InstructionStepsEditor";
import { EMPTY_INSTRUCTION_STEP } from "@/lib/recipe-types";


// ── Unit options ───────────────────────────────────────────────────────────────

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
  nutritionEstimateMessage: string;
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
  onIngredientChange: (groupIndex: number, ingredientIndex: number, field: keyof IngredientDraft, value: string | boolean) => void;
  onIngredientSelect: (groupIndex: number, ingredientIndex: number, updates: Partial<IngredientDraft>) => void;
  onIngredientBulkAdd: (groupIndex: number, items: IngredientDraft[]) => void;
  onInstructionSectionAdd: () => void;
  onInstructionSectionRemove: (index: number) => void;
  onInstructionSectionChange: (index: number, field: keyof InstructionSectionDraft, value: string) => void;
  onInstructionStepsChange: (index: number, steps: InstructionStepDraft[], stepsEnMirror: string) => void;
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
  onEquipmentSet: (items: EquipmentDraft[]) => void;
  onImageUrlsChange: (value: string) => void;
  onCoverImageUrlChange: (value: string) => void;
  onEstimateNutrition: () => void;
  onUseSourceCoverPhoto: () => void;
};


/** Reconstruct editable text from a saved IngredientDraft for tap-to-edit. */
function draftToText(ing: import("@/lib/recipe-types").IngredientDraft): string {
  const parts: string[] = [];
  if (ing.amount) parts.push(ing.amount);
  const displayUnit = ing.unit === "ml" ? "mL" : ing.unit === "l" ? "L" : ing.unit;
  if (displayUnit && displayUnit !== "whole" && displayUnit !== "clove") parts.push(displayUnit);
  parts.push(ing.name_en);
  if (ing.preparation) parts.push(ing.preparation);
  if (ing.note) parts.push(ing.note);
  if (ing.garnish) parts.push("for garnish");
  if (ing.optional) parts.push("optional");
  return parts.join(" ");
}

// Parse a free time string ("1h 30m", "45 min", "20") into hours/minutes fields.
function parseHM(value: string): { h: string; m: string } {
  const h = value.match(/(\d+)\s*h/i);
  const m = value.match(/(\d+)\s*m/i);
  if (h || m) return { h: h ? h[1] : "", m: m ? m[1] : "" };
  const bare = value.match(/\d+/);
  return { h: "", m: bare ? bare[0] : "" };
}
function composeHM(h: string, m: string): string {
  const hh = parseInt(h, 10) || 0;
  const mm = parseInt(m, 10) || 0;
  if (!hh && !mm) return "";
  if (hh && mm) return `${hh}h ${mm}m`;
  return hh ? `${hh}h` : `${mm} min`;
}

export default function RecipeForm(props: RecipeFormProps) {
  // Ingredient options for per-step "ingredients used" chips (deduped by canonical key).
  const stepIngredientOptions: StepIngredientOption[] = (() => {
    const seen = new Set<string>();
    const out: StepIngredientOption[] = [];
    for (const group of props.ingredientGroups) {
      for (const it of group.items) {
        const name = it.name_en.trim();
        const key = name.toLowerCase();
        if (name && !seen.has(key)) {
          seen.add(key);
          out.push({ key, label: name, name_en: name });
        }
      }
    }
    return out;
  })();
  // Per-section input text (the "Add one or paste multiple items" field)
  const [inputText, setInputText] = useState<Record<number, string>>({});
  const [parsePending, setParsePending] = useState<Record<number, boolean>>({});
  // Tap-to-edit: which row is being edited and its current text
  const [editingRow, setEditingRow] = useState<{ gi: number; ii: number; text: string } | null>(null);

  // Cover photo upload → Supabase Storage bucket "recipe-photos".
  const [uploadingCover, setUploadingCover] = useState(false);
  const onCoverImageUrlChange = props.onCoverImageUrlChange;
  const handleCoverUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploadingCover(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Please sign in first");
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${user.id}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("recipe-photos").upload(path, file, { contentType: file.type, upsert: false });
      if (error) throw error;
      const { data: pub } = supabase.storage.from("recipe-photos").getPublicUrl(path);
      onCoverImageUrlChange(pub.publicUrl);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCover(false);
      event.target.value = "";
    }
  }, [onCoverImageUrlChange]);

  // Parse text and immediately add — no preview step, no Parse button.
  const handleAddIngredients = useCallback(async (groupIndex: number, text: string) => {
    if (!text.trim()) return;
    setParsePending((p) => ({ ...p, [groupIndex]: true }));
    try {
      const res = await fetch("/api/ingredients/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const entries: import("@/lib/ingredient-resolver").ParsedEntry[] = await res.json();
        const items: import("@/lib/recipe-types").IngredientDraft[] = entries.map((e) => ({
          name_en: e.ingredient,
          name_de: e.nameDe ?? "",
          amount: e.quantity ?? "",
          unit: e.unit ?? "",
          preparation: "",
          note: e.note || "",
          optional: e.optional,
          garnish: e.garnish,
          approximate: e.approximate,
          libraryId: e.libraryId ?? null,
        }));
        props.onIngredientBulkAdd(groupIndex, items);
        setInputText((p) => ({ ...p, [groupIndex]: "" }));
      }
    } finally {
      setParsePending((p) => ({ ...p, [groupIndex]: false }));
    }
  }, [props]);

  // Save an edited row: re-parse the text and update the ingredient in place.
  const handleRowSave = useCallback(async (gi: number, ii: number, text: string) => {
    if (!text.trim()) { props.onIngredientRemove(gi, ii); setEditingRow(null); return; }
    setParsePending((p) => ({ ...p, [gi]: true }));
    try {
      const res = await fetch("/api/ingredients/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const entries: import("@/lib/ingredient-resolver").ParsedEntry[] = await res.json();
        if (entries.length > 0) {
          const e = entries[0];
          props.onIngredientSelect(gi, ii, {
            name_en: e.ingredient,
            name_de: e.nameDe ?? "",
            amount: e.quantity ?? "",
            unit: e.unit ?? "",
            note: [e.size, e.note].filter(Boolean).join(", "),
            optional: e.optional,
            garnish: e.garnish,
            approximate: e.approximate,
            libraryId: e.libraryId ?? null,
          });
        }
      }
    } finally {
      setParsePending((p) => ({ ...p, [gi]: false }));
      setEditingRow(null);
    }
  }, [props]);

  return (
    <form onSubmit={props.onSubmit} className="recipe-form">
      {/* Recipe identity and ownership fields sit first because they shape the whole record. */}
      <div className="card card-accent" style={{ marginBottom: 0 }}>
        {/* Basic fields are grouped first because they make the recipe easy to browse later. */}
        <div className="section-heading-row">
          <div>
            <h2 style={{ marginBottom: 6 }}>Recipe Basics</h2>
            <p>Start with the identity, story, and quick labels people use while browsing.</p>
          </div>
        </div>
        <input className="input" value={props.title} onChange={(event) => props.onTitleChange(event.target.value)} placeholder="Recipe title" />
        <p style={{ margin: "6px 0 12px", fontSize: 13, color: "var(--muted)" }}>
          Recipe language: English — German is auto-translated on save.
        </p>

        <textarea className="input" value={props.descriptionEn} onChange={(event) => props.onDescriptionEnChange(event.target.value)} placeholder="Description — notes, cooking tips, serving suggestions…" />

        <div className="form-grid">
          <input className="input" value={props.sourceUrl} onChange={(event) => props.onSourceUrlChange(event.target.value)} placeholder="Source URL (optional)" />
          <input className="input" value={props.videoUrl} onChange={(event) => props.onVideoUrlChange(event.target.value)} placeholder="Video URL (optional)" />
        </div>

        <div className="time-picker-grid">
          <div className="time-field">
            <span className="time-field-label">Prep time</span>
            <div className="hm-row">
              <input className="input" type="number" min={0} value={parseHM(props.prepTime).h}
                onChange={(e) => props.onPrepTimeChange(composeHM(e.target.value, parseHM(props.prepTime).m))} placeholder="0" /><small>h</small>
              <input className="input" type="number" min={0} value={parseHM(props.prepTime).m}
                onChange={(e) => props.onPrepTimeChange(composeHM(parseHM(props.prepTime).h, e.target.value))} placeholder="0" /><small>min</small>
            </div>
          </div>
          <div className="time-field">
            <span className="time-field-label">Cook time</span>
            <div className="hm-row">
              <input className="input" type="number" min={0} value={parseHM(props.cookTime).h}
                onChange={(e) => props.onCookTimeChange(composeHM(e.target.value, parseHM(props.cookTime).m))} placeholder="0" /><small>h</small>
              <input className="input" type="number" min={0} value={parseHM(props.cookTime).m}
                onChange={(e) => props.onCookTimeChange(composeHM(parseHM(props.cookTime).h, e.target.value))} placeholder="0" /><small>min</small>
            </div>
          </div>
          <div className="time-field">
            <span className="time-field-label">Servings</span>
            <div className="serving-stepper">
              <button type="button" aria-label="Decrease servings"
                onClick={() => props.onServingsChange(String(Math.max(1, (parseInt(props.servings, 10) || 1) - 1)))}>−</button>
              <span>{props.servings || "—"}</span>
              <button type="button" aria-label="Increase servings"
                onClick={() => props.onServingsChange(String((parseInt(props.servings, 10) || 0) + 1))}>+</button>
            </div>
          </div>
        </div>

      </div>


      {/* Ingredient sections are nested so the editor matches the structure shown on the recipe page. */}
      <div className="card" style={{ marginBottom: 0 }}>
        {/* Ingredient sections are nested: section -> ingredient rows. */}
        <div className="form-row-actions">
          <div>
            <h3 style={{ marginBottom: 8 }}>Ingredient Sections</h3>
            <p style={{ marginBottom: 0 }}>Use as many sections as you want: dough, filling, tempering, garnish, and so on.</p>
          </div>
          <button className="button" type="button" onClick={props.onIngredientGroupAdd}>
            <AppIcon name="add" size={16} />
            Add Section
          </button>
        </div>

        {props.ingredientGroups.map((group, groupIndex) => (
          <div key={`group-${groupIndex}`} className="card editor-subcard" style={{ marginBottom: 12, padding: 16 }}>
            <div className="three-field-row">
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

            {/* ── Ingredient list — tap to edit, × to remove ── */}
            {group.items.some(ing => ing.name_en.trim() || ing.amount.trim()) && (
              <div style={{ display: "flex", flexDirection: "column", gap: 2, marginBottom: 10 }}>
                {group.items.map((ingredient, ingredientIndex) => {
                  if (!ingredient.name_en.trim() && !ingredient.amount.trim()) return null;
                  const isEditing = editingRow?.gi === groupIndex && editingRow?.ii === ingredientIndex;
                  return (
                    <div key={`ing-${groupIndex}-${ingredientIndex}`}
                      style={{ display: "flex", alignItems: "center", gap: 10, padding: "7px 12px", borderRadius: 8, background: "var(--surface)", border: `1px solid ${isEditing ? "var(--accent)" : "var(--border)"}` }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                        background: ingredient.libraryId ? "var(--olive)" : "var(--border)" }}
                        title={ingredient.libraryId ? "Linked to library" : "Not linked"} />
                      {isEditing ? (
                        <input
                          autoFocus
                          className="input"
                          style={{ flex: 1, border: "none", background: "transparent", outline: "none", boxShadow: "none", padding: 0, fontSize: "0.9rem" }}
                          value={editingRow.text}
                          onChange={(e) => setEditingRow({ ...editingRow, text: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") { e.preventDefault(); handleRowSave(groupIndex, ingredientIndex, editingRow.text); }
                            if (e.key === "Escape") setEditingRow(null);
                          }}
                          onBlur={() => handleRowSave(groupIndex, ingredientIndex, editingRow.text)}
                        />
                      ) : (
                        <span style={{ flex: 1, fontSize: "0.9rem", color: "var(--foreground)", cursor: "text" }}
                          onClick={() => setEditingRow({ gi: groupIndex, ii: ingredientIndex, text: draftToText(ingredient) })}>
                          {(() => {
                            const du = ingredient.unit === "ml" ? "mL" : ingredient.unit === "l" ? "L" : ingredient.unit;
                            const showUnit = du && du !== "whole" && du !== "clove";
                            return (ingredient.amount || showUnit) ? (
                              <strong style={{ fontWeight: 800 }}>
                                {ingredient.amount}{showUnit ? ` ${du}` : ""}{" "}
                              </strong>
                            ) : null;
                          })()}
                          {ingredient.name_en}
                          {ingredient.preparation && <span style={{ color: "var(--muted)", fontStyle: "italic" }}>, {ingredient.preparation}</span>}
                          {ingredient.note && <span style={{ color: "var(--muted)" }}> · {ingredient.note}</span>}
                          {ingredient.garnish && <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: 6 }}>garnish</span>}
                          {ingredient.optional && <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: 6 }}>optional</span>}
                          {ingredient.approximate && <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: 6 }}>approx</span>}
                        </span>
                      )}
                      <button type="button" onClick={() => props.onIngredientRemove(groupIndex, ingredientIndex)}
                        style={{ padding: "2px 8px", fontSize: "1rem", lineHeight: 1, borderRadius: 6, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer", flexShrink: 0 }}>
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Add ingredient input — type one or paste many, Enter to add ── */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "10px 14px", borderRadius: 10, background: "var(--surface)", border: "1px solid var(--border)" }}>
              <input
                className="input"
                style={{ flex: 1, border: "none", background: "transparent", outline: "none", boxShadow: "none", padding: 0, fontSize: "0.95rem" }}
                placeholder={parsePending[groupIndex] ? "Adding…" : "Add one or paste multiple items"}
                value={inputText[groupIndex] ?? ""}
                disabled={parsePending[groupIndex]}
                onChange={(e) => setInputText((p) => ({ ...p, [groupIndex]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddIngredients(groupIndex, inputText[groupIndex] ?? "");
                  }
                }}
                onPaste={(e) => {
                  const pasted = e.clipboardData.getData("text");
                  if (pasted.includes("\n") || (pasted.match(/[,;]/g) ?? []).length > 1) {
                    e.preventDefault();
                    handleAddIngredients(groupIndex, pasted);
                  }
                }}
              />
              {inputText[groupIndex]?.trim() && !parsePending[groupIndex] && (
                <button type="button" onClick={() => handleAddIngredients(groupIndex, inputText[groupIndex] ?? "")}
                  style={{ padding: "3px 10px", borderRadius: 6, background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer", fontSize: "0.85rem", flexShrink: 0 }}>
                  Add
                </button>
              )}
              <span title={"Type one ingredient and press Enter, or paste a comma/semicolon/newline-separated list.\nExamples:\n  200g flour\n  2 eggs, 1 tsp salt\n  3 garlic cloves finely chopped, optional coriander"} style={{ color: "var(--muted)", cursor: "help", flexShrink: 0, fontSize: "1rem" }}>ⓘ</span>
            </div>
          </div>
        ))}
      </div>

      {/* Instruction sections let you keep main steps, filling steps, garnish steps, and so on clearly separated. */}
      <div className="card" style={{ marginBottom: 0 }}>
        {/* Steps are one-per-line so editing stays simple and the reader can display numbered lists. */}
        <div className="form-row-actions">
          <div>
            <h3 style={{ marginBottom: 8 }}>Instruction Sections</h3>
            <p style={{ marginBottom: 0 }}>Create sections like Dough, Filling, Assembly. Inside each section, use one step per line.</p>
          </div>
          <button className="button" type="button" onClick={props.onInstructionSectionAdd}>
            <AppIcon name="add" size={16} />
            Add Instruction Section
          </button>
        </div>

        {props.instructionSections.map((section, index) => (
          <div key={`section-${index}`} className="card editor-subcard" style={{ marginBottom: 12, padding: 16 }}>
            <div className="three-field-row">
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
            <InstructionStepsEditor
              steps={
                section.steps && section.steps.length > 0
                  ? section.steps
                  : section.steps_en
                      .split("\n")
                      .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
                      .filter(Boolean)
                      .map((text) => ({ ...EMPTY_INSTRUCTION_STEP, text_en: text }))
              }
              ingredientOptions={stepIngredientOptions}
              onChange={(steps, mirror) => props.onInstructionStepsChange(index, steps, mirror)}
            />
            <p style={{ marginTop: 8, marginBottom: 0, fontSize: 12, color: "var(--muted)" }}>
              German steps are auto-translated on save.
            </p>
          </div>
        ))}
      </div>



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
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 8 }}>
          <label className="button" style={{ cursor: uploadingCover ? "default" : "pointer" }}>
            <AppIcon name="recipe" size={16} />
            {uploadingCover ? "Uploading…" : "Upload from device"}
            <input type="file" accept="image/*" hidden disabled={uploadingCover} onChange={handleCoverUpload} />
          </label>
          {props.coverImageUrl && <span style={{ fontSize: "0.8rem", color: "var(--olive)" }}>✓ cover photo set</span>}
        </div>
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
