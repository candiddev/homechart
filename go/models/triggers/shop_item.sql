CREATE OR REPLACE TRIGGER adiu_shop_item_notify
	AFTER DELETE OR INSERT OR UPDATE ON shop_item
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_shop_item_noop
	BEFORE UPDATE ON shop_item
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_shop_item_updated
	BEFORE UPDATE ON shop_item
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION shop_item_update_plan_project() 
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		UPDATE plan_project
		SET shop_item_count = shop_item_count + 1
		WHERE id = new.plan_project_id;
	ELSIF TG_OP = 'DELETE'
	THEN
		UPDATE plan_project
		SET shop_item_count = shop_item_count - 1
		WHERE id = old.plan_project_id;
	ELSIF TG_OP = 'UPDATE'
	THEN
		UPDATE plan_project
		SET shop_item_count = shop_item_count - 1
		WHERE id = old.plan_project_id;

		UPDATE plan_project
		SET shop_item_count = shop_item_count + 1
		WHERE id = new.plan_project_id;
	END IF;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_plan_project
	AFTER DELETE ON shop_item
	FOR EACH ROW WHEN (
		old.plan_project_id IS NOT NULL
	)
	EXECUTE FUNCTION shop_item_update_plan_project();
CREATE OR REPLACE TRIGGER ai_plan_project
	AFTER INSERT ON shop_item
	FOR EACH ROW WHEN (
		new.plan_project_id IS NOT NULL
	)
	EXECUTE FUNCTION shop_item_update_plan_project();
CREATE OR REPLACE TRIGGER au_plan_project
	AFTER UPDATE ON shop_item
	FOR EACH ROW WHEN (
		old.plan_project_id IS DISTINCT FROM new.plan_project_id
	)
	EXECUTE FUNCTION shop_item_update_plan_project();

CREATE OR REPLACE FUNCTION shop_item_update_shop_list()
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		UPDATE shop_list
		SET shop_item_count = shop_item_count + 1
		WHERE id = new.shop_list_id
		AND (
			auth_household_id = new.auth_household_id
			OR auth_account_id = new.auth_account_id
		);
	ELSIF TG_OP = 'DELETE'
	THEN
		UPDATE shop_list
		SET shop_item_count = shop_item_count - 1
		WHERE id = old.shop_list_id
		AND (
			auth_household_id = old.auth_household_id
			OR auth_account_id = old.auth_account_id
		);
	ELSIF TG_OP = 'UPDATE'
	THEN
		IF old.shop_list_id IS DISTINCT FROM new.shop_list_id
		THEN
			UPDATE shop_list
			SET shop_item_count = shop_item_count - 1
			WHERE id = old.shop_list_id
			AND (
				auth_household_id = old.auth_household_id
				OR auth_account_id = old.auth_account_id
			);

			UPDATE shop_list
			SET shop_item_count = shop_item_count + 1
			WHERE id = new.shop_list_id
			AND (
				auth_household_id = new.auth_household_id
				OR auth_account_id = new.auth_account_id
			);
		END IF;
	END IF;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_shop_list
	AFTER DELETE ON shop_item
	FOR EACH ROW WHEN (
		old.shop_list_id IS NOT NULL
	)
	EXECUTE FUNCTION shop_item_update_shop_list();
CREATE OR REPLACE TRIGGER ai_shop_list
	AFTER INSERT ON shop_item
	FOR EACH ROW WHEN (
		new.shop_list_id IS NOT NULL
	)
	EXECUTE FUNCTION shop_item_update_shop_list();
CREATE OR REPLACE TRIGGER au_shop_list
	AFTER UPDATE ON shop_item
	FOR EACH ROW WHEN (
		old.shop_list_id IS DISTINCT FROM new.shop_list_id
	)
	EXECUTE FUNCTION shop_item_update_shop_list();

CREATE OR REPLACE FUNCTION shop_item_copy_shop_list_id()
RETURNS trigger AS $$
DECLARE
	auth_account_id uuid;
	auth_household_id uuid;
BEGIN
	SELECT
		  shop_list.auth_account_id
		, shop_list.auth_household_id
	INTO
		auth_account_id,
		auth_household_id
	FROM shop_list
	WHERE id = new.shop_list_id;

	IF auth_household_id IS NOT NULL
	THEN
		new.auth_household_id = auth_household_id;
	ELSE
		new.auth_account_id = auth_account_id;
	END IF;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_shop_item_shop_list_id
	BEFORE INSERT ON shop_item
	FOR EACH ROW WHEN (
		new.shop_list_id IS NOT NULL
	)
	EXECUTE FUNCTION shop_item_copy_shop_list_id();
CREATE OR REPLACE TRIGGER bu_shop_item_shop_list_id
	BEFORE UPDATE ON shop_item
	FOR EACH ROW WHEN (
		old.shop_list_id IS DISTINCT FROM new.shop_list_id
	)
	EXECUTE FUNCTION shop_item_copy_shop_list_id();

CREATE OR REPLACE FUNCTION shop_item_set_position()
RETURNS trigger AS $$
BEGIN
	IF new.position != ''
	AND EXISTS (
		SELECT 1
		FROM shop_item
		WHERE
			auth_account_id IS NOT DISTINCT FROM new.auth_account_id
			AND auth_household_id IS NOT DISTINCT FROM new.auth_household_id
			AND id IS DISTINCT FROM new.id
			AND position IS NOT DISTINCT FROM new.position
			AND shop_list_id IS NOT DISTINCT FROM new.shop_list_id
	)
	THEN
		new.position = '';
	END IF;

	IF new.position = ''
	THEN
		SELECT (SPLIT_PART(position, ':', 1)::INTEGER + 1)::TEXT
		INTO
			new.position
		FROM shop_item
		WHERE
			auth_account_id IS NOT DISTINCT FROM new.auth_account_id
			AND auth_household_id IS NOT DISTINCT FROM new.auth_household_id
			AND shop_list_id IS NOT DISTINCT FROM new.shop_list_id
		ORDER BY
			SPLIT_PART(position, ':', 1)::INTEGER
		DESC LIMIT 1;

		IF new.position IS NULL
		THEN
			new.position = '0';
		END IF;
	END IF;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_shop_item_position
	BEFORE INSERT ON shop_item
	FOR EACH ROW
	EXECUTE FUNCTION shop_item_set_position();
CREATE OR REPLACE TRIGGER bu_shop_item_position
	BEFORE UPDATE ON shop_item
	FOR EACH ROW WHEN (
		old.auth_account_id IS DISTINCT FROM new.auth_account_id
		OR old.auth_household_id IS DISTINCT FROM new.auth_household_id
		OR old.shop_list_id IS DISTINCT FROM new.shop_list_id
	)
	EXECUTE FUNCTION shop_item_set_position();
