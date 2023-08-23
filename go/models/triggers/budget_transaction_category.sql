CREATE OR REPLACE TRIGGER bu_budget_transaction_category_noop
	BEFORE UPDATE ON budget_transaction_category
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();

CREATE OR REPLACE FUNCTION budget_transaction_category_update_budget_category()
RETURNS TRIGGER AS $$
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		UPDATE budget_category
		SET budget_transaction_amount = budget_transaction_amount + new.amount
		WHERE id = new.budget_category_id
		AND auth_household_id = new.auth_household_id;
	ELSIF TG_OP = 'DELETE'
	THEN
		UPDATE budget_category
		SET budget_transaction_amount = budget_transaction_amount - old.amount
		WHERE id = old.budget_category_id
		AND auth_household_id = old.auth_household_id;
	ELSIF TG_OP = 'UPDATE'
	THEN
		UPDATE budget_category
		SET budget_transaction_amount = budget_transaction_amount - old.amount
		WHERE id = old.budget_category_id
		AND auth_household_id = old.auth_household_id;

		UPDATE budget_category
		SET budget_transaction_amount = budget_transaction_amount + new.amount
		WHERE id = new.budget_category_id
		AND auth_household_id = new.auth_household_id;
	END IF;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_budget_category
	AFTER DELETE ON budget_transaction_category
	FOR EACH ROW
	EXECUTE FUNCTION budget_transaction_category_update_budget_category();
CREATE OR REPLACE TRIGGER ai_budget_category
	AFTER INSERT ON budget_transaction_category
	FOR EACH ROW
	EXECUTE FUNCTION budget_transaction_category_update_budget_category();
CREATE OR REPLACE TRIGGER au_budget_category
	AFTER UPDATE ON budget_transaction_category
	FOR EACH ROW WHEN (
		(
			old.amount,
			old.budget_category_id
		) IS DISTINCT FROM (
			new.amount,
			new.budget_category_id
		)
	)
	EXECUTE FUNCTION budget_transaction_category_update_budget_category();

CREATE OR REPLACE FUNCTION budget_transaction_category_update_budget_month()
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		IF (
			SELECT income
			FROM budget_category
			WHERE id = new.budget_category_id
		)
		THEN
			INSERT INTO BUDGET_MONTH (
				  auth_household_id
				, budget_transaction_amount_income
				, year_month
			) VALUES (
				  new.auth_household_id
				, new.amount
				, new.year_month
			) ON CONFLICT (
				  auth_household_id
				, year_month
			) DO UPDATE SET 
				budget_transaction_amount_income = budget_month.budget_transaction_amount_income + new.amount;
		END IF;
	ELSIF TG_OP = 'DELETE'
	THEN
		IF (
			SELECT income
			FROM budget_category
			WHERE id = old.budget_category_id
		)
		THEN
			UPDATE budget_month
			SET budget_transaction_amount_income = budget_transaction_amount_income - old.amount
			WHERE auth_household_id = old.auth_household_id
			AND year_month = old.year_month;
		END IF;
	ELSIF TG_OP = 'UPDATE'
	THEN
		IF (
			SELECT income
			FROM BUDGET_CATEGORY
			WHERE id = old.budget_category_id
		)
		THEN
			UPDATE budget_month
			SET budget_transaction_amount_income = budget_transaction_amount_income - old.amount
			WHERE auth_household_id = old.auth_household_id
			AND year_month = old.year_month;
		END IF;

		IF (
			SELECT income
			FROM budget_category
			WHERE id = new.budget_category_id
		)
		THEN
			INSERT INTO budget_month (
				  auth_household_id
				, budget_transaction_amount_income
				, year_month
			) VALUES (
				  new.auth_household_id
				, new.amount
				, new.year_month
			) ON CONFLICT (
					  auth_household_id
					, year_month
			) DO UPDATE SET 
				budget_transaction_amount_income = budget_month.budget_transaction_amount_income + new.amount;
		END IF;
	END IF;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_budget_month
	AFTER DELETE ON budget_transaction_category
	FOR EACH ROW
	EXECUTE FUNCTION budget_transaction_category_update_budget_month();
