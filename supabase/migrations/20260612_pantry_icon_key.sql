-- ============================================================
-- Pantry items can keep the product photo URL from a barcode scan
-- (Open Food Facts image_front_url). Shown on the card and item sheet
-- in preference to the generic ingredient icon.
-- Run in Supabase → SQL Editor → New Query → Run. Idempotent.
-- ============================================================

ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS icon_key text;
