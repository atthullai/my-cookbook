-- ============================================================
-- COMPREHENSIVE FIX MIGRATION
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- ── Fix shopping_list ─────────────────────────────────────────────────────────
-- Create if not exists (safe to run even if it already exists)
CREATE TABLE IF NOT EXISTS shopping_list (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users ON DELETE CASCADE,
  recipe_id  UUID,
  name       TEXT        NOT NULL,
  quantity   NUMERIC(10,2),
  unit       TEXT,
  category   TEXT        DEFAULT 'other',
  checked    BOOLEAN     DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns (safe: ADD COLUMN IF NOT EXISTS)
ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS unit     TEXT;
ALTER TABLE shopping_list ADD COLUMN IF NOT EXISTS quantity NUMERIC(10,2);

-- Ensure RLS is on
ALTER TABLE shopping_list ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own shopping list" ON shopping_list;
CREATE POLICY "own shopping list" ON shopping_list
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── planned_meals ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS planned_meals (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recipe_id   BIGINT      REFERENCES recipes(id) ON DELETE SET NULL,
  meal_date   DATE        NOT NULL,
  meal_slot   TEXT        NOT NULL CHECK (meal_slot IN ('breakfast','lunch','dinner','snack')),
  servings    INTEGER     DEFAULT 1,
  notes       TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id, meal_date, meal_slot)
);
ALTER TABLE planned_meals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "planned_meals_owner" ON planned_meals;
CREATE POLICY "planned_meals_owner" ON planned_meals
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS planned_meals_user_date ON planned_meals (user_id, meal_date);

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
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── user_profiles (for editable About Me page) ────────────────────────────────
CREATE TABLE IF NOT EXISTS user_profiles (
  id          UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  display_name TEXT,
  bio         TEXT,
  location    TEXT,
  avatar_url  TEXT,
  cook_style  TEXT,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "profile_owner" ON user_profiles;
CREATE POLICY "profile_owner" ON user_profiles
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
