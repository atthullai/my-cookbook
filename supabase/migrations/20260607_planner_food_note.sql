-- ============================================================
-- Planner: allow "food" and "note" day entries + food reference columns.
-- Run in Supabase → SQL Editor → New Query → Run. Idempotent.
--
-- "Add food" puts a canonical food item (with optional qty/unit) on a day;
-- "Add note" is a free-text reminder. Both are recipe_id = NULL rows on
-- planned_meals with the new entry_type. food_ref stores the food's name/key.
-- ============================================================

ALTER TABLE planned_meals
  ADD COLUMN IF NOT EXISTS food_ref  TEXT,
  ADD COLUMN IF NOT EXISTS food_qty  NUMERIC,
  ADD COLUMN IF NOT EXISTS food_unit TEXT;

-- Extend the entry_type whitelist (drop + re-add for idempotency).
ALTER TABLE planned_meals DROP CONSTRAINT IF EXISTS planned_meals_entry_type_check;
ALTER TABLE planned_meals ADD CONSTRAINT planned_meals_entry_type_check
  CHECK (entry_type IN ('recipe', 'restaurant', 'delivery', 'leftover', 'frozen', 'food', 'note', 'other'));
