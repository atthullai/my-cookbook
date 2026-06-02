-- ============================================================
-- Add is_favourite to recipes + ingredient_library_id to pantry_items
-- Run this in Supabase → SQL Editor → New Query → Run
-- ============================================================

-- Favourite flag on recipes (per user — user_id already scoped by RLS)
ALTER TABLE public.recipes
  ADD COLUMN IF NOT EXISTS is_favourite BOOLEAN DEFAULT false;

-- Ingredient library link on pantry items — allows Suggest Recipes to match
-- by stable library ID instead of relying on fuzzy name matching
ALTER TABLE public.pantry_items
  ADD COLUMN IF NOT EXISTS ingredient_library_id UUID REFERENCES public.ingredients(id) ON DELETE SET NULL;
