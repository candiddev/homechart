ALTER TABLE auth_account
	RENAME COLUMN ical_id to icalendar_id;
ALTER TABLE auth_account
	ADD COLUMN hide_calendar_icalendars TEXT[];

CREATE TABLE calendar_icalendar (
	  auth_account_id UUID REFERENCES auth_account (id) ON DELETE CASCADE
	, auth_household_id UUID REFERENCES auth_household (id) ON DELETE CASCADE
	, id UUID PRIMARY KEY
	, created TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, updated TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
	, if_modified_since TEXT NOT NULL DEFAULT ''
	, crc TEXT NOT NULL DEFAULT ''
	, name TEXT NOT NULL CHECK (name <> '') 
	, url TEXT NOT NULL

	, CONSTRAINT auth_account_household CHECK ((auth_account_id IS NULL) != (auth_household_id IS NULL)) /* only one column can have a value */
	, CONSTRAINT name CHECK (CHAR_LENGTH(name) <= 1000)
	, CONSTRAINT url CHECK (CHAR_LENGTH(url) <= 1000)

	, UNIQUE (auth_account_id, name)
	, UNIQUE (auth_household_id, name)
);

CREATE INDEX calendar_icalendar_auth_account
	ON calendar_icalendar (auth_account_id);
CREATE INDEX calendar_icalendar_auth_household
	ON calendar_icalendar (auth_household_id);

ALTER TABLE calendar_event
	  ADD COLUMN calendar_icalendar_id UUID REFERENCES calendar_icalendar (id) ON DELETE CASCADE
	, ADD COLUMN icalendar_uid TEXT NOT NULL DEFAULT '';

CREATE INDEX calendar_event_calendar_icalendar
	ON calendar_event (calendar_icalendar_id);
