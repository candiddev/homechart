CREATE TABLE health_item (
		id UUID PRIMARY KEY
	, auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE NOT NULL
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, color SMALLINT NOT NULL DEFAULT 0 CHECK (color >= 0)
	, total_correlations SMALLINT NOT NULL DEFAULT 0 CHECK (total_correlations >= 0)
	, correlations JSONB NOT NULL DEFAULT '{}'
	, output BOOLEAN NOT NULL DEFAULT false
	, name TEXT NOT NULL CHECK (name <> '')
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP

	, CONSTRAINT name_length CHECK (char_length(name) <= 500)

	, UNIQUE (auth_account_id, auth_household_id, name)
);

CREATE TABLE health_log (
	  id UUID PRIMARY KEY
	, auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE NOT NULL
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, health_item_id UUID REFERENCES health_item (id) ON DELETE CASCADE NOT NULL
	, timestamp TIMESTAMP WITH TIME ZONE NOT NULL
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
);

CREATE INDEX health_item_auth_account_id_fkey
	ON health_item (auth_account_id);
CREATE INDEX health_item_auth_household_id_fkey
	ON health_item (auth_household_id);
CREATE INDEX health_item_updated
	ON health_item USING BRIN (updated);
CREATE INDEX health_log_auth_account_id_fkey
	ON health_log (auth_account_id);
CREATE INDEX health_log_auth_household_id_fkey
	ON health_log (auth_household_id);
CREATE INDEX health_log_health_item_id_fkey
	ON health_log (health_item_id);
CREATE INDEX health_log_updated
	ON health_log USING BRIN (updated);