CREATE OR REPLACE TRIGGER ai_budget_month
	AFTER INSERT ON budget_transaction_category
	FOR EACH ROW
	EXECUTE FUNCTION budget_transaction_category_update_budget_month();
CREATE OR REPLACE TRIGGER au_budget_month
	AFTER UPDATE ON budget_transaction_category
	FOR EACH ROW WHEN (
		(
			old.amount,
			old.year_month
		) IS DISTINCT FROM (
			new.amount,
			new.year_month
		)
	)
	EXECUTE FUNCTION budget_transaction_category_update_budget_month();
CREATE OR REPLACE TRIGGER au_budget_month
	AFTER UPDATE ON budget_transaction_category
	FOR EACH ROW WHEN (
			(
				old.amount,
				old.budget_category_id,
				old.year_month
			) is distinct from (
				new.amount,
				new.budget_category_id,
				new.year_month
			)
		)
	EXECUTE FUNCTION budget_transaction_category_update_budget_month();

CREATE OR REPLACE FUNCTION budget_transaction_category_update_budget_month_category() 
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		INSERT INTO budget_month_category (
			  auth_household_id
			, budget_category_id
			, budget_transaction_amount
			, year_month
		) VALUES (
			  new.auth_household_id
			, new.budget_category_id
			, new.amount
			, new.year_month
		) ON CONFLICT (
			  auth_household_id
			, budget_category_id
			, year_month
		) DO UPDATE SET 
			budget_transaction_amount = budget_month_category.budget_transaction_amount + new.amount;
		
		INSERT INTO budget_month (
			  auth_household_id
			, year_month
		) VALUES (
			  new.auth_household_id
			, new.year_month
		) ON CONFLICT (
			  auth_household_id
			, year_month
		) DO NOTHING;
	ELSIF TG_OP = 'DELETE'
	THEN
		UPDATE budget_month_category
		SET budget_transaction_amount = budget_transaction_amount - old.amount
		WHERE auth_household_id = old.auth_household_id
		AND budget_category_id = old.budget_category_id
		AND year_month = old.year_month;
	ELSIF TG_OP = 'UPDATE' then
		IF old.budget_category_id IS NOT NULL
		THEN
			UPDATE budget_month_category
			SET budget_transaction_amount = budget_transaction_amount - old.amount
			WHERE auth_household_id = old.auth_household_id
			AND budget_category_id = old.budget_category_id
			AND year_month = old.year_month;
		END IF;

		IF new.budget_category_id IS NOT NULL
		THEN
			INSERT INTO budget_month_category (
				  auth_household_id
				, budget_category_id
				, budget_transaction_amount
				, year_month
			) VALUES (
				  new.auth_household_id
				, new.budget_category_id
				, new.amount
				, new.year_month
			) ON CONFLICT (
				  auth_household_id
				, budget_category_id
				, year_month
			) DO UPDATE SET 
					budget_transaction_amount = budget_month_category.budget_transaction_amount + new.amount;
				
			INSERT INTO budget_month (
				  auth_household_id
				, year_month
			) VALUES (
				  new.auth_household_id
				, new.year_month
			) ON CONFLICT (
				  auth_household_id
				, year_month
			) DO NOTHING;
		END IF;
	END IF;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ai_budget_month_category
	AFTER INSERT ON budget_transaction_category
	FOR EACH ROW
	EXECUTE FUNCTION budget_transaction_category_update_budget_month_category();
CREATE OR REPLACE TRIGGER ad_budget_month_category
	AFTER DELETE ON budget_transaction_category
	FOR EACH ROW
	EXECUTE FUNCTION budget_transaction_category_update_budget_month_category();
CREATE OR REPLACE TRIGGER au_budget_month_category
AFTER UPDATE ON budget_transaction_category
	FOR EACH ROW WHEN (
		(
			old.amount,
			old.budget_category_id,
			old.year_month
		) IS DISTINCT FROM (
			new.amount,
			new.budget_category_id,
			new.year_month
		)
	)
	EXECUTE FUNCTION budget_transaction_category_update_budget_month_category();
