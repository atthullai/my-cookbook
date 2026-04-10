alter table public.recipes
  add column if not exists cuisine_de text,
  add column if not exists course_de text,
  add column if not exists difficulty_de text;

update public.recipes
set cuisine_de = case
  when cuisine_de is not null and trim(cuisine_de) <> '' then cuisine_de
  when lower(coalesce(cuisine, '')) = 'indian' then 'Indisch'
  when lower(coalesce(cuisine, '')) = 'south indian' then 'Sudindisch'
  when lower(coalesce(cuisine, '')) = 'north indian' then 'Nordindisch'
  else cuisine
end,
course_de = case
  when course_de is not null and trim(course_de) <> '' then course_de
  when lower(coalesce(course, '')) = 'breakfast' then 'Fruhstuck'
  when lower(coalesce(course, '')) = 'lunch' then 'Mittagessen'
  when lower(coalesce(course, '')) = 'dinner' then 'Abendessen'
  when lower(coalesce(course, '')) = 'dessert' then 'Dessert'
  when lower(coalesce(course, '')) = 'main course' then 'Hauptgericht'
  when lower(coalesce(course, '')) = 'side dish' then 'Beilage'
  else course
end,
difficulty_de = case
  when difficulty_de is not null and trim(difficulty_de) <> '' then difficulty_de
  when lower(coalesce(difficulty, '')) = 'easy' then 'Einfach'
  when lower(coalesce(difficulty, '')) = 'beginner' then 'Anfanger'
  when lower(coalesce(difficulty, '')) = 'intermediate' then 'Mittel'
  when lower(coalesce(difficulty, '')) = 'advanced' then 'Fortgeschritten'
  when lower(coalesce(difficulty, '')) = 'expert' then 'Experte'
  else difficulty
end;
