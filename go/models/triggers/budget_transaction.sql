CREATE OR REPLACE TRIGGER bu_budget_transaction_noop
	BEFORE UPDATE ON budget_transaction
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();

CREATE OR REPLACE FUNCTION budget_transaction_update_budget_payee()
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		UPDATE budget_payee
		SET budget_transaction_amount = budget_transaction_amount + new.amount
		WHERE id = new.budget_payee_id
		AND auth_household_id = new.auth_household_id;
	ELSIF TG_OP = 'DELETE'
	THEN
		UPDATE budget_payee
		SET budget_transaction_amount = budget_transaction_amount - old.amount
		WHERE id = old.budget_payee_id
		AND auth_household_id = old.auth_household_id;
	ELSIF TG_OP = 'UPDATE'
	THEN
		UPDATE budget_payee
		SET budget_transaction_amount = budget_transaction_amount - old.amount
		WHERE id = old.budget_payee_id
		AND auth_household_id = old.auth_household_id;

		UPDATE budget_payee
		SET budget_transaction_amount = budget_transaction_amount + new.amount
		WHERE id = new.budget_payee_id
		AND auth_household_id = new.auth_household_id;
	END IF;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_budget_payee
	AFTER DELETE ON budget_transaction
	FOR EACH ROW WHEN (
		old.budget_payee_id IS NOT NULL
	)
	EXECUTE FUNCTION budget_transaction_update_budget_payee();
CREATE OR REPLACE TRIGGER ai_budget_payee
	AFTER INSERT ON budget_transaction
	FOR EACH ROW WHEN (
		new.budget_payee_id IS NOT NULL
	)
	EXECUTE FUNCTION budget_transaction_update_budget_payee();
CREATE OR REPLACE TRIGGER au_budget_payee
	AFTER UPDATE ON budget_transaction
	FOR EACH ROW WHEN (
		(
			old.amount,
			old.budget_payee_id
		) IS DISTINCT FROM (
			new.amount,
			new.budget_payee_id
		)
	)
	EXECUTE FUNCTION budget_transaction_update_budget_payee();
