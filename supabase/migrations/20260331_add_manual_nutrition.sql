-- Run this in the Supabase SQL editor to store manual nutrition facts per recipe.

alter table public.recipes
  add column if not exists nutrition jsonb;
