-- ============================================================
-- Planner Queue: a staging area for undated meals (spec "Queue" tab).
-- Run in Supabase → SQL Editor → New Query → Run. Idempotent.
-- Owner-scoped RLS, mirroring the other per-user tables.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.planner_queue (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  int8,
  entry_type text NOT NULL DEFAULT 'recipe',
  label      text,
  food_ref   text,
  food_qty   numeric,
  food_unit  text,
  servings   int4 DEFAULT 1,
  meal_slot  text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.planner_queue ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "planner_queue_owner" ON public.planner_queue;
CREATE POLICY "planner_queue_owner" ON public.planner_queue
  USING      (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
