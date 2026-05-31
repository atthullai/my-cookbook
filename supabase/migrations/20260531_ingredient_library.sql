create table if not exists ingredients (
  id                  uuid primary key default gen_random_uuid(),
  name_en             text not null unique,
  name_de             text,
  synonyms            text[]  not null default '{}',
  category            text,
  default_unit        text,
  density             float,
  weight_per_tsp      float,
  weight_per_tbsp     float,
  weight_per_cup      float,
  weight_per_piece    float,
  weight_per_sprig    float,
  edible_portion      float not null default 1.0,
  weight_confidence   text not null default 'unknown'
    check (weight_confidence in ('exact','measured','estimated','unknown')),
  created_at          timestamptz not null default now()
);

create index if not exists ingredients_synonyms_gin
  on ingredients using gin(synonyms);

create index if not exists ingredients_category_idx
  on ingredients(category);
