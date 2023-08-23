ALTER TABLE shop_item
	ADD COLUMN position TEXT NOT NULL DEFAULT '';

UPDATE shop_item
	SET
		position = row_number
	FROM (
		SELECT
			id,
			row_number() over (
				PARTITION BY COALESCE(shop_list_id, COALESCE(auth_account_id, auth_household_id))
			)
		FROM shop_item
		ORDER BY created
	) s
	WHERE
		shop_item.id = s.id;

CREATE UNIQUE INDEX shop_item_position
	ON shop_item (COALESCE(shop_list_id, COALESCE(auth_account_id, auth_household_id)), position);

ALTER TABLE plan_project
	DROP CONSTRAINT plan_project_auth_account_id_parent_id_position_key;
ALTER TABLE plan_project
	DROP CONSTRAINT plan_project_auth_household_id_parent_id_position_key;

UPDATE plan_project
	SET
		position = row_number
	FROM (
		SELECT
			id,
			row_number() over (
				PARTITION BY COALESCE(parent_id, COALESCE(auth_account_id, auth_household_id))
			)
		FROM plan_project
		ORDER BY position
	) p
	WHERE
		plan_project.id = p.id;

CREATE UNIQUE INDEX plan_project_position
	ON plan_project (COALESCE(parent_id, COALESCE(auth_account_id, auth_household_id)), position);

ALTER TABLE plan_task
	DROP CONSTRAINT plan_task_auth_account_id_parent_id_position_key;
ALTER TABLE plan_task
	DROP CONSTRAINT plan_task_auth_household_id_parent_id_position_key;

UPDATE plan_task
	SET
		position = row_number
	FROM (
		SELECT
			id,
			row_number() over (
				PARTITION BY COALESCE(parent_id, COALESCE(plan_project_id, COALESCE(auth_household_id, auth_account_id)))
			)
		FROM plan_task
		ORDER BY position
	) p
	WHERE
		plan_task.id = p.id;

CREATE UNIQUE INDEX plan_task_position
	/* if auth_household_id is null, auth_account_id is not null, order is important */
	ON plan_task (COALESCE(parent_id, COALESCE(plan_project_id, COALESCE(auth_household_id, auth_account_id))), position);
