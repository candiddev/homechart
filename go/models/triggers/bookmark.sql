CREATE OR REPLACE TRIGGER adiu_bookmark_notify
	AFTER DELETE OR INSERT OR UPDATE ON bookmark
	FOR EACH ROW
  EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_bookmark_updated
	BEFORE UPDATE ON bookmark
	FOR EACH ROW WHEN (
		old *<> new
	)
  EXECUTE FUNCTION update_updated();
CREATE OR REPLACE TRIGGER bu_bookmark_noop
	BEFORE UPDATE ON bookmark
	FOR EACH ROW WHEN (
		old = new
	)
  EXECUTE FUNCTION update_noop();
