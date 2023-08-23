CREATE OR REPLACE TRIGGER adiu_budget_category_notify
	AFTER DELETE OR INSERT OR UPDATE ON budget_category
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_budget_category_updated
	BEFORE UPDATE ON budget_category
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();
CREATE OR REPLACE TRIGGER bu_budget_category_noop
	BEFORE UPDATE ON budget_category
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();

CREATE OR REPLACE FUNCTION budget_category_update_budget_month()
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'DELETE'
	THEN
		UPDATE budget_month
		SET budget_transaction_amount_income = budget_transaction_amount_income - sum
		FROM (
			SELECT
				  SUM(budget_transaction_category.amount)
				, year_month
			FROM budget_transaction_category
			WHERE budget_category_id = old.id
			GROUP BY year_month
		) AS category
		WHERE budget_month.auth_household_id = old.auth_household_id
		AND budget_month.year_month = category.year_month;

		RETURN old;
	ELSIF TG_OP = 'UPDATE'
	THEN
		IF new.income IS TRUE
		THEN
			UPDATE budget_month
			SET budget_transaction_amount_income = budget_transaction_amount_income + sum
			FROM (
				SELECT
					  SUM(budget_transaction_category.amount)
					, year_month
				FROM budget_transaction_category
				WHERE budget_category_id = new.id
				GROUP BY year_month
			) AS category
			WHERE budget_month.auth_household_id = new.auth_household_id
			AND budget_month.year_month = category.year_month;
		ELSE
			UPDATE budget_month
			SET
				budget_transaction_amount_income = budget_transaction_amount_income - sum
			FROM (
				SELECT
					  SUM(budget_transaction_category.amount)
					, year_month
				FROM budget_transaction_category
				WHERE budget_category_id = new.id
				GROUP BY year_month
			) AS category
			WHERE budget_month.auth_household_id = new.auth_household_id
			AND budget_month.year_month = category.year_month;
		END IF;
	END IF;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bd_budget_category
	BEFORE DELETE ON budget_category
	FOR EACH ROW WHEN (
		old.income
	)
	EXECUTE FUNCTION budget_category_update_budget_month();
CREATE OR REPLACE TRIGGER au_budget_category
	AFTER UPDATE ON budget_category
	FOR EACH ROW WHEN (
		old.income <> new.income
	)
	EXECUTE FUNCTION budget_category_update_budget_month();
