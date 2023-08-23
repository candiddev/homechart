CREATE OR REPLACE TRIGGER adiu_notes_page_notify
	AFTER DELETE OR INSERT OR UPDATE ON notes_page
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_notes_page_noop
	BEFORE UPDATE ON notes_page
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_notes_page_updated
	BEFORE UPDATE ON notes_page
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION notes_page_copy_parent_id()
RETURNS trigger AS $$
BEGIN
	SELECT
		  auth_account_id
		, auth_household_id
	INTO
		  new.auth_account_id
		, new.auth_household_id
	FROM notes_page
	WHERE id = new.parent_id;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_notes_page_parent_id
	BEFORE INSERT ON notes_page
	FOR EACH ROW WHEN (
		new.parent_id IS NOT NULL
	)
	EXECUTE FUNCTION notes_page_copy_parent_id();
CREATE OR REPLACE TRIGGER bu_notes_page_parent_id
	BEFORE UPDATE ON notes_page
	FOR EACH ROW WHEN (
		new.parent_id IS NOT NULL AND old.parent_id IS DISTINCT FROM new.parent_id
	)
	EXECUTE FUNCTION notes_page_copy_parent_id();

CREATE OR REPLACE FUNCTION notes_page_update_auth_account()
RETURNS trigger AS $$
BEGIN
	UPDATE auth_account
	SET collapsed_notes_pages = array_remove(collapsed_notes_pages, old.id::text)
	WHERE id = old.auth_account_id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_auth_account
	AFTER DELETE ON notes_page
	FOR EACH ROW WHEN (
		old.auth_account_id IS NOT NULL
	)
	EXECUTE FUNCTION notes_page_update_auth_account();

CREATE OR REPLACE FUNCTION notes_page_update_auth_household()
RETURNS trigger AS $$
BEGIN
	UPDATE auth_account
	SET collapsed_notes_pages = array_remove(collapsed_notes_pages, old.id::text)
	FROM auth_account_auth_household
	WHERE auth_account_auth_household.auth_account_id = auth_account.id
	AND auth_account_auth_household.auth_household_id = old.auth_household_id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_auth_household
	AFTER DELETE ON notes_page
	FOR EACH ROW WHEN (
		old.auth_household_id IS NOT NULL
	)
	EXECUTE FUNCTION notes_page_update_auth_household();

CREATE OR REPLACE FUNCTION notes_page_update_children()
RETURNS trigger AS $$
BEGIN
	UPDATE notes_page
	SET
		  auth_account_id = new.auth_account_id
		, auth_household_id = new.auth_household_id
	WHERE parent_id = new.id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER au_notes_page_children
	AFTER UPDATE ON notes_page
	FOR EACH ROW WHEN (
		old.auth_account_id IS DISTINCT FROM new.auth_account_id
		OR old.auth_household_id IS DISTINCT FROM new.auth_household_id
	)
	EXECUTE FUNCTION notes_page_update_children();
