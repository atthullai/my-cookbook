-- ============================================================
-- Persistent per-user recipe notes + star ratings.
-- Run in Supabase → SQL Editor. Idempotent. recipe_id is BIGINT.
-- ============================================================

-- ── recipe_notes ── one editable note per (user, recipe), private to the user.
CREATE TABLE IF NOT EXISTS recipe_notes (
  user_id    UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recipe_id  BIGINT      NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  note       TEXT        NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);

ALTER TABLE recipe_notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recipe_notes_owner" ON recipe_notes;
CREATE POLICY "recipe_notes_owner" ON recipe_notes
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── recipe_ratings ── one rating per (user, recipe). Anyone may READ (to show
-- an average); only the owner may write their own row.
CREATE TABLE IF NOT EXISTS recipe_ratings (
  user_id    UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recipe_id  BIGINT      NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  stars      INTEGER     NOT NULL CHECK (stars BETWEEN 1 AND 5),
  review     TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, recipe_id)
);

ALTER TABLE recipe_ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipe_ratings_read" ON recipe_ratings;
CREATE POLICY "recipe_ratings_read" ON recipe_ratings
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "recipe_ratings_write" ON recipe_ratings;
CREATE POLICY "recipe_ratings_write" ON recipe_ratings
  FOR ALL
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS recipe_ratings_recipe ON recipe_ratings (recipe_id);
