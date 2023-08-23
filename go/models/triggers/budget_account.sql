CREATE OR REPLACE TRIGGER adiu_budget_account_notify
	AFTER DELETE OR INSERT OR UPDATE ON budget_account
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_budget_account_noop
	BEFORE UPDATE ON budget_account
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_budget_account_updated
	BEFORE UPDATE ON budget_account
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();
