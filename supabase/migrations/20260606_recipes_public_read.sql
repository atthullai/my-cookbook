-- ============================================================
-- Allow everyone to READ public recipes.
-- Run in Supabase → SQL Editor → New Query → Run.
--
-- Why: the only recipes policy was "recipes_owner" USING (auth.uid()=user_id),
-- which scopes ALL operations (incl. SELECT) to the owner. That means a
-- non-creator user cannot read the creator's is_public recipes, so Discover /
-- Recommended would be empty for them. RLS policies are OR'd, so adding a
-- SELECT-only public policy alongside the owner policy is safe: owners still
-- fully manage their own rows; everyone can additionally read public ones.
-- ============================================================

DROP POLICY IF EXISTS "recipes_public_read" ON public.recipes;
CREATE POLICY "recipes_public_read" ON public.recipes
  FOR SELECT
  USING (is_public = true);
