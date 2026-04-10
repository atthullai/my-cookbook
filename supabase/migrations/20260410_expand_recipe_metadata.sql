alter table public.recipes
  add column if not exists cuisine text,
  add column if not exists course text,
  add column if not exists difficulty text,
  add column if not exists prep_time text,
  add column if not exists cook_time text,
  add column if not exists total_time text,
  add column if not exists badges text[] default '{}'::text[],
  add column if not exists cover_image_url text,
  add column if not exists instruction_sections jsonb default '[]'::jsonb;

update public.recipes
set badges = '{}'::text[]
where badges is null;

update public.recipes
set cover_image_url = image_urls[1]
where (cover_image_url is null or cover_image_url = '')
  and image_urls is not null
  and array_length(image_urls, 1) >= 1;
