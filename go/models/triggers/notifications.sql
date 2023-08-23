CREATE OR REPLACE TRIGGER bu_notification_noop
	BEFORE UPDATE ON notification
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
