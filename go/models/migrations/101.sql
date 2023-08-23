CREATE UNLOGGED TABLE cache (
	  auth_account_id UUID
	, auth_household_id UUID
	, expires TIMESTAMP WITH TIME ZONE NOT NULL
	, id UUID PRIMARY KEY
	, table_name TEXT NOT NULL CHECK (table_name <> '')
	, value BYTEA

	, UNIQUE (auth_account_id, auth_household_id, id, table_name)
);
