-- ============================================================
-- Extra preference fields for the rebuilt Settings → Preferences (spec §5.9).
-- Run in Supabase → SQL Editor → New Query → Run. Idempotent.
-- Used for filtering/defaults only (no AI).
-- ============================================================

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS dislikes           text[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS household          int4    DEFAULT 1,
  ADD COLUMN IF NOT EXISTS preferred_store    text,
  ADD COLUMN IF NOT EXISTS cooking_experience text,
  ADD COLUMN IF NOT EXISTS favourite_cuisines text[]  NOT NULL DEFAULT '{}';
