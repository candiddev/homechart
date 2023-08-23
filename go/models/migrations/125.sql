DROP DOMAIN IF EXISTS permission;

DROP FUNCTION IF EXISTS update_notified CASCADE;

DROP INDEX auth_account_updated;
DROP INDEX auth_household_updated;

DROP TRIGGER IF EXISTS ad_auth_account_notify ON auth_account;
DROP TRIGGER IF EXISTS ai_auth_account_notify ON auth_account;
DROP TRIGGER IF EXISTS au_auth_account_notify ON auth_account;
DROP TRIGGER IF EXISTS ad_auth_household_notify ON auth_household;
DROP TRIGGER IF EXISTS ai_auth_household_notify ON auth_household;
DROP TRIGGER IF EXISTS au_auth_household_notify ON auth_household;
DROP TRIGGER IF EXISTS ad_budget_account_notify ON budget_account;
DROP TRIGGER IF EXISTS ai_budget_account_notify ON budget_account;
DROP TRIGGER IF EXISTS au_budget_account_notify ON budget_account;
DROP TRIGGER IF EXISTS ad_budget_category_notify ON budget_category;
DROP TRIGGER IF EXISTS ai_budget_category_notify ON budget_category;
DROP TRIGGER IF EXISTS au_budget_category_notify ON budget_category;
DROP TRIGGER IF EXISTS ad_budget_recurrence_notify ON budget_recurrence;
DROP TRIGGER IF EXISTS ai_budget_recurrence_notify ON budget_recurrence;
DROP TRIGGER IF EXISTS au_budget_recurrence_notify ON budget_recurrence;
DROP TRIGGER IF EXISTS ad_budget_payee_notify ON budget_recurrence;
DROP TRIGGER IF EXISTS ai_budget_payee_notify ON budget_recurrence;
DROP TRIGGER IF EXISTS au_budget_payee_notify ON budget_recurrence;
DROP TRIGGER IF EXISTS ad_cook_recipe_notify ON cook_recipe;
DROP TRIGGER IF EXISTS ad_plan_project_notify ON plan_project;
DROP TRIGGER IF EXISTS ai_plan_project_notify ON plan_project;
DROP TRIGGER IF EXISTS au_plan_project_notify ON plan_project;
DROP TRIGGER IF EXISTS ad_plan_task_notify ON plan_task;
DROP TRIGGER IF EXISTS ai_plan_task_notify ON plan_task;
DROP TRIGGER IF EXISTS au_plan_task_notify ON plan_task;
DROP TRIGGER IF EXISTS ad_shop_category_notify ON shop_category;
DROP TRIGGER IF EXISTS ai_shop_category_notify ON shop_category;
DROP TRIGGER IF EXISTS au_shop_category_notify ON shop_category;
DROP TRIGGER IF EXISTS ad_shop_item_notify ON shop_item;
DROP TRIGGER IF EXISTS ai_shop_item_notify ON shop_item;
DROP TRIGGER IF EXISTS au_shop_item_notify ON shop_item;
DROP TRIGGER IF EXISTS bu_plan_task_notified ON plan_task;

ALTER TABLE bookmark
	DROP CONSTRAINT bookmark_auth_account_short_id;
ALTER TABLE bookmark
	DROP CONSTRAINT bookmark_auth_household_short_id;

UPDATE bookmark
	SET short_id = row_number
	FROM (
		SELECT
			id,
			row_number() OVER (
				PARTITION BY auth_account_id
			)
		FROM bookmark
		WHERE
			auth_account_id IS NOT NULL
		ORDER BY created
	) b
	WHERE bookmark.id = b.id;
UPDATE bookmark
	SET short_id = row_number
	FROM (
		SELECT
			id,
			row_number() OVER (
				PARTITION BY auth_household_id
			)
		FROM bookmark
		WHERE
			auth_household_id IS NOT NULL
		ORDER BY created
	) b
	WHERE bookmark.id = b.id;
ALTER TABLE bookmark
	ADD CONSTRAINT bookmark_auth_account_short_id UNIQUE (auth_account_id, short_id);
ALTER TABLE bookmark
	ADD CONSTRAINT bookmark_auth_household_short_id UNIQUE (auth_household_id, short_id);

ALTER TABLE notes_page
	DROP CONSTRAINT notes_page_auth_account_short_id;
ALTER TABLE notes_page
	DROP CONSTRAINT notes_page_auth_household_short_id;
UPDATE notes_page
	SET short_id = row_number
	FROM (
		SELECT
			id,
			row_number() OVER (
				PARTITION BY auth_account_id
			)
		FROM notes_page
		WHERE
			auth_account_id IS NOT NULL
		ORDER BY created
	) n
	WHERE notes_page.id = n.id;
UPDATE notes_page
	SET short_id = row_number
	FROM (
		SELECT
			id,
			row_number() OVER (
				PARTITION BY auth_household_id
			)
		FROM notes_page
		WHERE
			auth_household_id IS NOT NULL
		ORDER BY created
	) n
	WHERE notes_page.id = n.id;
ALTER TABLE notes_page
	ADD CONSTRAINT notes_page_auth_account_short_id UNIQUE (auth_account_id, short_id);
ALTER TABLE notes_page
	ADD CONSTRAINT notes_page_auth_household_short_id UNIQUE (auth_household_id, short_id);

