-- ============================================================
-- Migration: user library (saved, collections, views, cook history),
--            user preferences (diet/allergies/units/language), search history
-- Run this in Supabase → SQL Editor → New Query → Run.
-- Idempotent: safe to run more than once.
-- Moves library state off localStorage so it syncs across devices.
-- recipes.id is BIGINT — all recipe references are BIGINT.
-- ============================================================

-- ── saved_recipes ─────────────────────────────────────────────────────────────
-- A user's bookmarked recipes (the "Saved Recipes" / Library list).
CREATE TABLE IF NOT EXISTS saved_recipes (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recipe_id   BIGINT      NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  -- a saved recipe can also be flagged as a favourite (heart)
  is_favourite BOOLEAN    NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE (user_id, recipe_id)
);

ALTER TABLE saved_recipes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saved_recipes_owner" ON saved_recipes;
CREATE POLICY "saved_recipes_owner" ON saved_recipes
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS saved_recipes_user ON saved_recipes (user_id);

-- ── user_collections ──────────────────────────────────────────────────────────
-- Folders the user creates (e.g. "South Indian Breakfast"). System collections
-- (Recently Viewed, Made It, etc.) are derived in code, not stored here.
CREATE TABLE IF NOT EXISTS user_collections (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  name        TEXT        NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  is_public   BOOLEAN     NOT NULL DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_collections ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_collections_owner" ON user_collections;
CREATE POLICY "user_collections_owner" ON user_collections
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS user_collections_user ON user_collections (user_id);

-- ── collection_recipes ────────────────────────────────────────────────────────
-- Many-to-many: one recipe can live in many collections.
CREATE TABLE IF NOT EXISTS collection_recipes (
  collection_id UUID      NOT NULL REFERENCES user_collections(id) ON DELETE CASCADE,
  recipe_id     BIGINT    NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  added_at      TIMESTAMPTZ DEFAULT NOW(),

  PRIMARY KEY (collection_id, recipe_id)
);

ALTER TABLE collection_recipes ENABLE ROW LEVEL SECURITY;
-- Scoped via the parent collection's owner.
DROP POLICY IF EXISTS "collection_recipes_owner" ON collection_recipes;
CREATE POLICY "collection_recipes_owner" ON collection_recipes
  USING (EXISTS (
    SELECT 1 FROM user_collections c
    WHERE c.id = collection_recipes.collection_id AND c.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM user_collections c
    WHERE c.id = collection_recipes.collection_id AND c.user_id = auth.uid()
  ));

-- ── recipe_views ──────────────────────────────────────────────────────────────
-- Drives the "Recently Viewed" rail. One row per (user, recipe); viewed_at bumps.
CREATE TABLE IF NOT EXISTS recipe_views (
  user_id    UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recipe_id  BIGINT      NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (user_id, recipe_id)
);

ALTER TABLE recipe_views ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "recipe_views_owner" ON recipe_views;
CREATE POLICY "recipe_views_owner" ON recipe_views
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS recipe_views_user_time ON recipe_views (user_id, viewed_at DESC);

-- ── cook_history ──────────────────────────────────────────────────────────────
-- Drives "Recently Cooked" and meal rotation. Allows multiple cooks per recipe.
CREATE TABLE IF NOT EXISTS cook_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  recipe_id   BIGINT      REFERENCES recipes(id) ON DELETE SET NULL,
  cooked_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  servings    INTEGER,
  note        TEXT
);

ALTER TABLE cook_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cook_history_owner" ON cook_history;
CREATE POLICY "cook_history_owner" ON cook_history
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS cook_history_user_time ON cook_history (user_id, cooked_at DESC);

-- ── user_preferences ──────────────────────────────────────────────────────────
-- One row per user. Stores onboarding answers + settings.
-- diets/allergies are TEXT[] (e.g. {'vegetarian','high-protein'}, {'peanuts','soy'}).
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id      UUID        PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  diets        TEXT[]      NOT NULL DEFAULT '{}',
  allergies    TEXT[]      NOT NULL DEFAULT '{}',
  units        TEXT        NOT NULL DEFAULT 'metric' CHECK (units IN ('metric','imperial')),
  language     TEXT        NOT NULL DEFAULT 'en' CHECK (language IN ('en','de')),
  onboarded    BOOLEAN     NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "user_preferences_owner" ON user_preferences;
CREATE POLICY "user_preferences_owner" ON user_preferences
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── search_history ────────────────────────────────────────────────────────────
-- Recent searches (recipe names + ingredient searches) for the Home/Discover UX.
CREATE TABLE IF NOT EXISTS search_history (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  term        TEXT        NOT NULL,
  kind        TEXT        NOT NULL DEFAULT 'text' CHECK (kind IN ('text','ingredient')),
  searched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "search_history_owner" ON search_history;
CREATE POLICY "search_history_owner" ON search_history
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS search_history_user_time ON search_history (user_id, searched_at DESC);

-- ── auto-update updated_at on user_preferences ────────────────────────────────
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS user_preferences_updated_at ON user_preferences;
CREATE TRIGGER user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();
