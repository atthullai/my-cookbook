-- ============================================================
-- Food entries carry calories: manual override (user-typed) for branded
-- items like Ovomaltine, or auto-derived from the ingredient library.
-- Run in Supabase → SQL Editor → New Query → Run. Idempotent.
-- ============================================================

ALTER TABLE public.planned_meals ADD COLUMN IF NOT EXISTS food_kcal numeric;
