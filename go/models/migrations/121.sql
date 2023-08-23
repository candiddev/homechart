ALTER TABLE shop_list
  DROP COLUMN icon;
ALTER TABLE shop_list
  ADD COLUMN icon TEXT NOT NULL DEFAULT '' CHECK (char_length(icon) <= 1000);
