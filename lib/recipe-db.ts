import type {
  EquipmentDraft,
  IngredientGroupDraft,
  RecipeEquipmentItem,
  RecipeIngredient,
  RecipeIngredientGroup,
  RecipeRecord,
} from "@/lib/recipe-types";
import { normalizeRecipe, parseTagInput } from "@/lib/recipe-types";

export function mapRecipeRows(rows: unknown[]): RecipeRecord[] {
  return rows.map(normalizeRecipe);
}

export function buildIngredientPayload(groups: IngredientGroupDraft[]): RecipeIngredientGroup[] {
  return groups
    .map((group) => {
      const items: RecipeIngredient[] = group.items
        .filter((ingredient) => ingredient.name_en.trim())
        .map((ingredient) => ({
          name_en: ingredient.name_en.trim(),
          name_de: ingredient.name_de.trim() || ingredient.name_en.trim(),
          amount: ingredient.amount.trim() ? ingredient.amount.trim() : null,
          unit: ingredient.unit.trim(),
        }));

      return {
        group_en: group.group_en.trim() || "Main",
        group_de: group.group_de.trim() || group.group_en.trim() || "Main",
        items,
      };
    })
    .filter((group) => group.items.length > 0);
}

export function buildEquipmentPayload(equipment: EquipmentDraft[]): RecipeEquipmentItem[] {
  return equipment
    .filter((item) => item.label_en.trim())
    .map((item) => ({
      label_en: item.label_en.trim(),
      label_de: item.label_de.trim() || item.label_en.trim(),
    }));
}

export function buildRecipePayload(input: {
  slug: string;
  titleEn: string;
  titleDe: string;
  authorName: string;
  learnedFrom: string;
  descriptionEn: string;
  descriptionDe: string;
  category: string;
  tags: string;
  ingredientGroups: IngredientGroupDraft[];
  stepsEn: string;
  stepsDe: string;
  notesEn: string;
  notesDe: string;
  sourceUrl: string;
  videoUrl: string;
  servings: string;
  equipment: EquipmentDraft[];
  imageUrls: string;
}) {
  return {
    slug: input.slug.trim(),
    title_en: input.titleEn.trim(),
    title_de: input.titleDe.trim() || null,
    author_name: input.authorName.trim() || "Saran",
    learned_from: input.learnedFrom.trim() || null,
    description_en: input.descriptionEn.trim() || null,
    description_de: input.descriptionDe.trim() || null,
    category: input.category.trim() || null,
    tags: parseTagInput(input.tags),
    ingredients: buildIngredientPayload(input.ingredientGroups),
    steps_en: input.stepsEn.trim(),
    steps_de: input.stepsDe.trim() || null,
    notes_en: input.notesEn.trim() || null,
    notes_de: input.notesDe.trim() || null,
    source_url: input.sourceUrl.trim() || null,
    video_url: input.videoUrl.trim() || null,
    servings: input.servings.trim() ? Number(input.servings) : null,
    equipment: buildEquipmentPayload(input.equipment),
    image_urls: input.imageUrls
      .split("\n")
      .map((value) => value.trim())
      .filter(Boolean),
  };
}
