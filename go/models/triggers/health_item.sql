CREATE OR REPLACE TRIGGER adiu_health_item_notify
	AFTER DELETE OR INSERT OR UPDATE ON health_item
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_health_item_noop
	BEFORE UPDATE ON health_item
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_health_item_updated
	BEFORE UPDATE ON health_item
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION health_item_delete_health_item()
RETURNS trigger AS $$
BEGIN
		UPDATE health_item
		SET
			  correlations = correlations - old.id::text
			, total_correlations = total_correlations - (correlations->old.id::text)::int
		WHERE auth_account_id = old.auth_account_id
		AND output != old.output
		AND correlations->old.id::text IS NOT NULL;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_health_item_health_item
	AFTER DELETE ON health_item
	FOR EACH ROW
	EXECUTE FUNCTION health_item_delete_health_item();

CREATE OR REPLACE FUNCTION health_item_delete_health_log()
RETURNS trigger AS $$
BEGIN
	DELETE FROM health_log
	WHERE
		health_item_id = new.id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER au_health_item_health_log
	AFTER UPDATE ON health_item
	FOR EACH ROW WHEN (
		old.output != new.output
	)
	EXECUTE FUNCTION health_item_delete_health_log();
