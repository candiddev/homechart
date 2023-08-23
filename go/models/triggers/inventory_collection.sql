CREATE OR REPLACE TRIGGER adiu_inventory_collection_notify
	AFTER DELETE OR INSERT OR UPDATE ON inventory_collection
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_inventory_collection_noop
	BEFORE UPDATE ON inventory_collection
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_inventory_collection_updated
	BEFORE UPDATE ON inventory_collection
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();
