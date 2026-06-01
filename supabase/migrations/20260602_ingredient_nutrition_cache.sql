-- Adds per-100g nutrition cache to the ingredients library.
-- Once populated by scripts/enrich-nutrition.ts, the estimation API
-- reads from here instead of calling USDA live for every ingredient.

alter table ingredients
  add column if not exists usda_fdc_id        integer,
  add column if not exists kcal_per_100g      float,
  add column if not exists protein_per_100g   float,
  add column if not exists fat_per_100g       float,
  add column if not exists sat_fat_per_100g   float,
  add column if not exists carbs_per_100g     float,
  add column if not exists fiber_per_100g     float,
  add column if not exists sugar_per_100g     float,
  add column if not exists sodium_per_100g    float,
  add column if not exists cholesterol_per_100g float,
  add column if not exists potassium_per_100g float,
  add column if not exists calcium_per_100g   float,
  add column if not exists iron_per_100g      float,
  add column if not exists magnesium_per_100g float,
  add column if not exists phosphorus_per_100g float,
  add column if not exists zinc_per_100g      float,
  add column if not exists vitamin_a_per_100g float,
  add column if not exists vitamin_c_per_100g float,
  add column if not exists vitamin_d_per_100g float,
  add column if not exists vitamin_e_per_100g float,
  add column if not exists vitamin_k_per_100g float,
  add column if not exists vitamin_b6_per_100g float,
  add column if not exists vitamin_b12_per_100g float,
  add column if not exists folate_per_100g    float,
  add column if not exists nutrition_source   text
    check (nutrition_source in ('usda','ifct','manual','estimated','local_fallback')),
  add column if not exists nutrition_verified boolean default false,
  add column if not exists nutrition_updated_at timestamptz;

create index if not exists ingredients_usda_fdc_id_idx
  on ingredients(usda_fdc_id)
  where usda_fdc_id is not null;
