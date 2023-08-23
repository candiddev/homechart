ALTER TABLE auth_account
	DROP COLUMN hide_home_components;
ALTER TABLE notification
	RENAME COLUMN subject TO subject_smtp;
ALTER TABLE notification
	RENAME constraint subject_length TO subject_smtp_length;
ALTER TABLE notification
	ADD COLUMN subject_fcm TEXT NOT NULL DEFAULT '';
ALTER TABLE notification
	ADD CONSTRAINT subject_fcm_length CHECK (char_length(subject_fcm) <= 1000);

CREATE TABLE change (
	  auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE NOT NULL
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE NOT NULL
	 , id UUID PRIMARY KEY
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT current_timestamp
	, name TEXT NOT NULL DEFAULT ''
	, table_name TEXT NOT NULL DEFAULT ''
	, operation SMALLINT NOT NULL DEFAULT 0
);

CREATE INDEX change_auth_household_id
	ON change (auth_household_id);
CREATE INDEX change_updated
	ON change USING BRIN (updated);
