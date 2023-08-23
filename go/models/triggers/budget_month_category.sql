CREATE OR REPLACE TRIGGER bu_budget_month_category
	BEFORE UPDATE ON budget_month_category
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();

CREATE OR REPLACE FUNCTION budget_month_category_update_budget_month()
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		INSERT INTO budget_month (
			  auth_household_id
			, budget_month_category_amount
			, year_month
		) VALUES (
			  new.auth_household_id
			, new.amount
			, new.year_month
		) ON CONFLICT (
			  auth_household_id
			, year_month
		) DO UPDATE SET 
			budget_month_category_amount = budget_month.budget_month_category_amount + new.amount;
	ELSIF TG_OP = 'DELETE'
	THEN
		UPDATE budget_month
		SET budget_month_category_amount = budget_month_category_amount - old.amount
		WHERE auth_household_id = old.auth_household_id
		AND year_month = old.year_month;
	ELSIF TG_OP = 'UPDATE'
	THEN
		IF old.amount != 0
		THEN
			UPDATE budget_month
			SET budget_month_category_amount = budget_month_category_amount - old.amount
			WHERE auth_household_id = old.auth_household_id
			AND year_month = old.year_month;
		END IF;

		IF new.amount != 0
		THEN
			INSERT INTO budget_month (
				  auth_household_id
				, budget_month_category_amount
				, year_month
			) VALUES (
				  new.auth_household_id
				, new.amount
				, new.year_month
			) ON CONFLICT (
				  auth_household_id
				, year_month
			) DO UPDATE SET 
				budget_month_category_amount = budget_month.budget_month_category_amount + new.amount;
		END IF;
	END IF;
	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_budget_month
	AFTER DELETE ON budget_month_category
	FOR EACH ROW WHEN (
		old.amount != 0
	)
	EXECUTE FUNCTION budget_month_category_update_budget_month();
CREATE OR REPLACE TRIGGER ai_budget_month
	AFTER INSERT ON budget_month_category
	FOR EACH ROW WHEN (
		new.amount != 0
	)
	EXECUTE FUNCTION budget_month_category_update_budget_month();
CREATE OR REPLACE TRIGGER au_budget_month
	AFTER UPDATE ON budget_month_category
	FOR EACH ROW WHEN (
		old.amount != 0
		OR new.amount != 0
	)
	EXECUTE FUNCTION budget_month_category_update_budget_month();

CREATE OR REPLACE FUNCTION budget_month_category_income()
RETURNS trigger AS $$
BEGIN
	IF (
		SELECT income
		FROM budget_category
		WHERE id = new.budget_category_id
	)
	THEN
		RETURN NULL;
	END IF;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER biu_budget_month_category_income
	BEFORE INSERT OR UPDATE ON budget_month_category
	FOR EACH ROW WHEN (
		new.amount != 0
	)
	EXECUTE FUNCTION budget_month_category_income();

CREATE OR REPLACE FUNCTION budget_month_category_update_budget_category()
RETURNS trigger AS $$
DECLARE
	budget_category_id UUID;
	change BIGINT;
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		budget_category_id = new.budget_category_id;
		change = new.amount;
	ELSIF TG_OP = 'DELETE'
	THEN
		budget_category_id = old.budget_category_id;
		change = -1 * old.amount;
	ELSIF TG_OP = 'UPDATE'
	THEN
		budget_category_id = new.budget_category_id;
		change = -1 * old.amount + new.amount;
	END IF;

	UPDATE budget_category
	SET
		budget_month_category_amount = budget_month_category_amount + change
	WHERE
		id = budget_category_id;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER aidu_budget_category
	AFTER DELETE OR INSERT OR UPDATE ON budget_month_category
	FOR EACH ROW
	EXECUTE FUNCTION budget_month_category_update_budget_category();
