CREATE OR REPLACE TRIGGER bu_budget_month
	BEFORE UPDATE ON budget_month
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
