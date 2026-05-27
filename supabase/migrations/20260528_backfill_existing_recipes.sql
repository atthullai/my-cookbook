-- =============================================================================
-- Backfill existing recipes to match current app schema
-- Safe to run multiple times (idempotent).
-- Does NOT delete any recipe data.
-- =============================================================================

-- ── 1. Ensure badges is never NULL (UI renders an empty array on all recipe cards) ──
UPDATE recipes
SET badges = '[]'::jsonb
WHERE badges IS NULL;

-- ── 2. Ensure tags is never NULL ──
UPDATE recipes
SET tags = '[]'::jsonb
WHERE tags IS NULL;

-- ── 3. Ensure ingredients is a valid JSONB array, not NULL ──
UPDATE recipes
SET ingredients = '[]'::jsonb
WHERE ingredients IS NULL;

-- ── 4. Ensure instruction_sections is a valid JSONB array, not NULL ──
UPDATE recipes
SET instruction_sections = '[]'::jsonb
WHERE instruction_sections IS NULL;

-- ── 5. Ensure equipment is a valid JSONB array, not NULL ──
UPDATE recipes
SET equipment = '[]'::jsonb
WHERE equipment IS NULL;

-- ── 6. Ensure image_urls is a valid JSONB array, not NULL ──
UPDATE recipes
SET image_urls = '[]'::jsonb
WHERE image_urls IS NULL;

-- ── 7. Ensure faq is a valid JSONB array, not NULL ──
UPDATE recipes
SET faq = '[]'::jsonb
WHERE faq IS NULL;

-- ── 8. Ensure troubleshooting is a valid JSONB array, not NULL ──
UPDATE recipes
SET troubleshooting = '[]'::jsonb
WHERE troubleshooting IS NULL;

-- ── 9. Ensure step_photos is a valid JSONB array, not NULL ──
UPDATE recipes
SET step_photos = '[]'::jsonb
WHERE step_photos IS NULL;

-- ── 10. Ensure steps_en is a valid JSONB array, not NULL ──
UPDATE recipes
SET steps_en = '[]'::jsonb
WHERE steps_en IS NULL;

-- ── 11. Backfill cover_image_url from first image_urls entry if missing ──
UPDATE recipes
SET cover_image_url = (image_urls->0)::text::varchar
WHERE cover_image_url IS NULL
  AND image_urls IS NOT NULL
  AND jsonb_array_length(image_urls) > 0;

-- ── 12. Add any new columns that might be missing (idempotent) ──
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS learned_from TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS author_name  TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS badges       JSONB DEFAULT '[]'::jsonb;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS step_photos  JSONB DEFAULT '[]'::jsonb;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS troubleshooting JSONB DEFAULT '[]'::jsonb;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS faq          JSONB DEFAULT '[]'::jsonb;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS equipment    JSONB DEFAULT '[]'::jsonb;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS video_url    TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS tips_en      TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS tips_de      TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS storage_en   TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS storage_de   TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS notes_de     TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS description_de TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS title_de     TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS cuisine_de   TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS course       TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS course_de    TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS difficulty   TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS difficulty_de TEXT;
ALTER TABLE recipes ADD COLUMN IF NOT EXISTS total_time   TEXT;

-- ── 13. Final confirmation ──
SELECT
  COUNT(*)                                    AS total_recipes,
  COUNT(*) FILTER (WHERE badges    IS NULL)   AS null_badges,
  COUNT(*) FILTER (WHERE tags      IS NULL)   AS null_tags,
  COUNT(*) FILTER (WHERE equipment IS NULL)   AS null_equipment,
  COUNT(*) FILTER (WHERE nutrition IS NULL)   AS null_nutrition
FROM recipes;
