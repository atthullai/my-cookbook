-- ============================================================
-- Fix: saving a pantry item failed with
--   "new row violates check constraint pantry_items_source_check"
-- A pre-existing CHECK on pantry_items.source did not include the values the
-- app writes ('store-bought' / 'homemade'), and the earlier ADD COLUMN IF NOT
-- EXISTS could not change it. Replace the constraint and align the default.
-- Run in Supabase → SQL Editor → New Query → Run. Idempotent.
-- ============================================================

-- 1) Drop the old constraint FIRST — otherwise the normalising UPDATE below
--    (which writes 'store-bought') is itself rejected by the old check.
ALTER TABLE public.pantry_items DROP CONSTRAINT IF EXISTS pantry_items_source_check;

ALTER TABLE public.pantry_items ALTER COLUMN source SET DEFAULT 'store-bought';

-- 2) Normalise any legacy source values so the new constraint (which validates
--    every existing row) can't fail.
UPDATE public.pantry_items
  SET source = CASE WHEN is_homemade THEN 'homemade' ELSE 'store-bought' END
  WHERE source IS NULL OR source NOT IN ('store-bought', 'homemade');

-- 3) Add the constraint that matches what the app writes.
ALTER TABLE public.pantry_items ADD CONSTRAINT pantry_items_source_check
  CHECK (source IS NULL OR source IN ('store-bought', 'homemade'));
