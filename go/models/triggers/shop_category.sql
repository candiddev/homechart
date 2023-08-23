CREATE OR REPLACE TRIGGER adiu_shop_category_notify
	AFTER DELETE OR INSERT OR UPDATE ON shop_category
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_shop_category_noop
	BEFORE UPDATE ON shop_category
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_shop_category_updated
	BEFORE UPDATE ON shop_category
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();
