create table if not exists equipment (
  id          uuid primary key default gen_random_uuid(),
  name_en     text not null unique,
  name_de     text,
  synonyms    text[]  not null default '{}',
  category    text,
  created_at  timestamptz not null default now()
);

create index if not exists equipment_synonyms_gin
  on equipment using gin(synonyms);

create index if not exists equipment_category_idx
  on equipment(category);
