CREATE OR REPLACE TRIGGER adiu_calendar_icalendar
	AFTER DELETE OR INSERT OR UPDATE ON calendar_icalendar
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_calendar_icalendar
	BEFORE UPDATE ON calendar_icalendar
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_calendar_icalendar
	BEFORE UPDATE ON calendar_icalendar
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION calendar_icalendar_update_auth_account()
RETURNS trigger AS $$
BEGIN
	UPDATE auth_account
	SET hide_calendar_icalendars = array_remove(hide_calendar_icalendars, old.id::text)
	FROM auth_account_auth_household
	WHERE auth_account.id = old.auth_account_id
	OR (
		auth_account_auth_household.auth_account_id = auth_account.id
		AND auth_account_auth_household.auth_household_id = old.auth_household_id
	);

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_calendar_icalendar
	AFTER DELETE ON calendar_icalendar
	FOR EACH ROW
	EXECUTE FUNCTION calendar_icalendar_update_auth_account();
