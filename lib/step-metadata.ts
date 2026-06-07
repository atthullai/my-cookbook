/**
 * Rule-based extraction of structured step metadata from instruction text.
 *
 * No AI: these are deterministic keyword/regex heuristics used to PRE-FILL a
 * step's appliance / heat / duration / tools when importing a recipe from a URL
 * or when a user pastes a block of instructions. The user always reviews and can
 * override the result in the form, so false positives are cheap.
 */

import type { InstructionStepDraft } from "@/lib/recipe-types";
import { matchIngredientsInStep, type StepMatchableIngredient } from "@/lib/step-ingredients";

export type StepHeat = "low" | "medium" | "high";

export type StepAppliance =
  | "cooktop"
  | "oven"
  | "blender"
  | "pressure-cooker"
  | "microwave"
  | "grill";

/** Total minutes mentioned for an action, e.g. "simmer for 1 hr 5 min" → 65. */
export function extractDurationMin(text: string): number | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  let total = 0;
  let found = false;

  // Hours (1 hour / 1.5 hrs / 1 h)
  const hourMatch = lower.match(/(\d+(?:\.\d+)?)\s*(hours?|hrs?|h)\b/);
  if (hourMatch) {
    total += parseFloat(hourMatch[1]) * 60;
    found = true;
  }

  // Minutes (10 min / 10-12 minutes / 10 mins) — take the upper bound of a range.
  const minMatch = lower.match(/(\d+)(?:\s*[-–]\s*(\d+))?\s*(minutes?|mins?|min)\b/);
  if (minMatch) {
    total += parseInt(minMatch[2] ?? minMatch[1], 10);
    found = true;
  }

  if (!found) return null;
  return Math.round(total) || null;
}

/** Coarse heat level. "medium-high" rounds up to high; "simmer" is low; "boil" is high. */
export function extractHeat(text: string): StepHeat | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/\bmedium[-\s]?high\b/.test(lower)) return "high";
  if (/\bmedium[-\s]?low\b/.test(lower)) return "low";
  if (/\bhigh heat\b|\bboil\b|\bhigh flame\b/.test(lower)) return "high";
  if (/\blow heat\b|\bsimmer\b|\blow flame\b|\bgentle heat\b/.test(lower)) return "low";
  if (/\bmedium heat\b|\bmedium flame\b/.test(lower)) return "medium";
  return null;
}

/** Best-guess appliance for the step. First match wins (ordered by specificity). */
export function extractAppliance(text: string): StepAppliance | null {
  if (!text) return null;
  const lower = text.toLowerCase();
  if (/\bpressure cook|\binstant pot\b|\bpressure cooker\b/.test(lower)) return "pressure-cooker";
  if (/\bmicrowav/.test(lower)) return "microwave";
  if (/\bgrill\b|\bbarbecue\b|\bbbq\b/.test(lower)) return "grill";
  if (/\bblend\b|\bblender\b|\bpurée\b|\bpuree\b|\bfood processor\b|\bmixie\b|\bgrinder\b/.test(lower)) return "blender";
  if (/\bbake\b|\bbaking\b|\bpreheat\b|\boven\b|\broast\b/.test(lower)) return "oven";
  if (/\bsaut[ée]\b|\bfry\b|\bfrying\b|\bsear\b|\bpan\b|\bskillet\b|\bwok\b|\bstove\b|\bcooktop\b|\bsimmer\b|\bboil\b|\bheat .*\boil\b|\bkadai\b|\bkadhai\b/.test(lower)) return "cooktop";
  return null;
}

const TOOL_RULES: Array<{ tool: string; re: RegExp }> = [
  { tool: "knife", re: /\bchop\b|\bslice\b|\bdice\b|\bmince\b|\bcut\b|\bjulienne\b/ },
  { tool: "whisk", re: /\bwhisk\b|\bbeat\b/ },
  { tool: "spatula", re: /\bspatula\b|\bfold in\b|\bscrape\b/ },
  { tool: "spoon", re: /\bstir\b|\bspoon\b/ },
  { tool: "grater", re: /\bgrate\b|\bgrater\b/ },
  { tool: "rolling pin", re: /\broll out\b|\brolling pin\b|\bflatten\b/ },
  { tool: "tongs", re: /\btongs?\b|\bflip\b/ },
  { tool: "strainer", re: /\bstrain\b|\bdrain\b|\bsieve\b|\bcolander\b/ },
];

/** Tools implied by the verbs in the step. */
export function extractTools(text: string): string[] {
  if (!text) return [];
  const lower = text.toLowerCase();
  const tools = new Set<string>();
  for (const { tool, re } of TOOL_RULES) {
    if (re.test(lower)) tools.add(tool);
  }
  return [...tools];
}

/**
 * Turn raw step text lines into structured form-step drafts, rule-based
 * pre-filling appliance/heat/duration/tools and linking ingredients. Used by the
 * URL importer and "paste all instructions" so the user reviews filled metadata.
 */
export function deriveStepDrafts(texts: string[], ingredients: StepMatchableIngredient[]): InstructionStepDraft[] {
  return texts
    .map((raw) => raw.replace(/^\s*\d+[.)]\s*/, "").trim())
    .filter(Boolean)
    .map((text) => {
      const duration = extractDurationMin(text);
      return {
        text_en: text,
        text_de: "",
        appliance: extractAppliance(text) ?? "",
        heat: extractHeat(text) ?? "",
        durationMin: duration ? String(duration) : "",
        tools: extractTools(text),
        ingredientRefs: matchIngredientsInStep(text, ingredients),
      };
    });
}
