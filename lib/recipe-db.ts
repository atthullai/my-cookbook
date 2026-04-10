import type {
  EquipmentDraft,
  FaqDraft,
  IngredientGroupDraft,
  InstructionSectionDraft,
  NutritionDraft,
  RecipeEquipmentItem,
  RecipeFaqItem,
  RecipeIngredient,
  RecipeIngredientGroup,
  RecipeInstructionSection,
  RecipeNutritionFacts,
  RecipeRecord,
  RecipeStepPhoto,
  RecipeTroubleshootingItem,
  StepPhotoDraft,
  TroubleshootingDraft,
} from "@/lib/recipe-types";
import { normalizeRecipe, parseTagInput, serializeInstructionSections, splitRecipeSteps } from "@/lib/recipe-types";

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

export function buildInstructionSectionPayload(sections: InstructionSectionDraft[]): RecipeInstructionSection[] {
  return sections
    .map((section, index) => {
      const stepsEn = splitRecipeSteps(section.steps_en);
      const stepsDe = splitRecipeSteps(section.steps_de);

      return {
        title_en: section.title_en.trim() || (index === 0 ? "Method" : `Section ${index + 1}`),
        title_de: section.title_de.trim() || section.title_en.trim() || (index === 0 ? "Methode" : `Abschnitt ${index + 1}`),
        steps_en: stepsEn,
        steps_de: stepsDe.length > 0 ? stepsDe : stepsEn,
      };
    })
    .filter((section) => section.steps_en.length > 0);
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

export function buildNutritionPayload(nutrition: NutritionDraft): RecipeNutritionFacts | null {
  const hasValues = Object.values(nutrition).some((value) => value.trim());

  if (!hasValues) {
    return null;
  }

  return {
    calories_kcal: nutrition.calories_kcal.trim(),
    fat_g: nutrition.fat_g.trim(),
    saturated_fat_g: nutrition.saturated_fat_g.trim(),
    carbs_g: nutrition.carbs_g.trim(),
    fiber_g: nutrition.fiber_g.trim(),
    sugar_g: nutrition.sugar_g.trim(),
    protein_g: nutrition.protein_g.trim(),
    sodium_mg: nutrition.sodium_mg.trim(),
    cholesterol_mg: nutrition.cholesterol_mg.trim(),
    potassium_mg: nutrition.potassium_mg.trim(),
    calcium_mg: nutrition.calcium_mg.trim(),
    iron_mg: nutrition.iron_mg.trim(),
    magnesium_mg: nutrition.magnesium_mg.trim(),
    phosphorus_mg: nutrition.phosphorus_mg.trim(),
    zinc_mg: nutrition.zinc_mg.trim(),
    vitamin_a_mcg: nutrition.vitamin_a_mcg.trim(),
    vitamin_c_mg: nutrition.vitamin_c_mg.trim(),
    vitamin_d_mcg: nutrition.vitamin_d_mcg.trim(),
    vitamin_e_mg: nutrition.vitamin_e_mg.trim(),
    vitamin_k_mcg: nutrition.vitamin_k_mcg.trim(),
    vitamin_b6_mg: nutrition.vitamin_b6_mg.trim(),
    vitamin_b12_mcg: nutrition.vitamin_b12_mcg.trim(),
    folate_mcg: nutrition.folate_mcg.trim(),
    note_en: nutrition.note_en.trim(),
    note_de: nutrition.note_de.trim() || nutrition.note_en.trim(),
  };
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
}) {
  const instructionSections = buildInstructionSectionPayload(input.instructionSections);
  const stepsEn = serializeInstructionSections(instructionSections, "en");
  const stepsDe = serializeInstructionSections(instructionSections, "de");
  const imageUrls = input.imageUrls
    .split("\n")
    .map((value) => value.trim())
    .filter(Boolean);
  const coverImageUrl = input.coverImageUrl.trim() || imageUrls[0] || null;

  // This is the single place where we translate form values into the exact database record shape.
  return {
    slug: input.slug.trim(),
    title_en: input.titleEn.trim(),
    title_de: input.titleDe.trim() || null,
    author_name: input.authorName.trim() || "Atthuzhai",
    learned_from: input.learnedFrom.trim() || null,
    description_en: input.descriptionEn.trim() || null,
    description_de: input.descriptionDe.trim() || null,
    category: input.category.trim() || null,
    cuisine: input.cuisine.trim() || null,
    cuisine_de: input.cuisineDe.trim() || input.cuisine.trim() || null,
    course: input.course.trim() || null,
    course_de: input.courseDe.trim() || input.course.trim() || null,
    difficulty: input.difficulty.trim() || null,
    difficulty_de: input.difficultyDe.trim() || input.difficulty.trim() || null,
    prep_time: input.prepTime.trim() || null,
    cook_time: input.cookTime.trim() || null,
    total_time: input.totalTime.trim() || null,
    tags: parseTagInput(input.tags),
    badges: input.badges.map((badge) => badge.trim()).filter(Boolean),
    ingredients: buildIngredientPayload(input.ingredientGroups),
    instruction_sections: instructionSections,
    steps_en: stepsEn,
    steps_de: stepsDe || null,
    notes_en: input.notesEn.trim() || null,
    notes_de: input.notesDe.trim() || null,
    tips_en: input.tipsEn.trim() || null,
    tips_de: input.tipsDe.trim() || null,
    storage_en: input.storageEn.trim() || null,
    storage_de: input.storageDe.trim() || null,
    nutrition: buildNutritionPayload(input.nutrition),
    faq: buildFaqPayload(input.faq),
    troubleshooting: buildTroubleshootingPayload(input.troubleshooting),
    step_photos: buildStepPhotoPayload(input.stepPhotos),
    source_url: input.sourceUrl.trim() || null,
    video_url: input.videoUrl.trim() || null,
    servings: input.servings.trim() ? Number(input.servings) : null,
    equipment: buildEquipmentPayload(input.equipment),
    image_urls: imageUrls,
    cover_image_url: coverImageUrl,
  };
}
