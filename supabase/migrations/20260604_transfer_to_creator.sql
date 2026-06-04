-- ============================================================
-- Transfer ALL user data from old account → new creator account
-- Also runs the is_public backfill at the end.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query → paste → Run
--
-- BEFORE running:
--   Replace PASTE_OLD_USER_ID_HERE with the old user's UID
--   (Supabase Dashboard → Authentication → Users → old user row → User UID)
-- ============================================================

DO $$
DECLARE
  old_id  UUID := 'PASTE_OLD_USER_ID_HERE';           -- ← replace this
  new_id  UUID := 'efcc51d3-328d-4a4b-9d3e-b79d2f80e265';
BEGIN

  -- ── recipes ────────────────────────────────────────────────
  UPDATE public.recipes
    SET user_id = new_id WHERE user_id = old_id;

  -- ── pantry_items ───────────────────────────────────────────
  UPDATE public.pantry_items
    SET user_id = new_id WHERE user_id = old_id;

  -- ── planned_meals ──────────────────────────────────────────
  UPDATE public.planned_meals
    SET user_id = new_id WHERE user_id = old_id;

  -- ── shopping_list ──────────────────────────────────────────
  UPDATE public.shopping_list
    SET user_id = new_id WHERE user_id = old_id;

  -- ── pfand_items ────────────────────────────────────────────
  UPDATE public.pfand_items
    SET user_id = new_id WHERE user_id = old_id;

  -- ── pfand_records ──────────────────────────────────────────
  UPDATE public.pfand_records
    SET user_id = new_id WHERE user_id = old_id;

  -- ── diet_plans ─────────────────────────────────────────────
  UPDATE public.diet_plans
    SET user_id = new_id WHERE user_id = old_id;

  -- ── push_subscriptions ─────────────────────────────────────
  UPDATE public.push_subscriptions
    SET user_id = new_id WHERE user_id = old_id;

  -- ── recipe_requests ────────────────────────────────────────
  UPDATE public.recipe_requests
    SET user_id = new_id WHERE user_id = old_id;

  -- ── untracked_usage ────────────────────────────────────────
  UPDATE public.untracked_usage
    SET user_id = new_id WHERE user_id = old_id;

  -- ── user_conversion_overrides ──────────────────────────────
  UPDATE public.user_conversion_overrides
    SET user_id = new_id WHERE user_id = old_id;

  -- ── user_profiles ──────────────────────────────────────────
  -- Primary key is "id" (references auth.users), not "user_id"
  INSERT INTO public.user_profiles
    (id, display_name, bio, location, avatar_url,
     cook_style, cooking_styles, language)
    SELECT
      new_id, display_name, bio, location, avatar_url,
      cook_style, cooking_styles, language
    FROM public.user_profiles
    WHERE id = old_id
  ON CONFLICT (id) DO UPDATE
    SET display_name   = EXCLUDED.display_name,
        bio            = EXCLUDED.bio,
        location       = EXCLUDED.location,
        avatar_url     = EXCLUDED.avatar_url,
        cook_style     = EXCLUDED.cook_style,
        cooking_styles = EXCLUDED.cooking_styles,
        language       = EXCLUDED.language;

  -- ── is_public backfill ─────────────────────────────────────
  -- Add the column if it doesn't exist yet, then mark all
  -- existing recipes as public (they are the creator's recipes).
  ALTER TABLE public.recipes
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT false;

  UPDATE public.recipes
    SET is_public = true
    WHERE user_id = new_id;

  RAISE NOTICE 'Done. Transferred all data from % to %.', old_id, new_id;
END $$;
