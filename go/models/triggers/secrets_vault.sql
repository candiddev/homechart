CREATE OR REPLACE TRIGGER adiu_secrets_vault_notify
	AFTER DELETE OR INSERT OR UPDATE ON secrets_vault
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_secrets_vault_noop
	BEFORE UPDATE ON secrets_vault
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_secrets_vault_updated
	BEFORE UPDATE ON secrets_vault
	FOR EACH ROW WHEN (
		old *<> new
	)
EXECUTE FUNCTION update_updated();
