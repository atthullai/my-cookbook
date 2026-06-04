-- ============================================================
-- Transfer all existing data to the new creator user account
-- and demote the old account to a regular test user.
--
-- HOW TO RUN:
--   Supabase Dashboard → SQL Editor → New Query → paste → Run
--
-- BEFORE running:
--   1. Replace OLD_USER_ID below with the old user's UID
--      (Supabase Dashboard → Authentication → Users → old user row)
--   2. NEW_CREATOR_ID is already filled in from your .env.local
-- ============================================================

DO $$
DECLARE
  old_user_id  UUID := 'PASTE_OLD_USER_ID_HERE';          -- ← replace this
  new_creator  UUID := 'efcc51d3-328d-4a4b-9d3e-b79d2f80e265';
BEGIN

  -- 1. Recipes ---------------------------------------------------------
  UPDATE public.recipes
    SET user_id = new_creator
    WHERE user_id = old_user_id;

  -- 2. Pantry items ----------------------------------------------------
  UPDATE public.pantry_items
    SET user_id = new_creator
    WHERE user_id = old_user_id;

  -- 3. Planned meals ---------------------------------------------------
  UPDATE public.planned_meals
    SET user_id = new_creator
    WHERE user_id = old_user_id;

  -- 4. Shopping list ---------------------------------------------------
  UPDATE public.shopping_list
    SET user_id = new_creator
    WHERE user_id = old_user_id;

  -- 5. User profile (copy name/bio/etc to new account, keep old intact)
  --    user_profiles uses "id" as the primary key (references auth.users)
  INSERT INTO public.user_profiles (id, display_name, bio, location, avatar_url, cook_style)
    SELECT new_creator, display_name, bio, location, avatar_url, cook_style
    FROM   public.user_profiles
    WHERE  id = old_user_id
  ON CONFLICT (id) DO UPDATE
    SET display_name = EXCLUDED.display_name,
        bio          = EXCLUDED.bio,
        location     = EXCLUDED.location,
        avatar_url   = EXCLUDED.avatar_url,
        cook_style   = EXCLUDED.cook_style;

  RAISE NOTICE 'Transfer complete: all data moved from % to %', old_user_id, new_creator;
END $$;
