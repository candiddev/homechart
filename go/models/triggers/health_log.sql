CREATE OR REPLACE TRIGGER adiu_health_log_notify
	AFTER DELETE OR INSERT OR UPDATE ON health_log
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_health_log_noop
	BEFORE UPDATE ON health_log
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_health_log_updated
	BEFORE UPDATE ON health_log
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION health_log_update_health_item()
RETURNS trigger AS $$
DECLARE
	i uuid;
	ids uuid[];
	o bool;
BEGIN
	IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE'
	THEN
		SELECT output INTO o FROM health_item WHERE id = new.health_item_id;

		SELECT coalesce(array_agg(health_item_id), '{}')
		INTO ids
		FROM health_log
		LEFT JOIN health_item ON health_item.id = health_log.health_item_id
		WHERE
			health_item.auth_account_id = new.auth_account_id
			AND health_item.output != o
			AND (
				(
					health_item.output
					AND health_log.date <= new.date + INTERVAL '3 days'
					AND health_log.date >= new.date
				)
				OR (
					NOT health_item.output
					AND health_log.date <= new.date
					AND health_log.date >= new.date - INTERVAL '3 days'
				)
			);

		UPDATE health_item
		SET
			  correlations = correlations || jsonb_build_object(
					new.health_item_id, coalesce(cast(correlations->new.health_item_id::text as int), 0) + 1
				)
			, total_correlations = total_correlations + 1
		WHERE id = ANY(ids);

		FOREACH i IN ARRAY ids
		LOOP
			UPDATE health_item
			SET
				  correlations = correlations || jsonb_build_object(
						i, coalesce(cast(correlations->i::text as int), 0) + 1
					)
				, total_correlations = total_correlations + 1
			WHERE id = new.health_item_id;
		END LOOP;
	ELSIF TG_OP = 'DELETE' OR TG_OP = 'UPDATE'
	THEN
		SELECT output INTO o FROM health_item WHERE id = old.health_item_id;

		SELECT coalesce(array_agg(health_item_id), '{}')
		INTO ids
		FROM health_log
		LEFT JOIN health_item ON health_item.id = health_log.health_item_id
		WHERE
			health_item.auth_account_id = old.auth_account_id
			AND health_item.output != o
			AND (
				(
					health_item.output
					AND health_log.date <= old.date + INTERVAL '3 days'
					AND health_log.date >= old.date
				)
				OR (
					NOT health_item.output
					AND health_log.date <= old.date
					AND health_log.date >= old.date - INTERVAL '3 days'
				)
			);

		UPDATE health_item
		SET
			  correlations = CASE WHEN (correlations->old.health_item_id::text)::int = 1
					THEN correlations - old.health_item_id::text
					ELSE correlations || jsonb_build_object(
						old.health_item_id, coalesce(cast(correlations->old.health_item_id::text as int), 0) - 1
					)
				END
			, total_correlations = total_correlations - 1
		WHERE id = ANY(ids);

		FOREACH i IN ARRAY ids
		LOOP
			UPDATE health_item
			SET
				  correlations = correlations || jsonb_build_object(
						i, coalesce(cast(correlations->i::text as int), 0) - 1
					)
				, total_correlations = total_correlations - 1
			WHERE id = old.health_item_id;
		END LOOP;
	END IF;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER adi_health_log_health_item
	AFTER DELETE OR INSERT ON health_log
	FOR EACH ROW
	EXECUTE FUNCTION health_log_update_health_item();
CREATE OR REPLACE TRIGGER au_health_log_health_item
	AFTER UPDATE ON health_log
	FOR EACH ROW WHEN (
		old.date != new.date
		OR old.health_item_id != new.health_item_id
	)
	EXECUTE FUNCTION health_log_update_health_item();
CREATE OR REPLACE TRIGGER au_health_log_health_item
	AFTER UPDATE ON health_log
	FOR EACH ROW WHEN (
		old.date != new.date
		OR old.health_item_id != new.health_item_id
	)
	EXECUTE FUNCTION health_log_update_health_item();
