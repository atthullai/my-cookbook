-- ============================================================
-- Storage bucket for user-uploaded recipe cover photos.
-- Run in Supabase → SQL Editor. Idempotent.
-- (Alternatively create the bucket in Dashboard → Storage and make it public.)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-photos', 'recipe-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Anyone can read (public images on recipe cards).
DROP POLICY IF EXISTS "recipe_photos_read" ON storage.objects;
CREATE POLICY "recipe_photos_read" ON storage.objects
  FOR SELECT USING (bucket_id = 'recipe-photos');

-- Signed-in users may upload into the bucket (path is prefixed with their uid).
DROP POLICY IF EXISTS "recipe_photos_insert" ON storage.objects;
CREATE POLICY "recipe_photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'recipe-photos');

-- Users may remove their own uploads (objects under their uid folder).
DROP POLICY IF EXISTS "recipe_photos_delete" ON storage.objects;
CREATE POLICY "recipe_photos_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'recipe-photos' AND owner = auth.uid());
