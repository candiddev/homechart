CREATE OR REPLACE TRIGGER bu_budget_transaction_account_noop
	BEFORE UPDATE ON budget_transaction_account
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();

CREATE OR REPLACE FUNCTION budget_transaction_account_update_budget_account()
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		UPDATE budget_account
		SET budget_transaction_amount = budget_transaction_amount + new.amount
		WHERE id = new.budget_account_id
		AND auth_household_id = new.auth_household_id;

		IF new.status >= 1
		THEN
			UPDATE budget_account
			SET budget_transaction_amount_cleared = budget_transaction_amount_cleared + new.amount
			WHERE id = new.budget_account_id
			AND auth_household_id = new.auth_household_id;
		END IF;

		IF new.status = 2
		THEN
			UPDATE budget_account
			SET budget_transaction_amount_reconciled = budget_transaction_amount_reconciled + new.amount
			WHERE id = new.budget_account_id
			AND auth_household_id = new.auth_household_id;
		END IF;
	ELSIF TG_OP = 'DELETE'
	THEN
		UPDATE budget_account
		SET budget_transaction_amount = budget_transaction_amount - old.amount
		WHERE id = old.budget_account_id
		AND auth_household_id = old.auth_household_id;

		IF old.status >= 1
		THEN
			UPDATE budget_account
			SET budget_transaction_amount_cleared = budget_transaction_amount_cleared - old.amount
			WHERE id = old.budget_account_id
			AND auth_household_id = old.auth_household_id;
		END IF;

		IF old.status = 2
		THEN
			UPDATE budget_account
			SET budget_transaction_amount_reconciled = budget_transaction_amount_reconciled - old.amount
			WHERE id = old.budget_account_id
			AND auth_household_id = old.auth_household_id;
		END IF;
	ELSIF TG_OP = 'UPDATE'
	THEN
		UPDATE budget_account
		SET budget_transaction_amount = budget_transaction_amount - old.amount
		WHERE id = old.budget_account_id
		AND auth_household_id = old.auth_household_id;

		UPDATE budget_account
		SET budget_transaction_amount = budget_transaction_amount + new.amount
		WHERE id = new.budget_account_id
		AND auth_household_id = new.auth_household_id;

		IF old.status >= 1
		THEN
			UPDATE budget_account
			SET budget_transaction_amount_cleared = budget_transaction_amount_cleared - old.amount
			WHERE id = old.budget_account_id
			AND auth_household_id = old.auth_household_id;
		END IF;

		IF old.status = 2
		THEN
			UPDATE budget_account
			SET budget_transaction_amount_reconciled = budget_transaction_amount_reconciled - old.amount
			WHERE id = old.budget_account_id
			AND auth_household_id = old.auth_household_id;
		END IF;

		IF new.status >= 1
		THEN
			UPDATE budget_account
			SET budget_transaction_amount_cleared = budget_transaction_amount_cleared + new.amount
			WHERE id = new.budget_account_id
			AND auth_household_id = new.auth_household_id;
		END IF;

		IF new.status = 2
		THEN
			UPDATE budget_account
			SET budget_transaction_amount_reconciled = budget_transaction_amount_reconciled + new.amount
			WHERE id = new.budget_account_id
			AND auth_household_id = new.auth_household_id;
		END IF;
	END IF;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_budget_account
	AFTER DELETE ON budget_transaction_account
	FOR EACH ROW
	EXECUTE FUNCTION budget_transaction_account_update_budget_account();
CREATE OR REPLACE TRIGGER ai_budget_account
	AFTER INSERT ON budget_transaction_account
	FOR EACH ROW
	EXECUTE FUNCTION budget_transaction_account_update_budget_account();
CREATE OR REPLACE TRIGGER au_budget_account
	AFTER UPDATE ON budget_transaction_account
	FOR EACH ROW WHEN (
		(
			old.amount,
			old.budget_account_id,
			old.status
		) IS DISTINCT FROM (
			new.amount,
			new.budget_account_id,
			new.status
		)
	)
	EXECUTE FUNCTION budget_transaction_account_update_budget_account();

CREATE OR REPLACE FUNCTION budget_transaction_account_delete_budget_transaction() 
RETURNS trigger AS $$
BEGIN
	DELETE FROM budget_transaction
	WHERE id = old.budget_transaction_id
	AND NOT EXISTS (
		SELECT
		FROM budget_transaction_account
		WHERE budget_transaction_id = old.budget_transaction_id
	);

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_budget_transaction
	AFTER DELETE ON budget_transaction_account
	FOR EACH ROW
	EXECUTE FUNCTION budget_transaction_account_delete_budget_transaction();
