CREATE OR REPLACE TRIGGER adiu_auth_session_notify
	AFTER DELETE OR INSERT OR UPDATE ON auth_session
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_auth_session_noop
	BEFORE UPDATE ON auth_session
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
