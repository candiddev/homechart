ALTER TABLE inventory_item
  ADD COLUMN image TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_item
  ADD CONSTRAINT image_length check (char_length(image) <= 50000);
ALTER TABLE inventory_view
  ADD COLUMN icon TEXT NOT NULL DEFAULT '';
ALTER TABLE inventory_view
  ADD CONSTRAINT icon_length check (char_length(icon) <= 100);
