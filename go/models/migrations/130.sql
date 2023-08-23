ALTER TABLE auth_account
	  ADD COLUMN public_key TEXT NOT NULL DEFAULT ''
	, ADD COLUMN private_keys JSONB NOT NULL DEFAULT '[]';

CREATE TABLE secrets_vault (
	  auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, id UUID PRIMARY KEY
	, keys JSONB
	, icon TEXT NOT NULL DEFAULT ''
	, name TEXT NOT NULL DEFAULT ''
	, short_id TEXT NOT NULL CHECK (short_id <> '')
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

	, CONSTRAINT auth_account_household CHECK ((auth_account_id IS NULL) != (auth_household_id IS NULL)) /* only one column can have a value */
	, CONSTRAINT icon_length CHECK (CHAR_LENGTH(icon) <= 100)
	, CONSTRAINT name_length CHECK (CHAR_LENGTH(name) <= 500)
);

CREATE INDEX secrets_vault_auth_account
	ON secrets_vault (auth_account_id);
CREATE INDEX secrets_vault_auth_household
	ON secrets_vault (auth_household_id);
CREATE INDEX secrets_vault_updated
	ON secrets_vault USING BRIN (updated);

CREATE TABLE secrets_value (
	  data_encrypted TEXT[]
	, name_encrypted TEXT NOT NULL DEFAULT ''
	, tags_encrypted TEXT NOT NULL DEFAULT ''
	, short_id TEXT NOT NULL CHECK (short_id <> '')
	, id UUID PRIMARY KEY
	, secrets_vault_id UUID NOT NULL REFERENCES secrets_vault (id) ON DELETE CASCADE
	, deleted TIMESTAMP WITH TIME ZONE
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

	, CONSTRAINT name_encrypted_length CHECK (CHAR_LENGTH(name_encrypted) <= 500)
);

CREATE INDEX secrets_value_version_updated
	ON secrets_value USING BRIN (updated);
CREATE INDEX secrets_value_secret_vault_id
	ON secrets_value (secrets_vault_id);

ALTER TABLE notes_page
	DROP CONSTRAINT notes_page_auth_account_parent_id_name;
ALTER TABLE notes_page
	DROP CONSTRAINT notes_page_auth_household_parent_id_name;

CREATE UNIQUE INDEX notes_page_name
	ON notes_page (COALESCE(parent_id, COALESCE(auth_account_id, auth_household_id)), name);

ALTER TABLE shop_list
	ADD UNIQUE (auth_account_id, name);
ALTER TABLE shop_list
	ADD UNIQUE (auth_household_id, name);
