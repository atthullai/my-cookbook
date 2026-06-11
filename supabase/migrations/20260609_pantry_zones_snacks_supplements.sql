-- ============================================================
-- Pantry tracking v2: storage zones, food state, snack/eat events,
-- supplements, and saved quick combos.
-- Run in Supabase → SQL Editor → New Query → Run. Idempotent.
-- Owner-scoped RLS, mirroring the other per-user tables.
-- ============================================================

-- ── pantry_items: new tracking columns ───────────────────────────────────────
-- (storage_location / is_opened / opened_date / is_frozen already exist live;
--  re-declared here as IF NOT EXISTS so the schema is self-documenting.)
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS storage_location   text    DEFAULT 'room-temp';
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS is_opened          boolean DEFAULT false;
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS opened_date        date;
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS is_frozen          boolean DEFAULT false;
-- v2 axes: source (who made it), readiness (eat as-is), flex zone, prep portions
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS source             text    DEFAULT 'store-bought'; -- store-bought | homemade
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS is_ready           boolean DEFAULT false;          -- ready-to-eat
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS is_flex            boolean DEFAULT false;          -- ok at room-temp OR fridge
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS recipe_id          int8;                           -- link to the recipe that produced it
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS portions_total     numeric(10,2);                  -- bulk-prep batch size (in servings)
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS portions_remaining numeric(10,2);
ALTER TABLE public.pantry_items ADD COLUMN IF NOT EXISTS unit_profile       jsonb;                          -- { slice: g, piece: g, whole: g } per-item partial-unit weights

-- ── supplements: serving-based tracking (separate from food) ──────────────────
CREATE TABLE IF NOT EXISTS public.supplements (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name                   text NOT NULL,
  brand                  text,
  servings_per_container numeric(10,2),
  servings_remaining     numeric(10,2),
  daily_servings         numeric(10,2) DEFAULT 1,
  reorder_at_days        int4          DEFAULT 7,    -- remind to reorder when <= this many days left
  last_taken_on          date,
  notes                  text,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);
ALTER TABLE public.supplements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "supplements_owner" ON public.supplements;
CREATE POLICY "supplements_owner" ON public.supplements
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── consumption_log: an "eat event" (recipe, snack, or ad-hoc combo) ──────────
CREATE TABLE IF NOT EXISTS public.consumption_log (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label       text,                          -- snack / combo name
  combo_id    uuid,                          -- if logged from a saved quick_combo
  items       jsonb NOT NULL DEFAULT '[]',   -- [{ ref, name, qty, unit, base, baseUnit }]
  supplements jsonb NOT NULL DEFAULT '[]',   -- [{ id, name, servings }]
  logged_at   timestamptz DEFAULT now()
);
ALTER TABLE public.consumption_log ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "consumption_log_owner" ON public.consumption_log;
CREATE POLICY "consumption_log_owner" ON public.consumption_log
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ── quick_combos: a saved snack you can re-log in one tap ──────────────────────
CREATE TABLE IF NOT EXISTS public.quick_combos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  items       jsonb NOT NULL DEFAULT '[]',   -- [{ ref, name, qty, unit }]
  supplements jsonb NOT NULL DEFAULT '[]',   -- [{ id, name, servings }]
  created_at  timestamptz DEFAULT now()
);
ALTER TABLE public.quick_combos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "quick_combos_owner" ON public.quick_combos;
CREATE POLICY "quick_combos_owner" ON public.quick_combos
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
