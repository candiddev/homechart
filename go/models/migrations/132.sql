ALTER TABLE auth_account ADD COLUMN iso_639_code TEXT NOT NULL DEFAULT '';
ALTER TABLE auth_account ADD CONSTRAINT iso_639_code_length CHECK (CHAR_LENGTH(iso_639_code) <= 100);

ALTER TABLE notification DROP COLUMN auth_household_id;
ALTER TABLE notification ADD COLUMN auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE;

ALTER TABLE notification DROP COLUMN recipients_smtp;
ALTER TABLE notification ADD COLUMN newsletter BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE notification ADD COLUMN to_smtp TEXT NOT NULL DEFAULT '';
ALTER TABLE notification RENAME COLUMN recipients_fcm TO to_fcm;

ALTER TABLE budget_transaction DROP COLUMN check_number;

DROP TRIGGER IF EXISTS bi_cook_recipe_notes ON cook_recipe;
DROP TRIGGER IF EXISTS bu_cook_recipe_notes ON cook_recipe;
ALTER TABLE cook_recipe RENAME COLUMN difficulty TO complexity;
UPDATE cook_recipe SET notes = REPLACE(notes::text, '"difficulty"', '"complexity"')::jsonb;
