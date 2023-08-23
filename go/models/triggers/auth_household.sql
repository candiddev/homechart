CREATE OR REPLACE TRIGGER adiu_auth_household_notify
	AFTER DELETE OR INSERT OR UPDATE ON auth_household
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_auth_household_noop
	BEFORE UPDATE ON auth_household
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_auth_household_updated
	BEFORE UPDATE ON auth_household
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION auth_household_set_notified() 
RETURNS trigger AS $$
BEGIN
	new.notified_expired = false;
	new.notified_expiring = false;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bu_auth_household_notified
	BEFORE UPDATE ON auth_household
	FOR EACH ROW WHEN (
		old.subscription_expires IS DISTINCT FROM new.subscription_expires
	)
	EXECUTE FUNCTION auth_household_set_notified();

CREATE OR REPLACE FUNCTION auth_household_update_self_hosted_household() 
RETURNS trigger AS $$
BEGIN
	INSERT INTO self_hosted_household (
		  id
		, households
	) VALUES (
		  new.self_hosted_id
		, 1
	)
	ON CONFLICT (id)
	DO UPDATE
	SET households = self_hosted_household.households + 1;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ai_auth_household_self_hosted_household
	AFTER INSERT ON auth_household
	FOR EACH ROW WHEN (
		new.self_hosted_id IS NOT NULL
	)
	EXECUTE FUNCTION auth_household_update_self_hosted_household();
CREATE OR REPLACE TRIGGER au_auth_household_self_hosted_household
	AFTER UPDATE ON auth_household
	FOR EACH ROW WHEN (
		old.self_hosted_id IS DISTINCT FROM new.self_hosted_id
	)
	EXECUTE FUNCTION auth_household_update_self_hosted_household();
