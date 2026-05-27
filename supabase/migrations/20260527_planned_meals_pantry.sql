-- ============================================================
-- Migration: planned_meals, pantry_items tables
-- ============================================================

-- ── planned_meals ─────────────────────────────────────────────────────────────
-- Stores the weekly meal plan for each user.
-- recipe_id is bigint to match recipes.id (integer / bigint PK).
CREATE TABLE IF NOT EXISTS planned_meals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recipe_id   BIGINT      REFERENCES recipes(id) ON DELETE SET NULL,
  meal_date   DATE        NOT NULL,
  meal_slot   TEXT        NOT NULL CHECK (meal_slot IN ('breakfast','lunch','dinner','snack')),
  servings    INTEGER     DEFAULT 1,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, meal_date, meal_slot)
);

-- Row-level security
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planned_meals_owner" ON planned_meals;
CREATE POLICY "planned_meals_owner" ON planned_meals
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Index for fast week-range lookups
CREATE INDEX IF NOT EXISTS planned_meals_user_date
  ON planned_meals (user_id, meal_date);

-- ── pantry_items ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pantry_items (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name                TEXT        NOT NULL,
  category            TEXT        DEFAULT 'other',
  quantity            NUMERIC(10,2),
  unit                TEXT,
  expiry_date         DATE,
  low_stock_threshold NUMERIC(10,2),
  notes               TEXT,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pantry_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pantry_items_owner" ON pantry_items;
CREATE POLICY "pantry_items_owner" ON pantry_items
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_pantry_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pantry_items_updated_at ON pantry_items;
CREATE TRIGGER pantry_items_updated_at
  BEFORE UPDATE ON pantry_items
  FOR EACH ROW EXECUTE FUNCTION update_pantry_updated_at();

-- ── shopping_list — add unit column if missing ────────────────────────────────
ALTER TABLE shopping_list
  ADD COLUMN IF NOT EXISTS unit TEXT;

-- ── diet_plans — ensure columns expected by the rebuild types exist ───────────
ALTER TABLE diet_plans
  ADD COLUMN IF NOT EXISTS name        TEXT,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS is_active   BOOLEAN DEFAULT false;

-- ── Extend origin enum safely ────────────────────────────────────────────────
-- The TS type uses 20 values; the DB enum started with 10.
-- Add the extra values idempotently.
DO $$ BEGIN
  ALTER TYPE cuisine_origin ADD VALUE IF NOT EXISTS 'german-austrian';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE cuisine_origin ADD VALUE IF NOT EXISTS 'north-indian';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE cuisine_origin ADD VALUE IF NOT EXISTS 'south-indian';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE cuisine_origin ADD VALUE IF NOT EXISTS 'bengali';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE cuisine_origin ADD VALUE IF NOT EXISTS 'gujarati';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE cuisine_origin ADD VALUE IF NOT EXISTS 'punjabi';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE cuisine_origin ADD VALUE IF NOT EXISTS 'rajasthani';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE cuisine_origin ADD VALUE IF NOT EXISTS 'maharashtrian';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE cuisine_origin ADD VALUE IF NOT EXISTS 'kerala';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN
  ALTER TYPE cuisine_origin ADD VALUE IF NOT EXISTS 'karnataka';
EXCEPTION WHEN others THEN NULL; END $$;
