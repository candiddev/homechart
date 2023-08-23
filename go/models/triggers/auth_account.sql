CREATE OR REPLACE TRIGGER adiu_auth_account_notify
	AFTER DELETE OR INSERT OR UPDATE ON auth_account
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_auth_account_noop
	BEFORE UPDATE ON auth_account
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_auth_account_updated
	BEFORE UPDATE ON auth_account
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION auth_account_remove_oidc() 
RETURNS trigger AS $$
BEGIN
	new.oidc_id = '';
	new.oidc_provider_type = 0;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_auth_account_password_hash
	BEFORE INSERT ON auth_account
	FOR EACH ROW WHEN (
		new.password_hash != ''
	)
	EXECUTE FUNCTION auth_account_remove_oidc();
CREATE OR REPLACE TRIGGER bu_auth_account_password_hash
	BEFORE UPDATE ON auth_account 
	FOR EACH ROW WHEN (
		old.password_hash = '' and new.password_hash != ''
	)
	EXECUTE FUNCTION auth_account_remove_oidc();

CREATE OR REPLACE FUNCTION auth_account_remove_password_hash()
RETURNS trigger AS $$
BEGIN
	new.password_hash = '';
	new.totp_backup = '';
	new.totp_enabled = false;
	new.totp_secret = '';

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_auth_account_oidc
	BEFORE INSERT ON auth_account
	FOR EACH ROW WHEN (
		new.oidc_id != ''
	)
	EXECUTE FUNCTION auth_account_remove_password_hash();
CREATE OR REPLACE TRIGGER bu_auth_account_oidc
	BEFORE UPDATE ON auth_account
	FOR EACH ROW WHEN (
		old.oidc_id = '' and new.oidc_id != ''
	)
	EXECUTE FUNCTION auth_account_remove_password_hash();

CREATE OR REPLACE FUNCTION auth_account_set_daily_agenda_next()
RETURNS trigger AS $$
BEGIN
	new.daily_agenda_notified = false;
	new.daily_agenda_next = (((now() at time zone new.time_zone)::date + INTERVAL '1 day') + new.daily_agenda_time) at time zone new.time_zone;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_auth_account_daily_agenda_next
	BEFORE INSERT ON auth_account
	FOR EACH ROW WHEN (
		new.daily_agenda_next IS NULL
	)
	EXECUTE FUNCTION auth_account_set_daily_agenda_next();
CREATE OR REPLACE TRIGGER bu_auth_account_daily_agenda_notified
	BEFORE UPDATE ON auth_account
	FOR EACH ROW WHEN (
		new.daily_agenda_notified IS TRUE
		OR new.daily_agenda_time IS DISTINCT FROM old.daily_agenda_time
		OR new.time_zone IS DISTINCT FROM old.time_zone
	)
	EXECUTE FUNCTION auth_account_set_daily_agenda_next();

CREATE OR REPLACE FUNCTION auth_account_set_time_zone()
RETURNS trigger AS $$
BEGIN
	new.time_zone = 'UTC';

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER biu_auth_account_time_zone
	BEFORE INSERT OR UPDATE ON auth_account
	FOR EACH ROW WHEN (
		new.time_zone = ''
	)
	EXECUTE FUNCTION auth_account_set_time_zone();

CREATE OR REPLACE FUNCTION auth_account_update_secrets_vault()
RETURNS trigger AS $$
DECLARE
	_auth_account_id uuid;
BEGIN
	IF TG_OP = 'UPDATE'
	THEN
		DELETE FROM secrets_vault
		WHERE auth_account_id = new.id;

		_auth_account_id = new.id;
	ELSE
		_auth_account_id = old.id;
	END IF;

	IF _auth_account_id IS NOT NULL
	THEN
		UPDATE secrets_vault
		SET keys = new_keys
		FROM (
			SELECT secrets_vault.id, JSONB_AGG(k) FILTER (
				WHERE k->>'authAccountID' != _auth_account_id::text
			) AS new_keys
			FROM secrets_vault
				LEFT JOIN auth_account_auth_household
				ON secrets_vault.auth_household_id = auth_account_auth_household.auth_household_id
			, JSONB_ARRAY_ELEMENTS(keys) k
			WHERE auth_account_auth_household.auth_account_id = _auth_account_id
			GROUP BY (secrets_vault.id)
		) s
		WHERE secrets_vault.id = s.id;
	END IF;

	IF TG_OP = 'UPDATE'
	THEN
		RETURN new;
	END IF;

	RETURN old;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER au_auth_account_public_key
	AFTER UPDATE ON auth_account
	FOR EACH ROW WHEN (
		new.public_key IS DISTINCT FROM old.public_key
	)
	EXECUTE FUNCTION auth_account_update_secrets_vault();
CREATE OR REPLACE TRIGGER bd_auth_account_public_key
	BEFORE DELETE ON auth_account
	FOR EACH ROW
	EXECUTE FUNCTION auth_account_update_secrets_vault();
