CREATE OR REPLACE TRIGGER bu_shop_list_noop
	BEFORE UPDATE ON shop_list
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_shop_list_updated
	BEFORE UPDATE ON shop_list
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();
CREATE OR REPLACE TRIGGER adiu_shop_list_notify
	AFTER DELETE OR INSERT OR UPDATE ON shop_list
	FOR EACH ROW
	EXECUTE FUNCTION notify();

CREATE OR REPLACE FUNCTION shop_list_update_shop_item()
RETURNS trigger AS $$
BEGIN
	UPDATE shop_item
	SET
		  auth_account_id = new.auth_account_id
		, auth_household_id = new.auth_household_id
	WHERE shop_list_id = new.id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER au_shop_list_update_shop_item
	AFTER UPDATE ON shop_list
	FOR EACH ROW WHEN (
		old.auth_account_id IS DISTINCT FROM new.auth_account_id
		OR old.auth_household_id IS DISTINCT FROM new.auth_household_id
	)
	EXECUTE FUNCTION shop_list_update_shop_item();
