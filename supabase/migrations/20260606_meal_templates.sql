-- ============================================================
-- Meal templates — save a week's plan and re-apply it later
-- (e.g. "Gym Week", "Indian Week"). Run in Supabase → SQL Editor. Idempotent.
--
-- slots is a JSONB array of:
--   { "d": 0-6 (Mon..Sun), "slot": "breakfast|lunch|dinner|snack",
--     "recipe_id": <bigint|null>, "entry_type": "recipe|restaurant|...",
--     "label": <text|null> }
-- ============================================================

CREATE TABLE IF NOT EXISTS meal_templates (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name       TEXT        NOT NULL,
  slots      JSONB       NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE meal_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "meal_templates_owner" ON meal_templates;
CREATE POLICY "meal_templates_owner" ON meal_templates
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS meal_templates_user ON meal_templates (user_id);
