-- ingredients is a shared read-only library — any authenticated user can read it,
-- but only service-role (seed scripts) can write.

ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;

-- Allow any signed-in user to read
DROP POLICY IF EXISTS "ingredients_read" ON ingredients;
CREATE POLICY "ingredients_read" ON ingredients
  FOR SELECT
  USING (auth.role() = 'authenticated');
