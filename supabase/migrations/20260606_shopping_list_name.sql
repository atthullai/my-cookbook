-- ============================================================
-- Multiple shopping lists — name each shopping_list row so a user can keep
-- separate lists (Weekly, Party, Indian Store…). Run in Supabase → SQL Editor.
-- Idempotent. Existing rows fall back to the default list.
-- ============================================================

ALTER TABLE shopping_list
  ADD COLUMN IF NOT EXISTS list_name TEXT NOT NULL DEFAULT 'My List';

CREATE INDEX IF NOT EXISTS shopping_list_user_list
  ON shopping_list (user_id, list_name);
