ALTER TABLE auth_account
	ADD COLUMN ical_id UUID,
	ADD UNIQUE (ical_id);

CREATE INDEX auth_account_ical_id
	ON auth_account (ical_id);
