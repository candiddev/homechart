CREATE OR REPLACE TRIGGER adiu_plan_project_notify
	AFTER DELETE OR INSERT OR UPDATE ON plan_project
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_plan_project_noop
	BEFORE UPDATE ON plan_project
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_plan_project_updated
	BEFORE UPDATE ON plan_project
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION plan_project_copy_parent_id()
RETURNS trigger AS $$
BEGIN
	SELECT
		  auth_account_id
		, auth_household_id
	INTO
		  new.auth_account_id
		, new.auth_household_id
	FROM plan_project
	WHERE id = new.parent_id;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_plan_project_parent_id
	BEFORE INSERT ON plan_project
	FOR EACH ROW WHEN (
		new.parent_id IS NOT NULL
	)
	EXECUTE FUNCTION plan_project_copy_parent_id();
CREATE OR REPLACE TRIGGER bu_plan_project_parent_id
	BEFORE UPDATE ON plan_project
	FOR EACH ROW WHEN (
		new.parent_id IS NOT NULL
		AND old.parent_id IS DISTINCT FROM new.parent_id
	)
	EXECUTE FUNCTION plan_project_copy_parent_id();

CREATE OR REPLACE FUNCTION plan_project_set_position()
RETURNS trigger AS $$
BEGIN
	IF new.position != ''
	AND EXISTS (
		SELECT 1
		FROM plan_project
		WHERE
			auth_account_id IS NOT DISTINCT FROM new.auth_account_id
			AND auth_household_id IS NOT DISTINCT FROM new.auth_household_id
			AND id IS DISTINCT FROM new.id
			AND parent_id IS NOT DISTINCT FROM new.parent_id
			AND position IS NOT DISTINCT FROM new.position
	)
	THEN
		new.position = '';
	END IF;

	IF new.position = ''
	THEN
		SELECT (SPLIT_PART(position, ':', 1)::INTEGER + 1)::TEXT
		INTO
			new.position
		FROM plan_project
		WHERE
			auth_account_id IS NOT DISTINCT FROM new.auth_account_id
			AND auth_household_id IS NOT DISTINCT FROM new.auth_household_id
			AND parent_id IS NOT DISTINCT FROM new.parent_id
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
CREATE OR REPLACE TRIGGER bi_plan_project_position
	BEFORE INSERT ON plan_project
	FOR EACH ROW
	EXECUTE FUNCTION plan_project_set_position();
CREATE OR REPLACE TRIGGER bu_plan_project_position
	BEFORE UPDATE ON plan_project
	FOR EACH ROW WHEN (
		old.auth_account_id IS DISTINCT FROM new.auth_account_id
		OR old.auth_household_id IS DISTINCT FROM new.auth_household_id
		OR old.parent_id IS DISTINCT FROM new.parent_id
	)
	EXECUTE FUNCTION plan_project_set_position();

CREATE OR REPLACE FUNCTION plan_project_update_auth_account()
RETURNS trigger AS $$
BEGIN
	UPDATE auth_account
	SET collapsed_plan_projects = array_remove(collapsed_plan_projects, old.id::text)
	WHERE id = old.auth_account_id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_auth_account
	AFTER DELETE ON plan_project
	FOR EACH ROW WHEN (
		old.auth_account_id IS NOT NULL
	)
	EXECUTE FUNCTION plan_project_update_auth_account();

CREATE OR REPLACE FUNCTION plan_project_update_auth_household()
RETURNS trigger AS $$
BEGIN
	UPDATE auth_account
	SET collapsed_plan_projects = array_remove(collapsed_plan_projects, old.id::text)
	FROM auth_account_auth_household
	WHERE auth_account_auth_household.auth_account_id = auth_account.id
	AND auth_account_auth_household.auth_household_id = old.auth_household_id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER au_auth_household
	AFTER UPDATE ON plan_project
	FOR EACH ROW WHEN (
		old.auth_household_id IS NOT NULL
	)
	EXECUTE FUNCTION plan_project_update_auth_household();

CREATE OR REPLACE FUNCTION plan_project_update_children()
RETURNS trigger AS $$
BEGIN
	UPDATE shop_item
	SET
		  auth_account_id = new.auth_account_id
		, auth_household_id = new.auth_household_id
	WHERE plan_project_id = new.id;

	UPDATE plan_project
	SET
		  auth_account_id = new.auth_account_id
		, auth_household_id = new.auth_household_id
	WHERE parent_id = new.id;

	UPDATE plan_task
	SET
		  auth_account_id = new.auth_account_id
		, auth_household_id = new.auth_household_id
	WHERE plan_project_id = new.id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER au_plan_project_children
	AFTER UPDATE ON plan_project
	FOR EACH ROW WHEN (
		old.auth_account_id IS DISTINCT FROM new.auth_account_id
		OR old.auth_household_id IS DISTINCT FROM new.auth_household_id
	)
	EXECUTE FUNCTION plan_project_update_children();
