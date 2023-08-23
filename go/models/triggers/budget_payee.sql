CREATE OR REPLACE TRIGGER adiu_budget_payee_notify
	AFTER DELETE OR INSERT OR UPDATE ON budget_payee
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_budget_payee_noop
	BEFORE UPDATE ON budget_payee
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_budget_payee_updated
	BEFORE UPDATE ON budget_payee
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();
