ALTER TABLE budget_account ADD COLUMN budget BOOLEAN NOT NULL DEFAULT false;

UPDATE budget_account SET budget = true;

ALTER TABLE shop_item ADD CONSTRAINT auth_account_household CHECK ((auth_account_id IS NULL) != (auth_household_id IS NULL)); /* only one column can have a value */

DROP INDEX plan_project_position;
DROP INDEX plan_task_position;
DROP INDEX shop_item_position;
