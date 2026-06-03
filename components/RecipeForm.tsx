"use client";

// RECIPE FORM MAP
// This is the big editor used by both Add Recipe and Edit Recipe.
// It does not save anything by itself. Parent pages pass in values and "onChange" functions.
// Think of this as the visible form, and app/add + app/edit as the brains that save/load data.

import Image from "next/image";
import { useState, useCallback } from "react";
import type { FormEvent } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ALL_CUISINE_ORIGINS, INDIAN_CUISINE_ORIGINS, getCuisineTheme } from "@/lib/cuisine-themes";
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
import EquipmentPicker from "@/components/EquipmentPicker";
import IngredientAutocomplete from "@/components/IngredientAutocomplete";
import type { IngredientSearchResult } from "@/app/api/ingredients/search/route";
import { BADGE_OPTIONS, DIFFICULTY_OPTIONS } from "@/lib/recipe-types";

// ── Badge metadata ─────────────────────────────────────────────────────────────
const BADGE_META: Record<string, { emoji: string; bg: string; text: string; ring: string }> = {
  "Veg":          { emoji: "🌿", bg: "bg-green-100",   text: "text-green-800",   ring: "ring-green-400" },
  "Non-Veg":      { emoji: "🍗", bg: "bg-red-100",     text: "text-red-800",     ring: "ring-red-400" },
  "Egg":          { emoji: "🥚", bg: "bg-yellow-100",  text: "text-yellow-800",  ring: "ring-yellow-400" },
  "Vegan":        { emoji: "🌱", bg: "bg-emerald-100", text: "text-emerald-800", ring: "ring-emerald-400" },
  "Spicy":        { emoji: "🌶️", bg: "bg-orange-100",  text: "text-orange-800",  ring: "ring-orange-400" },
  "High Protein": { emoji: "💪", bg: "bg-blue-100",    text: "text-blue-800",    ring: "ring-blue-400" },
  "Quick Meal":   { emoji: "⚡", bg: "bg-indigo-100",  text: "text-indigo-800",  ring: "ring-indigo-400" },
  "One Pot":      { emoji: "🥘", bg: "bg-amber-100",   text: "text-amber-800",   ring: "ring-amber-400" },
  "Festival":     { emoji: "🎉", bg: "bg-purple-100",  text: "text-purple-800",  ring: "ring-purple-400" },
  "Breakfast":    { emoji: "🌅", bg: "bg-sky-100",     text: "text-sky-800",     ring: "ring-sky-400" },
  "Lunch":        { emoji: "☀️", bg: "bg-yellow-50",   text: "text-yellow-900",  ring: "ring-yellow-300" },
  "Dinner":       { emoji: "🌙", bg: "bg-violet-100",  text: "text-violet-800",  ring: "ring-violet-400" },
  "Dessert":      { emoji: "🍰", bg: "bg-pink-100",    text: "text-pink-800",    ring: "ring-pink-400" },
};

// ── Unit options ───────────────────────────────────────────────────────────────
const UNIT_OPTIONS = [
  "",
  // Volume
  "ml", "L", "tsp", "tbsp", "cup", "fl oz",
  // Weight
  "g", "kg", "oz", "lb",
  // Count / whole item
  "whole", "bunch", "handful",
  // Whole-piece descriptors
  "head", "stalk", "inch", "stick",
  // Small / leaf
  "leaf", "sprig", "sheet", "dash",
  // Packaged
  "can", "packet", "sachet",
  // Pinch
  "pinch",
];

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

import type { ParsedEntry } from "@/lib/ingredient-resolver";

