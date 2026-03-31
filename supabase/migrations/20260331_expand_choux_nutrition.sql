-- Upgrade the saved cream puff recipe to the expanded manual nutrition model
-- so it includes the newer vitamin and mineral fields as well.

update public.recipes
set
  nutrition = '{
    "calories_kcal": "340",
    "fat_g": "22",
    "saturated_fat_g": "14",
    "carbs_g": "31",
    "fiber_g": "0.4",
    "sugar_g": "19",
    "protein_g": "5",
    "sodium_mg": "37",
    "cholesterol_mg": "125",
    "potassium_mg": "120",
    "calcium_mg": "58",
    "iron_mg": "1.1",
    "magnesium_mg": "12",
    "phosphorus_mg": "88",
    "zinc_mg": "0.5",
    "vitamin_a_mcg": "145",
    "vitamin_c_mg": "3",
    "vitamin_d_mcg": "0.4",
    "vitamin_e_mg": "0.8",
    "vitamin_k_mcg": "4",
    "vitamin_b6_mg": "0.04",
    "vitamin_b12_mcg": "0.2",
    "folate_mcg": "28",
    "note_en": "Approximate nutrition per filled choux pastry from the source recipe card and the richer manual cookbook format.",
    "note_de": "Ungefahrer Nahrwert pro gefulltem Choux auf Basis der Rezeptkarte der Vorlage und des erweiterten manuellen Kochbuchformats."
  }'::jsonb
where slug = 'choux-au-craquelin';
