-- Add source column to shopping_list for tracking how items were added
-- Values: 'manual' (default), 'planner' (from meal plan), 'low-stock' (from pantry alert)
alter table shopping_list add column if not exists source text default 'manual';
