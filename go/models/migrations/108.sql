ALTER TABLE shop_item
  ADD COLUMN cook_meal_plan_id UUID REFERENCES cook_meal_plan (id) ON DELETE CASCADE;
