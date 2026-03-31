import type { RecipeRecord } from "@/lib/recipe-types";
import { getRecipeNotes, splitRecipeSteps } from "@/lib/recipe-types";

export type InstructionSection = {
  title: string;
  steps: string[];
};

export function parseInstructionSections(text: string): InstructionSection[] {
  const trimmedText = text.trim();

  if (!trimmedText) {
    return [];
  }

  const lines = trimmedText.split("\n").map((line) => line.trim());
  const hasHeadings = lines.some((line) => line.startsWith("## "));

  if (!hasHeadings) {
    return [
      {
        title: "Method",
        steps: splitRecipeSteps(trimmedText),
      },
    ];
  }

  const sections: InstructionSection[] = [];
  let currentTitle = "Method";
  let currentLines: string[] = [];

  const pushCurrentSection = () => {
    const steps = currentLines
      .map((line) => line.replace(/^\d+\.\s*/, "").trim())
      .filter(Boolean);

    if (steps.length > 0) {
      sections.push({
        title: currentTitle,
        steps,
      });
    }
  };

  for (const line of lines) {
    if (line.startsWith("## ")) {
      pushCurrentSection();
      currentTitle = line.replace(/^##\s+/, "").trim() || "Method";
      currentLines = [];
      continue;
    }

    if (line) {
      currentLines.push(line);
    }
  }

  pushCurrentSection();

  return sections;
}

export function extractLinks(recipe: RecipeRecord): string[] {
  const links = new Set<string>();
  const urlPattern = /https?:\/\/[^\s)]+/g;

  for (const block of [recipe.source_url, recipe.video_url, recipe.steps_en, recipe.steps_de, recipe.notes_en, recipe.notes_de]) {
    const matches = block?.match(urlPattern) ?? [];

    for (const match of matches) {
      links.add(match);
    }
  }

  return Array.from(links);
}

export function buildRecipeHighlights(recipe: RecipeRecord): string[] {
  const highlights: string[] = [];

  if (recipe.category) {
    highlights.push(recipe.category);
  }

  if (recipe.servings) {
    highlights.push(`${recipe.servings} servings`);
  }

  if (recipe.tags.length > 0) {
    highlights.push(`${recipe.tags.length} tags`);
  }

  if (recipe.ingredients.length > 0) {
    highlights.push(`${recipe.ingredients.length} ingredient section${recipe.ingredients.length > 1 ? "s" : ""}`);
  }

  if (recipe.equipment.length > 0) {
    highlights.push(`${recipe.equipment.length} tools`);
  }

  return highlights;
}

export function hasNotes(recipe: RecipeRecord, lang: "en" | "de"): boolean {
  return Boolean(getRecipeNotes(recipe, lang).trim());
}
