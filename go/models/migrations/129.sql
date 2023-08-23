CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION generate_nanoid()
RETURNS TEXT AS $$
DECLARE
	alphabet TEXT := '0123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
	alphabetIndex INT;
	bytes BYTEA;
	i INT := 0;
	idBuilder TEXT := '';
	mask INT;
	size INT := 14;
	step INT;
BEGIN
	mask := (2 << CAST(FLOOR(LOG(LENGTH(alphabet) - 1) / LOG(2)) AS INT)) - 1;
	step := CAST(CEIL(1.6 * mask * size / LENGTH(alphabet)) AS INT);

	WHILE TRUE
	LOOP
		bytes := gen_random_bytes(size);

		WHILE i < size
		LOOP
			alphabetIndex := (get_byte(bytes, i) & mask) + 1;

			IF alphabetIndex <= LENGTH(alphabet)
			THEN
				idBuilder := idBuilder || substr(alphabet, alphabetIndex, 1);

				IF LENGTH(idBuilder) = size
				THEN
					RETURN idBuilder;
				END IF;
			END IF;

		i = i + 1;
		END LOOP;

	i := 0;
	END LOOP;
END
$$ LANGUAGE plpgsql;

ALTER TABLE auth_account
	DROP COLUMN last_id_bookmark;
ALTER TABLE auth_household
	DROP COLUMN last_id_bookmark;
ALTER TABLE bookmark
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS bookmark_set_short_id CASCADE;
DROP FUNCTION IF EXISTS bookmark_update_auth_account CASCADE;
DROP FUNCTION IF EXISTS bookmark_update_auth_household CASCADE;
ALTER TABLE bookmark
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE bookmark
SET
	short_id = generate_nanoid();
ALTER TABLE bookmark
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_household
	DROP COLUMN last_id_budget_account;
ALTER TABLE budget_account
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS budget_account_set_short_id CASCADE;
DROP FUNCTION IF EXISTS budget_account_update_auth_household CASCADE;
ALTER TABLE budget_account
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE budget_account
SET
	short_id = generate_nanoid();
ALTER TABLE budget_account
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_household
	DROP COLUMN last_id_budget_category;
ALTER TABLE budget_category
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS budget_category_set_short_id CASCADE;
DROP FUNCTION IF EXISTS budget_category_update_auth_household CASCADE;
ALTER TABLE budget_category
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE budget_category
SET
	short_id = generate_nanoid();
ALTER TABLE budget_category
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_household
	DROP COLUMN last_id_budget_payee;
ALTER TABLE budget_payee
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS budget_payee_set_short_id CASCADE;
DROP FUNCTION IF EXISTS budget_payee_update_auth_household CASCADE;
ALTER TABLE budget_payee
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE budget_payee
SET
	short_id = generate_nanoid();
ALTER TABLE budget_payee
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_household
	DROP COLUMN last_id_cook_recipe;
ALTER TABLE cook_recipe
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS cook_recipe_set_short_id CASCADE;
DROP FUNCTION IF EXISTS cook_recipe_update_auth_household CASCADE;
ALTER TABLE cook_recipe
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE cook_recipe
SET
	short_id = generate_nanoid();
ALTER TABLE cook_recipe
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_household
	DROP COLUMN last_id_inventory_collection;
ALTER TABLE inventory_collection
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS inventory_collection_set_short_id CASCADE;
DROP FUNCTION IF EXISTS inventory_collection_update_auth_household CASCADE;
ALTER TABLE inventory_collection
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE inventory_collection
SET
	short_id = generate_nanoid();
ALTER TABLE inventory_collection
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_household
	DROP COLUMN last_id_inventory_item;
ALTER TABLE inventory_item
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS inventory_item_set_short_id CASCADE;
DROP FUNCTION IF EXISTS inventory_item_update_auth_household CASCADE;
ALTER TABLE inventory_item
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE inventory_item
SET
	short_id = generate_nanoid();
ALTER TABLE inventory_item
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_account
	DROP COLUMN last_id_notes_page;
ALTER TABLE auth_household
	DROP COLUMN last_id_notes_page;
ALTER TABLE notes_page
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS notes_page_set_short_id CASCADE;
DROP TRIGGER IF EXISTS ai_auth_account ON notes_page;
DROP TRIGGER IF EXISTS au_auth_account ON notes_page;
DROP TRIGGER IF EXISTS ai_auth_household ON notes_page;
DROP TRIGGER IF EXISTS au_auth_household ON notes_page;
ALTER TABLE notes_page
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE notes_page
SET
	short_id = generate_nanoid();
ALTER TABLE notes_page
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_account
	DROP COLUMN last_id_plan_project;
ALTER TABLE auth_household
	DROP COLUMN last_id_plan_project;
ALTER TABLE plan_project
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS plan_project_set_short_id CASCADE;
DROP TRIGGER IF EXISTS ai_auth_account ON plan_project;
DROP TRIGGER IF EXISTS au_auth_account ON plan_project;
DROP TRIGGER IF EXISTS ai_auth_household ON plan_project;
DROP TRIGGER IF EXISTS au_auth_household ON plan_project;
ALTER TABLE plan_project
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE plan_project
SET
	short_id = generate_nanoid();
ALTER TABLE plan_project
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_account
	DROP COLUMN last_id_plan_task;
ALTER TABLE auth_household
	DROP COLUMN last_id_plan_task;
ALTER TABLE plan_task
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS plan_task_set_short_id CASCADE;
DROP TRIGGER IF EXISTS ai_auth_account ON plan_task;
DROP TRIGGER IF EXISTS au_auth_account ON plan_task;
DROP TRIGGER IF EXISTS ai_auth_household ON plan_task;
DROP TRIGGER IF EXISTS au_auth_household ON plan_task;
ALTER TABLE plan_task
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE plan_task
SET
	short_id = generate_nanoid();
ALTER TABLE plan_task
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_household
	DROP COLUMN last_id_reward_card;
ALTER TABLE reward_card
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS reward_card_set_short_id CASCADE;
DROP FUNCTION IF EXISTS reward_card_update_auth_household CASCADE;
ALTER TABLE reward_card
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE reward_card
SET
	short_id = generate_nanoid();
ALTER TABLE reward_card
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

ALTER TABLE auth_account
	DROP COLUMN last_id_shop_list;
ALTER TABLE auth_household
	DROP COLUMN last_id_shop_list;
ALTER TABLE shop_list
	DROP COLUMN short_id;
DROP FUNCTION IF EXISTS shop_list_set_short_id CASCADE;
DROP FUNCTION IF EXISTS shop_list_update_auth_account CASCADE;
DROP FUNCTION IF EXISTS shop_list_update_auth_household CASCADE;
ALTER TABLE shop_list
	ADD COLUMN short_id TEXT NOT NULL DEFAULT '';
UPDATE shop_list
SET
	short_id = generate_nanoid();
ALTER TABLE shop_list
	ADD CONSTRAINT short_id_length CHECK (short_id <> '');

DROP FUNCTION IF EXISTS generate_nanoid;
DROP EXTENSION IF EXISTS pgcrypto;
