-- ============================================================
-- Migration: nutrition columns, origin enum, tags, diet plans
-- ============================================================

-- Cuisine origin enum (safe to run multiple times)
DO $$ BEGIN
  CREATE TYPE cuisine_origin AS ENUM (
    'indian', 'italian', 'mexican', 'japanese', 'chinese',
    'mediterranean', 'american', 'thai', 'french', 'other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- New columns on recipes table
ALTER TABLE recipes
  ADD COLUMN IF NOT EXISTS origin          cuisine_origin DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS calories        INTEGER,
  ADD COLUMN IF NOT EXISTS protein_g       NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS carbs_g         NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS fat_g           NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS fiber_g         NUMERIC(6,2),
  -- servings already exists (integer) — skip
  ADD COLUMN IF NOT EXISTS is_veg          BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_vegan        BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS spice_level     INTEGER CHECK (spice_level BETWEEN 0 AND 3),
  ADD COLUMN IF NOT EXISTS is_high_protein BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS prep_time_min   INTEGER,
  ADD COLUMN IF NOT EXISTS cook_time_min   INTEGER;

-- Backfill boolean diet flags from the existing badges text[] column
UPDATE recipes
SET
  is_veg   = badges @> ARRAY['Veg']::text[],
  is_vegan = badges @> ARRAY['Vegan']::text[],
  is_high_protein = badges @> ARRAY['High Protein']::text[]
WHERE badges IS NOT NULL;

-- Shopping list table
CREATE TABLE IF NOT EXISTS shopping_list (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users ON DELETE CASCADE,
  recipe_id  UUID,
  name       TEXT        NOT NULL,
  quantity   TEXT,
  category   TEXT        DEFAULT 'other',
  checked    BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Diet plans table
CREATE TABLE IF NOT EXISTS diet_plans (
  id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID        REFERENCES auth.users ON DELETE CASCADE,
  goal             TEXT        CHECK (goal IN ('weight_loss','muscle_gain','balanced','diabetic_friendly')),
  daily_cal_target INTEGER,
  protein_pct      INTEGER     DEFAULT 30,
  carbs_pct        INTEGER     DEFAULT 40,
  fat_pct          INTEGER     DEFAULT 30,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
ALTER TABLE diet_plans    ENABLE ROW LEVEL SECURITY;

-- Policies (CREATE OR REPLACE not available for row-security; use DROP + CREATE)
DROP POLICY IF EXISTS "own shopping list" ON shopping_list;
CREATE POLICY "own shopping list" ON shopping_list
  FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "own diet plan" ON diet_plans;
CREATE POLICY "own diet plan" ON diet_plans
  FOR ALL USING (auth.uid() = user_id);
