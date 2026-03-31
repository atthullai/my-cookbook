-- Run this in Supabase SQL editor.
-- It upgrades recipes into a fully editable bilingual cookbook model.

alter table public.recipes
  add column if not exists slug text,
  add column if not exists author_name text default 'Saran',
  add column if not exists learned_from text,
  add column if not exists description_en text,
  add column if not exists description_de text,
  add column if not exists notes_en text,
  add column if not exists notes_de text,
  add column if not exists source_url text,
  add column if not exists video_url text,
  add column if not exists servings integer,
  add column if not exists equipment jsonb default '[]'::jsonb,
  add column if not exists image_urls text[] default '{}'::text[];

update public.recipes
set slug = lower(regexp_replace(coalesce(title_en, id::text), '[^a-zA-Z0-9]+', '-', 'g'))
where slug is null or slug = '';

create unique index if not exists recipes_user_slug_idx on public.recipes (user_id, slug);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  display_name text default 'Saran',
  about_me_en text,
  about_me_de text
);
