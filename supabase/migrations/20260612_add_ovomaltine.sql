-- ============================================================
-- Ovomaltine (malt drink powder) in the ingredient library, with nutrition
-- from the product label (per 100 g): 376 kcal, fat 1.9 g (sat 0.9), carbs
-- 78 g (sugar 51.1), fibre 4 g, protein 9.5 g, salt 0.48 g (≈192 mg sodium).
-- Portion guidance on pack: 3–4 spoons (20 g) + 200 ml milk.
-- Run in Supabase → SQL Editor → New Query → Run. Idempotent.
-- ============================================================

INSERT INTO public.ingredients (
  name_en, name_de, synonyms, category, default_unit,
  weight_per_tsp, weight_per_tbsp, weight_confidence,
  kcal_per_100g, protein_per_100g, fat_per_100g, sat_fat_per_100g,
  carbs_per_100g, fiber_per_100g, sugar_per_100g, sodium_per_100g,
  calcium_per_100g, magnesium_per_100g,
  vitamin_c_per_100g, vitamin_e_per_100g, vitamin_b6_per_100g, vitamin_b12_per_100g,
  folate_per_100g, nutrition_source
) VALUES (
  'ovomaltine', 'Ovomaltine',
  ARRAY['ovaltine','malt drink powder','ovomaltine pulver','malted drink'],
  'beverages', 'g',
  5, 7, 'estimated',
  376, 9.5, 1.9, 0.9,
  78, 4, 51.1, 192,
  320, 330,
  80, 12, 1.4, 2.5,
  200, 'manual'
)
ON CONFLICT (name_en) DO UPDATE SET
  name_de = EXCLUDED.name_de,
  synonyms = EXCLUDED.synonyms,
  kcal_per_100g = EXCLUDED.kcal_per_100g,
  protein_per_100g = EXCLUDED.protein_per_100g,
  fat_per_100g = EXCLUDED.fat_per_100g,
  sat_fat_per_100g = EXCLUDED.sat_fat_per_100g,
  carbs_per_100g = EXCLUDED.carbs_per_100g,
  fiber_per_100g = EXCLUDED.fiber_per_100g,
  sugar_per_100g = EXCLUDED.sugar_per_100g,
  sodium_per_100g = EXCLUDED.sodium_per_100g,
  calcium_per_100g = EXCLUDED.calcium_per_100g,
  magnesium_per_100g = EXCLUDED.magnesium_per_100g,
  vitamin_c_per_100g = EXCLUDED.vitamin_c_per_100g,
  vitamin_e_per_100g = EXCLUDED.vitamin_e_per_100g,
  vitamin_b6_per_100g = EXCLUDED.vitamin_b6_per_100g,
  vitamin_b12_per_100g = EXCLUDED.vitamin_b12_per_100g,
  folate_per_100g = EXCLUDED.folate_per_100g,
  nutrition_source = EXCLUDED.nutrition_source;
