CREATE OR REPLACE TRIGGER adiu_cook_meal_time_notify
	AFTER DELETE OR INSERT OR UPDATE ON cook_meal_time
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_cook_meal_time_noop
	BEFORE UPDATE ON cook_meal_time
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_cook_meal_time_updated
	BEFORE UPDATE ON cook_meal_time
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();
