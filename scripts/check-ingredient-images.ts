// Validates the ingredient-image resolver:
//  1. every EXTRA_SYNONYMS slug exists in the generated manifest
//  2. spot-checks resolution in English / German / Tamil / Hindi
// Run: npx tsx scripts/check-ingredient-images.ts
import { INGREDIENT_IMAGE_ALIASES } from "../lib/ingredient-image-manifest";
import { EXTRA_SYNONYMS, resolveIngredientImage } from "../lib/ingredient-images";

const slugs = new Set(Object.keys(INGREDIENT_IMAGE_ALIASES));
const bad = Object.entries(EXTRA_SYNONYMS).filter(([, slug]) => !slugs.has(slug));
if (bad.length) {
  console.log(`❌ ${bad.length} synonyms point at missing slugs:`);
  for (const [term, slug] of bad) console.log(`   "${term}" -> ${slug}`);
} else {
  console.log(`✅ all ${Object.keys(EXTRA_SYNONYMS).length} curated synonyms point at real icons`);
}

const samples = [
  // English
  "onion", "cherry tomatoes", "basmati rice", "chicken breast", "olive oil",
  // German
  "Zwiebeln", "Knoblauch", "Mehl", "Schlagsahne", "Kichererbsen", "Kreuzkümmel",
  // Tamil
  "thakkali", "kariveppilai", "thuvaram paruppu", "vendakkai", "milagai thool", "vellam",
  // Hindi
  "haldi", "jeera", "bhindi", "atta", "kala chana", "dahi",
  // messy real-world strings
  "2 ripe bananas", "fresh coriander leaves chopped", "1/2 tsp turmeric powder",
  // should-miss
  "unicorn dust",
];
let miss = 0;
for (const s of samples) {
  const r = resolveIngredientImage(s);
  if (!r && s !== "unicorn dust") miss++;
  console.log(`${r ? "✓" : "✗"} ${s.padEnd(32)} -> ${r ?? "(none)"}`);
}
process.exit(bad.length || miss ? 1 : 0);
