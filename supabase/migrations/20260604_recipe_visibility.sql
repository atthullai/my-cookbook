-- ============================================================
-- Add is_public flag to recipes
-- Creator recipes (already in DB) are public → backfilled to true
-- User-created recipes default to false (Library-only)
-- Run in Supabase → SQL Editor → New Query → Run
-- ============================================================

ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

-- Backfill: all existing recipes are the creator's → make them public
UPDATE public.recipes
  SET is_public = true
  WHERE is_public = false;