export default function RecipeForm(props: RecipeFormProps) {
  // Ingredient edit state: which rows are expanded for inline editing.
  const [expandedIngredients, setExpandedIngredients] = useState<Set<string>>(new Set());
  // Quick-paste state: one textarea + parse result per ingredient section.
  const [pasteText, setPasteText] = useState<Record<number, string>>({});
  const [parsePending, setParsePending] = useState<Record<number, boolean>>({});
  const [parsePreview, setParsePreview] = useState<Record<number, ParsedEntry[]>>({});

  const handleParse = useCallback(async (groupIndex: number) => {
    const text = pasteText[groupIndex]?.trim();
    if (!text) return;
    setParsePending((p) => ({ ...p, [groupIndex]: true }));
    try {
      const res = await fetch("/api/ingredients/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      if (res.ok) {
        const entries: ParsedEntry[] = await res.json();
        setParsePreview((p) => ({ ...p, [groupIndex]: entries }));
      }
    } finally {
      setParsePending((p) => ({ ...p, [groupIndex]: false }));
    }
  }, [pasteText]);

  const handleBulkAdd = useCallback((groupIndex: number) => {
    const entries = parsePreview[groupIndex];
    if (!entries?.length) return;
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
    // reset paste UI for this group
    setPasteText((p) => ({ ...p, [groupIndex]: "" }));
    setParsePreview((p) => ({ ...p, [groupIndex]: [] }));
  }, [parsePreview, props]);

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
        <div className="form-grid">
          <input className="input" value={props.title} onChange={(event) => props.onTitleChange(event.target.value)} placeholder="Title (EN)" />
          <input className="input" value={props.titleDe} onChange={(event) => props.onTitleDeChange(event.target.value)} placeholder="Title (DE)" />
          <input className="input" value={props.authorName} onChange={(event) => props.onAuthorNameChange(event.target.value)} placeholder="Author name" />
          <input
            className="input"
            value={props.learnedFrom}
            onChange={(event) => props.onLearnedFromChange(event.target.value)}
            placeholder="Learned from (mom, dad, granny, teacher...)"
          />
        </div>

        <textarea className="input" value={props.descriptionEn} onChange={(event) => props.onDescriptionEnChange(event.target.value)} placeholder="Description (EN)" />
        <textarea className="input" value={props.descriptionDe} onChange={(event) => props.onDescriptionDeChange(event.target.value)} placeholder="Description (DE)" />

        <div className="form-grid">
          <input className="input" value={props.category} onChange={(event) => props.onCategoryChange(event.target.value)} placeholder="Category" />
          {/* ── Cuisine origin: grouped dropdown ─────────────────────── */}
          <select
            className="input"
            value={props.cuisine}
            onChange={(event) => props.onCuisineChange(event.target.value)}
          >
            <option value="">— Select Cuisine —</option>
            <optgroup label="🇮🇳 Indian Regional">
              {INDIAN_CUISINE_ORIGINS.map((o) => {
                const t = getCuisineTheme(o);
                return (
                  <option key={o} value={o}>{t.emoji} {t.label}</option>
                );
              })}
            </optgroup>
            <optgroup label="🌍 World Kitchen">
              {ALL_CUISINE_ORIGINS.filter((o) => !INDIAN_CUISINE_ORIGINS.includes(o)).map((o) => {
                const t = getCuisineTheme(o);
                return (
                  <option key={o} value={o}>{t.emoji} {t.label}</option>
                );
              })}
            </optgroup>
          </select>
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

        <div className="form-grid-compact">
          <input className="input" value={props.prepTime} onChange={(event) => props.onPrepTimeChange(event.target.value)} placeholder="Prep time" />
          <input className="input" value={props.cookTime} onChange={(event) => props.onCookTimeChange(event.target.value)} placeholder="Cooking time" />
          <input className="input" value={props.totalTime} onChange={(event) => props.onTotalTimeChange(event.target.value)} placeholder="Total time" />
          <input className="input" value={props.servings} onChange={(event) => props.onServingsChange(event.target.value)} placeholder="Servings" />
        </div>

        <input className="input" value={props.tags} onChange={(event) => props.onTagsChange(event.target.value)} placeholder="Tags (comma separated)" />
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        {/* Badges are quick filters. They are not required, but they make browsing much nicer. */}
        <h3 style={{ marginBottom: 6 }}>Quick Badge Filters</h3>
        <p style={{ marginBottom: 14, fontSize: 13, color: "#6b7280" }}>
          Tap to toggle. Selected badges appear highlighted with a check — they show as filter chips across the app.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {BADGE_OPTIONS.map((badge) => {
            const isActive = props.badges.includes(badge);
            const meta = BADGE_META[badge] ?? { emoji: "🏷️", bg: "bg-gray-100", text: "text-gray-700", ring: "ring-gray-300" };

            return (
              <motion.button
                key={badge}
                type="button"
                onClick={() => props.onBadgeToggle(badge)}
                whileHover={{ scale: 1.07, y: -1 }}
                whileTap={{ scale: 0.91 }}
                animate={isActive ? { scale: [1, 1.15, 1] } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 420, damping: 18 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 6,
                  padding: "7px 13px",
                  borderRadius: 9999,
                  border: "2px solid transparent",
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: "pointer",
                  userSelect: "none",
                  outline: "none",
                  transition: "background 0.15s, box-shadow 0.15s",
                  ...(isActive
                    ? { boxShadow: `0 0 0 2px rgba(0,0,0,0.06)` }
                    : { background: "#f9fafb", border: "2px solid #e5e7eb", color: "#6b7280" }),
                }}
                className={isActive ? `${meta.bg} ${meta.text} ring-2 ${meta.ring}` : ""}
              >
                <span style={{ fontSize: 15, lineHeight: 1 }}>{meta.emoji}</span>
                <span>{badge}</span>
                <AnimatePresence>
                  {isActive && (
                    <motion.span
                      key="check"
                      initial={{ scale: 0, opacity: 0, width: 0 }}
                      animate={{ scale: 1, opacity: 1, width: "auto" }}
                      exit={{ scale: 0, opacity: 0, width: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 22 }}
                      style={{ fontSize: 12, fontWeight: 700, overflow: "hidden" }}
                    >
                      ✓
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
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

            {/* ── Compact ingredient list ── */}
            {group.items.filter(ing => ing.name_en.trim() || ing.amount.trim()).length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 4, marginBottom: 12 }}>
                {group.items.map((ingredient, ingredientIndex) => {
                  if (!ingredient.name_en.trim() && !ingredient.amount.trim()) return null;
                  const editKey = `${groupIndex}-${ingredientIndex}`;
                  const isExpanded = expandedIngredients.has(editKey);
                  return (
                    <div key={`ing-${groupIndex}-${ingredientIndex}`}>
                      {isExpanded ? (
                        /* ── Inline edit form ── */
                        <div style={{ padding: "10px 12px", borderRadius: 8, background: "var(--surface-strong)", border: "1px solid var(--border)" }}>
                          <div className="ingredient-row" style={{ marginBottom: 6 }}>
                            <input className="input" placeholder="Amount" value={ingredient.amount}
                              onChange={(e) => props.onIngredientChange(groupIndex, ingredientIndex, "amount", e.target.value)} />
                            <select className="input" value={ingredient.unit} title="Unit"
                              onChange={(e) => props.onIngredientChange(groupIndex, ingredientIndex, "unit", e.target.value)}>
                              {UNIT_OPTIONS.map((u) => <option key={u} value={u}>{u || "— unit —"}</option>)}
                            </select>
                            <div style={{ position: "relative", display: "flex" }}>
                              <span title={ingredient.libraryId ? "Linked" : "Not linked"} style={{
                                position: "absolute", top: 6, right: 6, zIndex: 1,
                                width: 7, height: 7, borderRadius: "50%", pointerEvents: "none",
                                background: ingredient.libraryId ? "var(--olive)" : "var(--border)",
                              }} />
                              <IngredientAutocomplete className="input" placeholder="Ingredient (EN)"
                                value={ingredient.name_en}
                                onChange={(v) => props.onIngredientChange(groupIndex, ingredientIndex, "name_en", v)}
                                onSelect={(result: IngredientSearchResult) => {
                                  const updates: Partial<import("@/lib/recipe-types").IngredientDraft> = { name_en: result.name_en, name_de: result.name_de, libraryId: result.id };
                                  if (!ingredient.unit && result.default_unit) updates.unit = result.default_unit;
                                  props.onIngredientSelect(groupIndex, ingredientIndex, updates);
                                }} />
                            </div>
                            <input className="input" placeholder="(DE)" value={ingredient.name_de}
                              onChange={(e) => props.onIngredientChange(groupIndex, ingredientIndex, "name_de", e.target.value)} />
                          </div>
                          <div className="ingredient-row-aux">
                            <input className="input" placeholder="Preparation" value={ingredient.preparation ?? ""}
                              onChange={(e) => props.onIngredientChange(groupIndex, ingredientIndex, "preparation", e.target.value)}
                              style={{ flex: "1 1 130px", minWidth: 0, maxWidth: 200 }} />
                            <input className="input" placeholder="Note" value={ingredient.note ?? ""}
                              onChange={(e) => props.onIngredientChange(groupIndex, ingredientIndex, "note", e.target.value)}
                              style={{ flex: "1 1 130px", minWidth: 0, maxWidth: 200 }} />
                            <label className="mini-check">
                              <input type="checkbox" checked={Boolean(ingredient.approximate)}
                                onChange={(e) => props.onIngredientChange(groupIndex, ingredientIndex, "approximate", e.target.checked)} /> Approx
                            </label>
                            <label className="mini-check">
                              <input type="checkbox" checked={Boolean(ingredient.optional)}
                                onChange={(e) => props.onIngredientChange(groupIndex, ingredientIndex, "optional", e.target.checked)} /> Optional
                            </label>
                            <label className="mini-check">
                              <input type="checkbox" checked={Boolean(ingredient.garnish)}
                                onChange={(e) => props.onIngredientChange(groupIndex, ingredientIndex, "garnish", e.target.checked)} /> Garnish
                            </label>
                            <button className="button" type="button"
                              onClick={() => setExpandedIngredients((s) => { const n = new Set(s); n.delete(editKey); return n; })}>
                              Done ✓
                            </button>
                            <button className="button" type="button"
                              onClick={() => { props.onIngredientRemove(groupIndex, ingredientIndex); setExpandedIngredients((s) => { const n = new Set(s); n.delete(editKey); return n; }); }}>
                              <AppIcon name="delete" size={16} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        /* ── Compact display row ── */
                        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", borderRadius: 8, background: "var(--surface)", border: "1px solid var(--border)" }}>
                          <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                            background: ingredient.libraryId ? "var(--olive)" : "var(--border)" }}
                            title={ingredient.libraryId ? "Linked to library" : "Not linked"} />
                          <span style={{ flex: 1, fontSize: "0.88rem", color: "var(--foreground)" }}>
                            {(ingredient.amount || ingredient.unit) && (
                              <strong>
                                {ingredient.amount}
                                {ingredient.unit && ingredient.unit !== "whole" ? ` ${ingredient.unit}` : ""}
                                {" "}
                              </strong>
                            )}
                            {ingredient.name_en}
                            {ingredient.preparation && <span style={{ color: "var(--muted)" }}>, {ingredient.preparation}</span>}
                            {ingredient.note && <span style={{ color: "var(--muted)" }}> · {ingredient.note}</span>}
                            {ingredient.garnish && <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: 5 }}>garnish</span>}
                            {ingredient.optional && <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: 5 }}>optional</span>}
                            {ingredient.approximate && <span style={{ fontSize: "0.72rem", color: "var(--muted)", marginLeft: 5 }}>approx</span>}
                          </span>
                          <button type="button" onClick={() => setExpandedIngredients((s) => new Set([...s, editKey]))}
                            style={{ padding: "2px 8px", fontSize: "0.78rem", borderRadius: 6, background: "var(--surface-strong)", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer" }}>
                            ✎ Edit
                          </button>
                          <button type="button" onClick={() => props.onIngredientRemove(groupIndex, ingredientIndex)}
                            style={{ padding: "2px 7px", fontSize: "0.9rem", borderRadius: 6, background: "transparent", border: "1px solid var(--border)", color: "var(--muted)", cursor: "pointer" }}>
                            ×
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Quick paste — primary input, always visible ── */}
            <div style={{ padding: 12, borderRadius: 10, background: "var(--surface)", border: "1px dashed var(--border)" }}>
              <p style={{ fontSize: "0.78rem", color: "var(--muted)", marginBottom: 6 }}>
                Type or paste ingredients — one per line, or comma/semicolon-separated.
                <span style={{ opacity: 0.65 }}> e.g. <em>200g flour, 2 eggs, 1 tsp salt, 3 garlic cloves finely chopped</em></span>
              </p>
              <textarea
                className="input"
                rows={3}
                placeholder={"200g flour\n2 eggs, 1 tsp salt\n3 garlic cloves finely chopped"}
                value={pasteText[groupIndex] ?? ""}
                onChange={(e) => {
                  setPasteText((p) => ({ ...p, [groupIndex]: e.target.value }));
                  setParsePreview((p) => ({ ...p, [groupIndex]: [] }));
                }}
                style={{ width: "100%", fontFamily: "inherit", resize: "vertical", marginBottom: 8 }}
              />
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <button className="button" type="button"
                  disabled={parsePending[groupIndex] || !pasteText[groupIndex]?.trim()}
                  onClick={() => handleParse(groupIndex)}>
                  {parsePending[groupIndex] ? "Parsing…" : "Parse"}
                </button>
                {parsePreview[groupIndex]?.length > 0 && (
                  <button className="button" type="button" onClick={() => handleBulkAdd(groupIndex)}
                    style={{ background: "var(--olive)", color: "#fff" }}>
                    ✓ Add {parsePreview[groupIndex].length} ingredient{parsePreview[groupIndex].length !== 1 ? "s" : ""}
                  </button>
                )}
                <button className="button" type="button"
                  style={{ marginLeft: "auto" }}
                  onClick={() => {
                    props.onIngredientAdd(groupIndex);
                    // auto-expand the new blank row
                    const newIdx = group.items.length;
                    setExpandedIngredients((s) => new Set([...s, `${groupIndex}-${newIdx}`]));
                  }}>
                  <AppIcon name="add" size={14} /> Add blank row
                </button>
              </div>

              {parsePreview[groupIndex]?.length > 0 && (
                <ul style={{ listStyle: "none", padding: 0, margin: "10px 0 0", display: "flex", flexDirection: "column", gap: 3 }}>
                  {parsePreview[groupIndex].map((entry, i) => (
                    <li key={i} style={{
                      display: "flex", alignItems: "center", gap: 8, padding: "4px 8px",
                      borderRadius: 6, fontSize: "0.82rem",
                      background: "var(--surface-strong)", border: "1px solid var(--border)",
                    }}>
                      <span style={{ width: 7, height: 7, borderRadius: "50%", flexShrink: 0,
                        background: entry.match === "exact" ? "var(--olive)" : entry.match === "fuzzy" ? "var(--accent)" : "var(--border)" }}
                        title={entry.match === "exact" ? "Matched in library" : entry.match === "fuzzy" ? "Fuzzy match" : "No match — saved as typed"} />
                      <span style={{ flex: 1 }}>
                        {entry.quantity && <strong>{entry.quantity}{entry.unit && entry.unit !== "whole" ? ` ${entry.unit}` : ""} </strong>}
                        {entry.ingredient}
                        {entry.note && <span style={{ color: "var(--muted)" }}>, {entry.note}</span>}
                        {entry.garnish && <span style={{ color: "var(--muted)", fontStyle: "italic" }}> · garnish</span>}
                        {entry.optional && <span style={{ color: "var(--muted)", fontStyle: "italic" }}> · optional</span>}
                      </span>
                      {entry.match === "none" && entry.suggestions.length > 0 && (
                        <span style={{ color: "var(--accent)", fontSize: "0.72rem", flexShrink: 0 }}>
                          → {entry.suggestions.slice(0, 2).join(", ")}?
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
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
              placeholder={"Auto-translated on save — or type German steps here."}
            />
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 0 }}>
        {/* Step photos are optional. Leave this empty unless a recipe really benefits from process images. */}
        <div className="form-row-actions">
          <div>
            <h3 style={{ marginBottom: 8 }}>Step-by-Step Photos</h3>
            <p style={{ marginBottom: 0 }}>Add these manually when you really want process photos. Imported recipes no longer auto-fill them.</p>
          </div>
          <button className="button" type="button" onClick={props.onStepPhotoAdd}>
            <AppIcon name="add" size={16} />
            Add Step Photo
          </button>
        </div>

        {props.stepPhotos.map((item, index) => (
          <div key={`step-photo-${index}`} className="card editor-subcard" style={{ marginBottom: 12, padding: 16 }}>
            <div className="step-photo-row">
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

      {/* Equipment — searchable picker backed by the canonical equipment library */}
      <div className="card" style={{ marginBottom: 0 }}>
        <h3 style={{ marginBottom: 10 }}>Equipment</h3>
        <EquipmentPicker selected={props.equipment} onChange={props.onEquipmentSet} />
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
        <div className="form-row-actions">
          <p style={{ marginBottom: 0 }}>
            Enter per-serving nutrition values manually, or estimate them from the ingredient list. The estimator works best when amounts and units are filled in.
          </p>
          <button className="button" type="button" onClick={props.onEstimateNutrition} disabled={props.estimatingNutrition}>
            <AppIcon name="protein" size={16} />
            {props.estimatingNutrition ? "Estimating..." : "Estimate From Ingredients"}
          </button>
        </div>
        {(props.nutritionEstimateMessage || props.nutrition.note_en) && (
          <div className="nutrition-estimate-status" role="status">
            <strong>Estimate status</strong>
            <span>{props.nutritionEstimateMessage || props.nutrition.note_en}</span>
          </div>
        )}
        <div className="form-grid-compact">
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
        <div className="form-row-actions">
          <div>
            <h3 style={{ marginBottom: 8 }}>FAQ</h3>
            <p style={{ marginBottom: 0 }}>Add common questions and answers for the recipe.</p>
          </div>
          <button className="button" type="button" onClick={props.onFaqAdd}>
            <AppIcon name="add" size={16} />
            Add FAQ
          </button>
        </div>

        {props.faq.map((item, index) => (
          <div key={`faq-${index}`} className="card editor-subcard" style={{ marginBottom: 12, padding: 16 }}>
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
        <div className="form-row-actions">
          <div>
            <h3 style={{ marginBottom: 8 }}>Troubleshooting</h3>
            <p style={{ marginBottom: 0 }}>List common problems and how to fix them.</p>
          </div>
          <button className="button" type="button" onClick={props.onTroubleshootingAdd}>
            <AppIcon name="add" size={16} />
            Add Issue
          </button>
        </div>

        {props.troubleshooting.map((item, index) => (
          <div key={`troubleshooting-${index}`} className="card editor-subcard" style={{ marginBottom: 12, padding: 16 }}>
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
