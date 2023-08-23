CREATE OR REPLACE TRIGGER adiu_plan_task_notify
	AFTER DELETE OR INSERT OR UPDATE ON plan_task
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_plan_task_noop
	BEFORE UPDATE ON plan_task
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_plan_task_updated
	BEFORE UPDATE ON plan_task 
	FOR EACH ROW WHEN (
		old *<> new
	)
EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION plan_task_copy_parent_id() 
RETURNS trigger AS $$
DECLARE
	auth_account_id uuid;
	auth_household_id uuid;
BEGIN
	SELECT
		  plan_task.auth_account_id
		, plan_task.auth_household_id
		, plan_task.plan_project_id
		, plan_task.template
	INTO
		  auth_account_id
		, auth_household_id
		, new.plan_project_id
		, new.template
	FROM plan_task
	WHERE id = new.parent_id;

	IF auth_household_id IS NOT NULL
	THEN
		new.auth_household_id = auth_household_id;
	ELSIF auth_account_id IS NOT NULL
	THEN
		new.auth_account_id = auth_account_id;
	END IF;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_plan_task_parent_id
	BEFORE INSERT ON plan_task
	FOR EACH ROW WHEN (
		new.parent_id IS NOT NULL
	)
	EXECUTE FUNCTION plan_task_copy_parent_id();
CREATE OR REPLACE TRIGGER bu_plan_task_parent_id
	BEFORE UPDATE ON plan_task
	FOR EACH ROW WHEN (
		new.parent_id IS NOT NULL
		AND old.parent_id IS DISTINCT FROM new.parent_id
	)
	EXECUTE FUNCTION plan_task_copy_parent_id();

CREATE OR REPLACE FUNCTION plan_task_copy_plan_project_id()
RETURNS trigger AS $$
DECLARE
	auth_account_id uuid;
	auth_household_id uuid;
BEGIN
	SELECT
		  plan_project.auth_account_id
		, plan_project.auth_household_id
	INTO
		auth_account_id,
		auth_household_id
	FROM plan_project
	WHERE id = new.plan_project_id;

	IF auth_household_id IS NOT NULL
	THEN
		new.auth_household_id = auth_household_id;
	ELSE
		new.auth_account_id = auth_account_id;
	END IF;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_plan_task_plan_project_id
	BEFORE INSERT ON plan_task
	FOR EACH ROW WHEN (
		new.parent_id IS NULL
		AND new.plan_project_id IS NOT NULL
	)
	EXECUTE FUNCTION plan_task_copy_plan_project_id();
CREATE OR REPLACE TRIGGER bu_plan_task_plan_project_id
	BEFORE UPDATE ON plan_task
	FOR EACH ROW WHEN (
		new.parent_id IS NULL
		AND new.plan_project_id IS NOT NULL
		AND old.plan_project_id IS DISTINCT FROM new.plan_project_id
	)
	EXECUTE FUNCTION plan_task_copy_plan_project_id();

CREATE OR REPLACE FUNCTION plan_task_update_notified()
RETURNS TRIGGER AS $$
BEGIN
	new.notified = false;
	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bu_plan_task_notified
	BEFORE UPDATE ON plan_task
	FOR EACH ROW WHEN (
		new.done IS false
		AND old.due_date IS DISTINCT FROM new.due_date
		OR old.notify IS false
		AND new.notify IS true
	)
	EXECUTE FUNCTION plan_task_update_notified();

