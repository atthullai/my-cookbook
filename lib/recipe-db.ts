import type {
  EquipmentDraft,
  FaqDraft,
  IngredientGroupDraft,
  RecipeEquipmentItem,
  RecipeFaqItem,
  RecipeIngredient,
  RecipeIngredientGroup,
  RecipeRecord,
  RecipeStepPhoto,
  RecipeTroubleshootingItem,
  StepPhotoDraft,
  TroubleshootingDraft,
} from "@/lib/recipe-types";
import { normalizeRecipe, parseTagInput } from "@/lib/recipe-types";

// This file is the boundary between form state and database shape.
// Components talk in drafts; Supabase inserts/updates talk in clean payload objects.
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

export function buildStepPhotoPayload(stepPhotos: StepPhotoDraft[]): RecipeStepPhoto[] {
  return stepPhotos
    .filter((item) => item.image_url.trim())
    .map((item) => ({
      step_number: item.step_number.trim(),
      image_url: item.image_url.trim(),
      caption_en: item.caption_en.trim(),
      caption_de: item.caption_de.trim() || item.caption_en.trim(),
    }));
}

export function buildFaqPayload(faq: FaqDraft[]): RecipeFaqItem[] {
  return faq
    .filter((item) => item.question_en.trim() && item.answer_en.trim())
    .map((item) => ({
      question_en: item.question_en.trim(),
      question_de: item.question_de.trim() || item.question_en.trim(),
      answer_en: item.answer_en.trim(),
      answer_de: item.answer_de.trim() || item.answer_en.trim(),
    }));
}

export function buildTroubleshootingPayload(items: TroubleshootingDraft[]): RecipeTroubleshootingItem[] {
  return items
    .filter((item) => item.issue_en.trim() && item.fix_en.trim())
    .map((item) => ({
      issue_en: item.issue_en.trim(),
      issue_de: item.issue_de.trim() || item.issue_en.trim(),
      fix_en: item.fix_en.trim(),
      fix_de: item.fix_de.trim() || item.fix_en.trim(),
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
  tipsEn: string;
  tipsDe: string;
  storageEn: string;
  storageDe: string;
  faq: FaqDraft[];
  troubleshooting: TroubleshootingDraft[];
  stepPhotos: StepPhotoDraft[];
  sourceUrl: string;
  videoUrl: string;
  servings: string;
  equipment: EquipmentDraft[];
  imageUrls: string;
}) {
  // This is the single place where we translate form values into the exact database record shape.
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
    tips_en: input.tipsEn.trim() || null,
    tips_de: input.tipsDe.trim() || null,
    storage_en: input.storageEn.trim() || null,
    storage_de: input.storageDe.trim() || null,
    faq: buildFaqPayload(input.faq),
    troubleshooting: buildTroubleshootingPayload(input.troubleshooting),
    step_photos: buildStepPhotoPayload(input.stepPhotos),
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
