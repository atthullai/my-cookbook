-- Expands the recipes table for a richer cookbook experience.
-- Run this once in Supabase SQL editor before wiring add/edit forms to these extra columns.

alter table public.recipes
  add column if not exists description_en text,
  add column if not exists description_de text,
  add column if not exists notes_en text,
  add column if not exists notes_de text,
  add column if not exists source_url text,
  add column if not exists video_url text,
  add column if not exists servings integer,
  add column if not exists equipment text[] default '{}'::text[],
  add column if not exists image_urls text[] default '{}'::text[];
