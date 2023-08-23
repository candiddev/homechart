CREATE TABLE shop_list (
	  auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, id UUID PRIMARY KEY
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, short_id INT NOT NULL DEFAULT 0
	, shop_item_count INT NOT NULL DEFAULT 0
	, name TEXT NOT NULL CHECK (name <> '')

	, CONSTRAINT auth_account_household CHECK ((auth_account_id is null) != (auth_household_id is null)) /* only one column can have a value */
	, CONSTRAINT name_length CHECK (char_length(name) <= 500)

	, UNIQUE (auth_account_id, short_id)
	, UNIQUE (auth_household_id, short_id)
);

CREATE INDEX shop_list_auth_household
	ON shop_list (auth_household_id);
CREATE INDEX shop_list_auth_account
	ON shop_list (auth_account_id);

ALTER TABLE auth_account
	ADD COLUMN last_id_shop_list INT NOT NULL DEFAULT 0;

ALTER TABLE auth_household
	ADD COLUMN last_id_shop_list INT NOT NULL DEFAULT 0;

ALTER TABLE shop_item
	ADD COLUMN auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE,
	ADD COLUMN shop_list_id UUID REFERENCES shop_list (id) ON DELETE CASCADE;

ALTER TABLE shop_item
	ALTER COLUMN auth_household_id DROP NOT NULL;
