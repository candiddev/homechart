CREATE DOMAIN permission SMALLINT CHECK (VALUE >= 0 AND VALUE <= 2);

CREATE TABLE auth_account_auth_household (
	  auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	, color SMALLINT NOT NULL DEFAULT 0 CHECK (color >= 0)
	, id UUID PRIMARY KEY
	, email_address TEXT NOT NULL DEFAULT ''
	, invite_token TEXT NOT NULL DEFAULT ''
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, permissions JSONB NOT NULL DEFAULT '{}'

	, UNIQUE (auth_account_id, auth_household_id)
);

INSERT INTO auth_account_auth_household (
	  auth_account_id
	, auth_household_id
	, color
	, id
	, permissions
)
SELECT
	  id
	, auth_household_id
	, color
	, id
	, JSON_BUILD_OBJECT(
			'auth', (permissions -> 'authHousehold')::permission
		, 'budget', (permissions -> 'budget')::permission
		, 'calendar', (permissions -> 'calendarHousehold')::permission
		, 'cook', (permissions -> 'cook')::permission
		, 'health', (permissions -> 'healthHousehold')::permission
		, 'inventory', (permissions -> 'inventory')::permission
		, 'notes', (permissions -> 'notesHousehold')::permission
		, 'plan', (permissions -> 'planHousehold')::permission
		, 'reward', (permissions -> 'reward')::permission
		, 'shop', (permissions -> 'shopHousehold')::permission
	)
FROM auth_account;

ALTER TABLE auth_account
	DROP COLUMN color;
ALTER TABLE auth_account
	DROP COLUMN short_id;
ALTER TABLE auth_account
	DROP COLUMN permissions;
ALTER TABLE auth_account
	RENAME COLUMN auth_household_id TO primary_auth_household_id;
ALTER TABLE auth_account
	ALTER COLUMN primary_auth_household_id DROP NOT NULL;
ALTER TABLE auth_account
	DROP CONSTRAINT auth_account_auth_household_id_fkey;
ALTER TABLE auth_account
	ADD CONSTRAINT auth_account_primary_auth_household_id_fkey FOREIGN KEY (id, primary_auth_household_id) REFERENCES auth_account_auth_household (auth_account_id, auth_household_id) ON DELETE NO ACTION;

UPDATE auth_account SET name = 'Homecharter' WHERE name = '';

ALTER TABLE auth_account
	ADD CONSTRAINT name_length check (char_length(name) <= 1000 AND char_length(name) > 0);

DROP TRIGGER IF EXISTS ai_auth_household ON auth_account;
DROP TRIGGER IF EXISTS bi_auth_account_short_id ON auth_account;

DROP FUNCTION IF EXISTS auth_account_update_auth_household;
DROP FUNCTION IF EXISTS auth_account_set_short_id;

ALTER TABLE auth_household
	ADD COLUMN name TEXT NOT NULL DEFAULT '';
UPDATE auth_household SET name = 'Homecharter';
ALTER TABLE auth_household
	ADD CONSTRAINT name_length check (char_length(name) <= 1000 AND char_length(name) > 0);
ALTER TABLE auth_household
	DROP COLUMN last_id_auth_account;

ALTER TABLE auth_session
	ADD COLUMN permissions_account JSONB NOT NULL DEFAULT '{}';
ALTER TABLE auth_session
	ADD COLUMN permissions_households JSONB NOT NULL DEFAULT '[]';

WITH a AS (
	SELECT
		id
	, json_build_object(
				'auth', (permissions -> 'authAccount')::permission
			, 'budget', (permissions -> 'budget')::permission
			, 'calendar', (permissions -> 'calendarPersonal')::permission
			, 'cook', (permissions -> 'cook')::permission
			, 'health', (permissions -> 'healthPersonal')::permission
			, 'inventory', (permissions -> 'inventory')::permission
			, 'notes', (permissions -> 'notesPersonal')::permission
			, 'plan', (permissions -> 'planPersonal')::permission
			, 'reward', (permissions -> 'reward')::permission
			, 'shop', (permissions -> 'shopPersonal')::permission
		) AS permissions_account
	, json_agg(
			json_build_object(
					'authHouseholdID', auth_household_id
				, 'permissions', json_build_object(
						'auth', (permissions -> 'authHousehold')::permission
					, 'budget', (permissions -> 'budget')::permission
					, 'calendar', (permissions -> 'calendarHousehold')::permission
					, 'cook', (permissions -> 'cook')::permission
					, 'health', (permissions -> 'healthHousehold')::permission
					, 'inventory', (permissions -> 'inventory')::permission
					, 'notes', (permissions -> 'notesHousehold')::permission
					, 'plan', (permissions -> 'planHousehold')::permission
					, 'reward', (permissions -> 'reward')::permission
					, 'shop', (permissions -> 'shopHousehold')::permission
				)
			)
		) AS permissions_households
	FROM auth_session
	GROUP BY id
)
UPDATE auth_session
SET
		permissions_account = a.permissions_account
	, permissions_households = a.permissions_households
FROM a
WHERE auth_session.id = a.id;

ALTER TABLE auth_session
	DROP CONSTRAINT IF EXISTS auth_session_auth_account_id_auth_household_id_fkey;
ALTER TABLE auth_session
	DROP CONSTRAINT IF EXISTS auth_session_auth_account_id_fkey;
ALTER TABLE auth_session
	ADD CONSTRAINT auth_session_auth_account_id_fkey FOREIGN KEY (auth_account_id) REFERENCES auth_account (id) ON DELETE CASCADE;
ALTER TABLE auth_session
	DROP COLUMN auth_household_id;
ALTER TABLE auth_session
	DROP COLUMN permissions;

ALTER TABLE health_item
	DROP COLUMN auth_household_id;
ALTER TABLE health_item
	ADD CONSTRAINT auth_account_id_name UNIQUE (auth_account_id, name);
ALTER TABLE health_log
	DROP COLUMN auth_household_id;
