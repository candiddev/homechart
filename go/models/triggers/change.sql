CREATE OR REPLACE TRIGGER adiu_change_notify
	AFTER DELETE OR INSERT OR UPDATE ON change
	FOR EACH ROW
	EXECUTE FUNCTION notify();

CREATE OR REPLACE FUNCTION change_delete()
RETURNS TRIGGER AS $$
BEGIN
	DELETE FROM change
	WHERE
		auth_household_id = new.auth_household_id
		AND id NOT IN (
			SELECT id FROM change WHERE auth_household_id = new.auth_household_id ORDER BY updated DESC LIMIT 50
		);

		RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ai_change_delete
	AFTER INSERT ON change
	FOR EACH ROW
	EXECUTE FUNCTION change_delete();
