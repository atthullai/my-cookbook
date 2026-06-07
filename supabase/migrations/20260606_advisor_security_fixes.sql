-- ============================================================
-- SECURITY: Fix Supabase database-linter (advisor) warnings.
-- Run in Supabase → SQL Editor → New Query → Run. Idempotent.
--
-- Covers:
--   0011 function_search_path_mutable      (update_user_preferences_updated_at, deduct_pantry_fifo)
--   0024 rls_policy_always_true            (recipes "Allow Insert/Update/Delete")
--   0025 public_bucket_allows_listing      (recipe-photos broad SELECT policy)
--   0028 anon_security_definer_executable  (deduct_pantry_fifo, rls_auto_enable)
--   0029 authenticated_security_definer_executable (deduct_pantry_fifo, rls_auto_enable)
--
-- NOTE: 0017 auth_leaked_password_protection is NOT fixable in SQL — enable it in
--       Dashboard → Authentication → Sign In / Providers → Password → "Leaked password
--       protection" (checks HaveIBeenPwned). See bottom of this file.
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 0024  Drop the stale, fully-permissive recipes write policies.
-- These were created in the dashboard before RLS was set up. They are
-- OR'd with "recipes_owner", so USING/WITH CHECK (true) lets ANY caller
-- insert/update/delete ANY recipe — completely bypassing row security.
-- "recipes_owner" (owner writes) + "recipes_public_read" (public SELECT)
-- already provide the correct access; these three are pure holes.
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Allow Insert" ON public.recipes;
DROP POLICY IF EXISTS "Allow Update" ON public.recipes;
DROP POLICY IF EXISTS "Allow Delete" ON public.recipes;
-- "Allow Select" (public read) is harmless but redundant with recipes_public_read; drop too.
DROP POLICY IF EXISTS "Allow Select" ON public.recipes;


-- ────────────────────────────────────────────────────────────
-- 0011  Pin a non-mutable search_path on flagged functions.
-- The trigger function has no schema-qualified refs, so '' is safe.
-- ────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.update_user_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;


-- ────────────────────────────────────────────────────────────
-- 0011 + 0028 + 0029  deduct_pantry_fifo
-- Switch SECURITY DEFINER → INVOKER so the existing owner-scoped RLS on
-- pantry_items / pfand_records is enforced for the caller. The server action
-- always passes the session user's own id, and under INVOKER a user can only
-- read/write their own rows — which is exactly the intended behaviour. This
-- removes the cross-user write hole AND clears the anon/authenticated
-- SECURITY DEFINER warnings without rewriting the function body.
-- 'public' search_path keeps the body's unqualified table refs resolving.
-- ────────────────────────────────────────────────────────────
ALTER FUNCTION public.deduct_pantry_fifo(uuid, text, numeric, text)
  SECURITY INVOKER
  SET search_path = public;

-- anon must never call it.
REVOKE EXECUTE ON FUNCTION public.deduct_pantry_fifo(uuid, text, numeric, text) FROM anon;


-- ────────────────────────────────────────────────────────────
-- 0011 + 0028 + 0029  rls_auto_enable
-- Admin/maintenance helper — not called from the app. Lock it down so it is
-- not exposed via /rest/v1/rpc to anon or signed-in users. (If it backs an
-- event trigger, that keeps working — event triggers run regardless of
-- EXECUTE grants.) search_path pinned for good measure.
-- ────────────────────────────────────────────────────────────
ALTER FUNCTION public.rls_auto_enable() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM PUBLIC;


-- ────────────────────────────────────────────────────────────
-- 0025  recipe-photos public bucket: drop the broad listing policy.
-- A public bucket serves object URLs via the public CDN endpoint WITHOUT any
-- storage.objects SELECT policy. The broad SELECT policy only adds the ability
-- to LIST every file via the client API, which the app never uses. Removing it
-- keeps cover-image URLs working while closing the enumeration surface.
-- (Upload + owner-delete policies are kept.)
-- ────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "recipe_photos_read" ON storage.objects;


-- ============================================================
-- MANUAL STEP (not SQL): 0017 Leaked Password Protection
--   Dashboard → Authentication → Policies/Password settings →
--   enable "Leaked password protection" (HaveIBeenPwned check).
-- ============================================================
