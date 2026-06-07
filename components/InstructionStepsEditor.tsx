"use client";

/**
 * InstructionStepsEditor — structured per-step editor for one instruction section.
 *
 * Each step carries text plus optional appliance / heat / duration / tools and
 * links to the recipe's ingredients (rendered as chips in the reader). A
 * "paste all instructions" box splits pasted text into steps and rule-based
 * pre-fills the metadata (no AI). The component is self-contained: it reports
 * changes via onChange(steps, stepsEnMirror) so the parent only stores the array
 * plus a newline-joined English mirror for search/translation.
 */
import { useState } from "react";
import AppIcon from "@/components/AppIcon";
import IngredientIcon from "@/components/IngredientIcon";
import { EMPTY_INSTRUCTION_STEP, type InstructionStepDraft } from "@/lib/recipe-types";
import { extractAppliance, extractDurationMin, extractHeat, extractTools } from "@/lib/step-metadata";
import { matchIngredientsInStep } from "@/lib/step-ingredients";

const APPLIANCES = ["", "cooktop", "oven", "blender", "pressure-cooker", "microwave", "grill"];
const APPLIANCE_LABEL: Record<string, string> = {
  "": "No appliance",
  cooktop: "Cooktop",
  oven: "Oven",
  blender: "Blender",
  "pressure-cooker": "Pressure cooker",
  microwave: "Microwave",
  grill: "Grill",
};
const HEATS = ["", "low", "medium", "high"];

export type StepIngredientOption = { key: string; label: string; name_en: string };

type Props = {
  steps: InstructionStepDraft[];
  ingredientOptions: StepIngredientOption[];
  onChange: (steps: InstructionStepDraft[], stepsEnMirror: string) => void;
};

const mirror = (steps: InstructionStepDraft[]) => steps.map((s) => s.text_en).filter((t) => t.trim()).join("\n");

export default function InstructionStepsEditor({ steps, ingredientOptions, onChange }: Props) {
  const [pasteText, setPasteText] = useState("");

  const emit = (next: InstructionStepDraft[]) => onChange(next, mirror(next));

  const update = (index: number, patch: Partial<InstructionStepDraft>) => {
    emit(steps.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  };

  const addStep = () => emit([...steps, { ...EMPTY_INSTRUCTION_STEP }]);
  const removeStep = (index: number) => emit(steps.filter((_, i) => i !== index));

  const toggleRef = (index: number, key: string) => {
    const step = steps[index];
    const has = step.ingredientRefs.includes(key);
    update(index, {
      ingredientRefs: has ? step.ingredientRefs.filter((r) => r !== key) : [...step.ingredientRefs, key],
    });
  };

  // Split pasted text into steps and rule-based pre-fill metadata + ingredient links.
  const parsePaste = () => {
    const lines = pasteText
      .split("\n")
      .map((l) => l.replace(/^\s*\d+[.)]\s*/, "").trim())
      .filter(Boolean);
    if (lines.length === 0) return;
    const parsed: InstructionStepDraft[] = lines.map((text) => {
      const heat = extractHeat(text);
      const duration = extractDurationMin(text);
      const refs = matchIngredientsInStep(
        text,
        ingredientOptions.map((o) => ({ name_en: o.name_en, canonicalName: o.key })),
      );
      return {
        text_en: text,
        text_de: "",
        appliance: extractAppliance(text) ?? "",
        heat: heat ?? "",
        durationMin: duration ? String(duration) : "",
        tools: extractTools(text),
        ingredientRefs: refs,
      };
    });
    // Replace existing steps that are empty; otherwise append.
    const existing = steps.filter((s) => s.text_en.trim());
    emit([...existing, ...parsed]);
    setPasteText("");
  };

  return (
    <div className="steps-editor">
      <div className="steps-paste">
        <textarea
          className="input"
          rows={3}
          value={pasteText}
          onChange={(e) => setPasteText(e.target.value)}
          placeholder={"Paste one or multiple steps (e.g. Finely chop the garlic). One per line — we'll detect heat, time, appliance & ingredients."}
        />
        <button className="button" type="button" onClick={parsePaste} disabled={!pasteText.trim()}>
          <AppIcon name="add" size={16} /> Parse into steps
        </button>
      </div>

      {steps.map((step, index) => (
        <div key={`step-${index}`} className="step-editor-row">
          <div className="step-editor-head">
            <span className="step-editor-num">{index + 1}</span>
            <textarea
              className="input"
              rows={2}
              value={step.text_en}
              onChange={(e) => update(index, { text_en: e.target.value })}
              placeholder={`Step ${index + 1}`}
            />
            <button className="button" type="button" aria-label="Remove step" onClick={() => removeStep(index)}>
              <AppIcon name="delete" size={16} />
            </button>
          </div>

          <div className="step-editor-meta">
            <label>
              <span>Appliance</span>
              <select className="input" value={step.appliance} onChange={(e) => update(index, { appliance: e.target.value })}>
                {APPLIANCES.map((a) => (
                  <option key={a || "none"} value={a}>{APPLIANCE_LABEL[a]}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Heat</span>
              <select className="input" value={step.heat} onChange={(e) => update(index, { heat: e.target.value })}>
                {HEATS.map((h) => (
                  <option key={h || "none"} value={h}>{h ? h[0].toUpperCase() + h.slice(1) : "—"}</option>
                ))}
              </select>
            </label>
            <label>
              <span>Minutes</span>
              <input
                className="input"
                type="number"
                min={0}
                value={step.durationMin}
                onChange={(e) => update(index, { durationMin: e.target.value })}
                placeholder="0"
              />
            </label>
            <label>
              <span>Tools (comma)</span>
              <input
                className="input"
                value={step.tools.join(", ")}
                onChange={(e) => update(index, { tools: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) })}
                placeholder="knife, whisk"
              />
            </label>
          </div>

          {ingredientOptions.length > 0 && (
            <div className="step-editor-links">
              <span className="step-editor-links-label">Ingredients used:</span>
              {ingredientOptions.map((opt) => {
                const active = step.ingredientRefs.includes(opt.key);
                return (
                  <button
                    key={opt.key}
                    type="button"
                    className={active ? "step-link-chip active" : "step-link-chip"}
                    onClick={() => toggleRef(index, opt.key)}
                    aria-pressed={active}
                  >
                    <IngredientIcon name={opt.name_en} size={14} />
                    {opt.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      ))}

      <button className="button" type="button" onClick={addStep}>
        <AppIcon name="add" size={16} /> Add step
      </button>
    </div>
  );
}
