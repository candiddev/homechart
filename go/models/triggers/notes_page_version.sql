CREATE OR REPLACE TRIGGER adiu_notes_page_version_notify
	AFTER DELETE OR INSERT OR UPDATE ON notes_page_version 
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_notes_page_version_noop
	BEFORE UPDATE ON notes_page_version
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_notes_page_version_updated
	BEFORE UPDATE ON notes_page_version
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();