CREATE OR REPLACE FUNCTION plan_task_set_position()
RETURNS trigger AS $$
BEGIN
	IF new.position != ''
	AND EXISTS (
		SELECT 1
		FROM plan_task
		WHERE
			(new.auth_household_id IS NULL AND auth_account_id IS NULL AND auth_account_id IS NOT DISTINCT FROM new.auth_account_id)
			OR auth_household_id IS NOT DISTINCT FROM new.auth_household_id
			AND id IS DISTINCT FROM new.id
			AND plan_project_id IS NOT DISTINCT FROM new.plan_project_id
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
		FROM plan_task
		WHERE
			(new.auth_household_id IS NULL AND auth_account_id IS NULL AND auth_account_id IS NOT DISTINCT FROM new.auth_account_id)
			OR auth_household_id IS NOT DISTINCT FROM new.auth_household_id
			AND plan_project_id IS NOT DISTINCT FROM new.plan_project_id
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
CREATE OR REPLACE TRIGGER bi_plan_task_position
	BEFORE INSERT ON plan_task
	FOR EACH ROW
	EXECUTE FUNCTION plan_task_set_position();
CREATE OR REPLACE TRIGGER bu_plan_task_position
	BEFORE UPDATE ON plan_task
	FOR EACH ROW WHEN (
		old.auth_account_id IS DISTINCT FROM new.auth_account_id
		OR old.auth_household_id IS DISTINCT FROM new.auth_household_id
		OR old.parent_id IS DISTINCT FROM new.parent_id
		OR old.plan_project_id IS DISTINCT FROM new.plan_project_id
	)
	EXECUTE FUNCTION plan_task_set_position();

CREATE OR REPLACE FUNCTION plan_task_update_auth_account()
RETURNS trigger AS $$
BEGIN
	UPDATE auth_account
	SET collapsed_plan_tasks = array_remove(collapsed_plan_tasks, old.id::text)
	WHERE id = old.auth_account_id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_auth_account
	AFTER DELETE ON plan_task
	FOR EACH ROW WHEN (
		old.auth_account_id IS NOT NULL
	)
	EXECUTE FUNCTION plan_task_update_auth_account();

CREATE OR REPLACE FUNCTION plan_task_update_auth_household()
RETURNS trigger AS $$
BEGIN
	UPDATE auth_account
	SET collapsed_plan_tasks = array_remove(collapsed_plan_tasks, old.id::text)
	FROM auth_account_auth_household
	WHERE auth_account_auth_household.auth_account_id = auth_account.id
	AND auth_account_auth_household.auth_household_id = old.auth_household_id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_auth_household
	AFTER DELETE ON plan_task
	FOR EACH ROW WHEN (
		old.auth_household_id IS NOT NULL
	)
	EXECUTE FUNCTION plan_task_update_auth_household();

CREATE OR REPLACE FUNCTION plan_task_update_children()
RETURNS trigger AS $$
BEGIN
	UPDATE plan_task
	SET
		  auth_account_id = new.auth_account_id
		, auth_household_id = new.auth_household_id
		, plan_project_id = new.plan_project_id
		, template = new.template
	WHERE parent_id = new.id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER au_plan_task_children
	AFTER UPDATE ON plan_task
	FOR EACH ROW WHEN (
		old.plan_project_id IS DISTINCT FROM new.plan_project_id
		OR old.auth_account_id IS DISTINCT FROM new.auth_account_id
		OR old.auth_household_id IS DISTINCT FROM new.auth_household_id
		OR old.template IS DISTINCT FROM new.template
	)
	EXECUTE FUNCTION plan_task_update_children();

CREATE OR REPLACE FUNCTION plan_task_update_plan_project()
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		UPDATE plan_project
		SET plan_task_count = plan_task_count + 1
		WHERE id = new.plan_project_id
		AND (
			auth_household_id = new.auth_household_id
			OR auth_account_id = new.auth_account_id
		);
	ELSIF TG_OP = 'DELETE'
	THEN
		UPDATE plan_project
		SET plan_task_count = plan_task_count - 1
		WHERE id = old.plan_project_id
		AND (
			auth_household_id = old.auth_household_id
			OR auth_account_id = old.auth_account_id
		);
	ELSIF TG_OP = 'UPDATE'
	THEN
		IF ( 
			NOT old.done
			AND NOT new.done
			AND old.plan_project_id IS DISTINCT FROM new.plan_project_id
		) OR (
			NOT old.done
			AND new.done
		)
		THEN
			UPDATE plan_project
			SET plan_task_count = plan_task_count - 1
			WHERE id = old.plan_project_id
			AND (
				auth_household_id = old.auth_household_id
				OR auth_account_id = old.auth_account_id
			);
		END IF;

		IF (
			NOT old.done
			AND NOT new.done
			AND old.plan_project_id IS DISTINCT FROM new.plan_project_id
		) OR (
			old.done
			AND NOT new.done
		)
		THEN
			UPDATE plan_project
			SET plan_task_count = plan_task_count + 1
			WHERE id = new.plan_project_id
			AND (
				auth_household_id = new.auth_household_id
				OR auth_account_id = new.auth_account_id
			);
		END IF;
	END IF;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_plan_project
	AFTER DELETE ON plan_task
	FOR EACH ROW WHEN (
		NOT old.done
		AND old.plan_project_id IS NOT NULL
	)
	EXECUTE FUNCTION plan_task_update_plan_project();
CREATE OR REPLACE TRIGGER ai_plan_project
	AFTER INSERT ON plan_task
	FOR EACH ROW WHEN (
		NOT new.done
		AND new.plan_project_id IS NOT NULL
	)
	EXECUTE FUNCTION plan_task_update_plan_project();
CREATE OR REPLACE TRIGGER au_plan_project AFTER UPDATE ON plan_task
	FOR EACH ROW WHEN (
		old.done IS DISTINCT FROM new.done
		OR old.plan_project_id IS DISTINCT FROM new.plan_project_id
	)
	EXECUTE FUNCTION plan_task_update_plan_project();
