-- Run this in the Supabase SQL editor to support richer cookbook sections.

alter table public.recipes
  add column if not exists tips_en text,
  add column if not exists tips_de text,
  add column if not exists storage_en text,
  add column if not exists storage_de text,
  add column if not exists faq jsonb default '[]'::jsonb,
  add column if not exists troubleshooting jsonb default '[]'::jsonb,
  add column if not exists step_photos jsonb default '[]'::jsonb;
