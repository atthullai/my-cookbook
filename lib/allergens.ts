// ---------------------------------------------------------------------------
// Allergen detection — keyword-based classification of ingredient names into
// the allergen classes used by onboarding (lib/preferences AllergenKey).
//
// Best-effort: surfaces a "Contains: …" banner and warns when a recipe includes
// an allergen the user flagged. Not a substitute for reading labels.
// ---------------------------------------------------------------------------

import type { AllergenKey } from "@/lib/preferences";

export const ALLERGEN_LABELS: Record<AllergenKey, string> = {
  peanuts: "Peanuts",
  "tree-nuts": "Tree nuts",
  soy: "Soy",
  eggs: "Eggs",
  milk: "Milk",
  shellfish: "Shellfish",
  gluten: "Gluten",
  sesame: "Sesame",
};

const KEYWORDS: Record<AllergenKey, string[]> = {
  peanuts: ["peanut", "groundnut"],
  "tree-nuts": ["almond", "cashew", "walnut", "pecan", "hazelnut", "pistachio", "macadamia", "brazil nut", "pine nut"],
  soy: ["soy", "soya", "tofu", "edamame", "tempeh", "miso"],
  eggs: ["egg"],
  milk: ["milk", "butter", "cheese", "cream", "yogurt", "yoghurt", "paneer", "ghee", "curd", "khoa", "khoya", "buttermilk"],
  shellfish: ["shrimp", "prawn", "crab", "lobster", "clam", "mussel", "oyster", "scallop", "shellfish"],
  gluten: ["wheat", "maida", "barley", "rye", "semolina", "couscous", "breadcrumb", "noodle", "naan", "roti", "chapati", "atta", "seitan", "pasta", "bread"],
  sesame: ["sesame", "tahini"],
};

// Phrases that look like a milk keyword but aren't dairy.
const NON_DAIRY = ["coconut milk", "almond milk", "soy milk", "soya milk", "oat milk", "rice milk", "cashew milk",
  "peanut butter", "nut butter", "almond butter", "cashew butter", "cocoa butter", "shea butter", "apple butter"];

function nameHasAllergen(name: string, allergen: AllergenKey): boolean {
  const n = name.toLowerCase();
  if (allergen === "milk" && NON_DAIRY.some((p) => n.includes(p))) return false;
  return KEYWORDS[allergen].some((kw) => n.includes(kw));
}

/** All allergen classes detected across a list of ingredient names. */
export function detectAllergens(ingredientNames: string[]): AllergenKey[] {
  const found = new Set<AllergenKey>();
  for (const name of ingredientNames) {
    if (!name) continue;
    (Object.keys(KEYWORDS) as AllergenKey[]).forEach((a) => {
      if (nameHasAllergen(name, a)) found.add(a);
    });
  }
  return [...found];
}
