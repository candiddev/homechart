CREATE OR REPLACE TRIGGER adiu_inventory_item_notify
	AFTER DELETE OR INSERT OR UPDATE ON inventory_item
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_inventory_item_noop
	BEFORE UPDATE ON inventory_item
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_inventory_item_updated
	BEFORE UPDATE ON inventory_item
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION inventory_item_set_last_purchased()
RETURNS trigger AS $$
BEGIN
	new.last_purchased = now();

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bu_inventory_item_last_purchased
	BEFORE UPDATE ON inventory_item
	FOR EACH ROW WHEN (
		old.quantity < new.quantity
	)
	EXECUTE FUNCTION inventory_item_set_last_purchased();
