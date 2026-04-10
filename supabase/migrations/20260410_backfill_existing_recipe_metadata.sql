-- Run this after 20260410_expand_recipe_metadata.sql.
-- It upgrades older saved recipe rows so they benefit from the new app structure
-- without forcing you to open and resave every recipe manually.

update public.recipes
set author_name = 'Atthuzhai'
where author_name is null
   or trim(author_name) = ''
   or author_name in ('Saran', 'Atthullai');

update public.user_profiles
set display_name = 'Atthuzhai'
where display_name is null
   or trim(display_name) = ''
   or display_name = 'Saran';

update public.recipes
set cover_image_url = image_urls[1]
where (cover_image_url is null or trim(cover_image_url) = '')
  and image_urls is not null
  and array_length(image_urls, 1) >= 1;

update public.recipes
set total_time = nullif(trim(substring(notes_en from 'Total time:\s*([^\n]+)')), '')
where (total_time is null or trim(total_time) = '')
  and notes_en ilike '%Total time:%';

update public.recipes
set course = case
  when lower(coalesce(category, '')) like '%breakfast%' then 'Breakfast'
  when lower(coalesce(category, '')) like '%lunch%' then 'Lunch'
  when lower(coalesce(category, '')) like '%dinner%' then 'Dinner'
  when lower(coalesce(category, '')) like '%dessert%' then 'Dessert'
  when lower(coalesce(category, '')) like '%rice%' then 'Main Course'
  when lower(coalesce(category, '')) like '%dal%' then 'Main Course'
  when lower(coalesce(category, '')) like '%curry%' then 'Main Course'
  else course
end
where course is null or trim(course) = '';

update public.recipes
set cuisine = case
  when lower(coalesce(title_en, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) ~ 'andhra' then 'Andhra'
  when lower(coalesce(title_en, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) ~ 'tamil|kuzhambu|sambar|poricha|gosthu' then 'South Indian'
  when lower(coalesce(title_en, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) ~ 'biryani|paneer butter masala|pav bhaji|dhaba' then 'Indian'
  else cuisine
end
where cuisine is null or trim(cuisine) = '';

update public.recipes
set badges = (
  select coalesce(array_agg(distinct badge), '{}'::text[])
  from unnest(
    coalesce(badges, '{}'::text[]) ||
    array_remove(array[
      case when lower(coalesce(title_en, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) ~ '(veg|vegetarian|dal|sambar|kuzhambu|paneer)' then 'Veg' end,
      case when lower(coalesce(title_en, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) ~ '(chicken|mutton|fish|egg|beef|prawn)' then 'Non-Veg' end,
      case when lower(coalesce(title_en, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) ~ '(vegan)' then 'Vegan' end,
      case when lower(coalesce(title_en, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) ~ '(spicy|masala|andhra)' then 'Spicy' end,
      case when lower(coalesce(title_en, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) ~ '(quick|instant|pressure cooker|cooker)' then 'Quick Meal' end,
      case when lower(coalesce(title_en, '') || ' ' || coalesce(array_to_string(tags, ' '), '')) ~ '(dal|lentil|paneer|moong|protein)' then 'High Protein' end
    ], null)
  ) as badge
)
where badges is null or array_length(badges, 1) is null or array_length(badges, 1) = 0;

update public.recipes
set instruction_sections = jsonb_build_array(
  jsonb_build_object(
    'title_en', 'Method',
    'title_de', 'Methode',
    'steps_en',
      coalesce(
        (
          select jsonb_agg(regexp_replace(trim(step_line), '^[0-9]+\.\s*', ''))
          from unnest(regexp_split_to_array(coalesce(steps_en, ''), E'\n+')) as step_line
          where trim(step_line) <> ''
        ),
        '[]'::jsonb
      ),
    'steps_de',
      coalesce(
        (
          select jsonb_agg(regexp_replace(trim(step_line), '^[0-9]+\.\s*', ''))
          from unnest(regexp_split_to_array(coalesce(nullif(steps_de, ''), steps_en, ''), E'\n+')) as step_line
          where trim(step_line) <> ''
        ),
        '[]'::jsonb
      )
  )
)
where (instruction_sections is null or instruction_sections = '[]'::jsonb)
  and coalesce(trim(steps_en), '') <> '';
