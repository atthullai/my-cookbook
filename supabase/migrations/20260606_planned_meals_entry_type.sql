-- ============================================================
-- Manual / non-recipe meal entries for the planner.
-- Run in Supabase → SQL Editor → New Query → Run. Idempotent.
--
-- planned_meals.recipe_id is already nullable, so a manual entry is a row with
-- recipe_id = NULL plus a free-text label and an entry_type. Leftovers can
-- optionally link back to the source meal via leftover_of.
-- ============================================================

ALTER TABLE planned_meals
  ADD COLUMN IF NOT EXISTS label       TEXT,
  ADD COLUMN IF NOT EXISTS entry_type  TEXT NOT NULL DEFAULT 'recipe',
  ADD COLUMN IF NOT EXISTS leftover_of UUID REFERENCES planned_meals(id) ON DELETE SET NULL;

-- Constrain entry_type to the known kinds (drop+add for idempotency).
ALTER TABLE planned_meals DROP CONSTRAINT IF EXISTS planned_meals_entry_type_check;
ALTER TABLE planned_meals ADD CONSTRAINT planned_meals_entry_type_check
  CHECK (entry_type IN ('recipe', 'restaurant', 'delivery', 'leftover', 'frozen', 'other'));
