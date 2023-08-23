CREATE OR REPLACE TRIGGER adiu_auth_account_auth_household_notify
	AFTER DELETE OR INSERT OR UPDATE ON auth_account_auth_household
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_auth_account_auth_household_noop
	BEFORE UPDATE ON auth_account_auth_household
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_auth_account_auth_household_updated
	BEFORE UPDATE ON auth_account_auth_household
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION auth_account_auth_household_update_auth_account()
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE'
	THEN
		UPDATE auth_account
		SET primary_auth_household_id = new.auth_household_id
		WHERE id = new.auth_account_id
		AND primary_auth_household_id IS NULL;

		RETURN new;
	END IF;

	UPDATE auth_account
	SET primary_auth_household_id = null
	WHERE primary_auth_household_id = old.auth_household_id
	AND id = old.auth_account_id;

	RETURN old;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ai_auth_account_auth_household_auth_account 
	AFTER INSERT ON auth_account_auth_household
	FOR EACH ROW
	EXECUTE FUNCTION auth_account_auth_household_update_auth_account();
CREATE OR REPLACE TRIGGER au_auth_account_auth_household_auth_account 
	AFTER UPDATE ON auth_account_auth_household
	FOR EACH ROW WHEN (
		old.auth_account_id IS DISTINCT FROM new.auth_account_id 
	)
	EXECUTE FUNCTION auth_account_auth_household_update_auth_account();
CREATE OR REPLACE TRIGGER bd_auth_account_auth_household_auth_account
	BEFORE DELETE ON auth_account_auth_household
	FOR EACH ROW
	EXECUTE FUNCTION auth_account_auth_household_update_auth_account();
