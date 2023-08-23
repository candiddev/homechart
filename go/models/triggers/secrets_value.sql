CREATE OR REPLACE TRIGGER adiu_secrets_value_notify
	AFTER DELETE OR INSERT OR UPDATE ON secrets_value
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_secrets_value_noop
	BEFORE UPDATE ON secrets_value
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_secrets_value_updated
	BEFORE UPDATE ON secrets_value
	FOR EACH ROW WHEN (
		old *<> new
	)
EXECUTE FUNCTION update_updated();

/* There are no triggers to copy the AuthAccount/AuthHousehold stuff from SecretsVault because the UX needs to re-encrypt everything anyways. */
