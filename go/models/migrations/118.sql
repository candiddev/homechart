ALTER TABLE auth_household
  RENAME COLUMN last_id_inventory_view TO last_id_inventory_collection;
ALTER TABLE budget_category
  RENAME COLUMN header TO grouping;
ALTER TABLE inventory_view
  RENAME TO inventory_collection;
ALTER TABLE inventory_collection
  ADD COLUMN grouping TEXT NOT NULL DEFAULT 'No Group' CHECK (grouping <> '');
ALTER TABLE inventory_collection
  DROP CONSTRAINT IF EXISTS inventory_view_name_check;
ALTER TABLE inventory_collection
  RENAME CONSTRAINT inventory_view_auth_household_id_fkey TO inventory_collection_auth_household_id_fkey;
ALTER TABLE shop_list
  ADD COLUMN icon TEXT NOT NULL DEFAULT 'CHECK (char_length(icon) <= 1000)';

ALTER INDEX inventory_view_pkey
  RENAME TO inventory_collection_pkey;
ALTER INDEX inventory_view_auth_household_id_fkey
  RENAME TO inventory_collection_auth_household_id_fkey;
ALTER INDEX inventory_view_updated
  RENAME TO inventory_collection_updated;

DROP TRIGGER IF EXISTS adiu_inventory_view_notify ON inventory_collection;
DROP TRIGGER IF EXISTS ai_auth_household ON inventory_collection;
DROP TRIGGER IF EXISTS bi_inventory_view_short_id ON inventory_collection;
DROP TRIGGER IF EXISTS bu_inventory_view_noop ON inventory_collection;

DROP FUNCTION IF EXISTS inventory_view_set_short_id;
DROP FUNCTION IF EXISTS inventory_view_update_auth_household;

UPDATE budget_category SET updated = current_timestamp;
