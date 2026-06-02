-- ============================================================
-- SECURITY: Enable RLS on the recipes table
-- Run this in Supabase → SQL Editor → New Query → Run
-- Without this, any authenticated user can read/write all users' recipes.
-- ============================================================

ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Drop any stale policies first
DROP POLICY IF EXISTS "recipes_owner" ON public.recipes;

-- One user sees and manages only their own recipes
CREATE POLICY "recipes_owner" ON public.recipes
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
