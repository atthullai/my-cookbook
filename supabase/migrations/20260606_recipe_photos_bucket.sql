-- ============================================================
-- Storage bucket for user-uploaded recipe cover photos.
-- Run in Supabase → SQL Editor. Idempotent.
-- (Alternatively create the bucket in Dashboard → Storage and make it public.)
-- ============================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-photos', 'recipe-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- NOTE: no broad SELECT policy on storage.objects. A *public* bucket already
-- serves object URLs via the public CDN endpoint without one; adding a
-- "FOR SELECT USING (bucket_id = ...)" policy only lets clients LIST every file
-- (advisor lint 0025 public_bucket_allows_listing). The app uses direct public
-- URLs, so we deliberately omit it.
DROP POLICY IF EXISTS "recipe_photos_read" ON storage.objects;

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
