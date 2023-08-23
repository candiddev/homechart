CREATE OR REPLACE TRIGGER adiu_cook_meal_plan_notify
	AFTER DELETE OR INSERT OR UPDATE ON cook_meal_plan
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_cook_meal_plan_noop
	BEFORE UPDATE ON cook_meal_plan
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_cook_meal_plan_updated
	BEFORE UPDATE ON cook_meal_plan
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION cook_meal_plan_update_cook_recipe()
RETURNS trigger AS $$
BEGIN
	IF TG_OP = 'INSERT'
	THEN
		UPDATE cook_recipe
		SET
			cook_meal_plan_count = cook_meal_plan_count + 1
		WHERE id = new.cook_recipe_id
		AND auth_household_id = new.auth_household_id;

		UPDATE cook_recipe
		SET cook_meal_plan_last = new.date
		WHERE id = new.cook_recipe_id
		AND (
			cook_meal_plan_last < new.date
			OR cook_meal_plan_last IS NULL
		)
		AND auth_household_id = new.auth_household_id;
	ELSIF TG_OP = 'DELETE'
	THEN
		UPDATE cook_recipe SET
			cook_meal_plan_count = cook_meal_plan_count - 1
		WHERE id = old.cook_recipe_id
		AND auth_household_id = old.auth_household_id;
	ELSIF TG_OP = 'UPDATE'
	THEN
		UPDATE cook_recipe
		SET cook_meal_plan_count = cook_meal_plan_count - 1
		WHERE id = old.cook_recipe_id
		AND auth_household_id = old.auth_household_id;

		UPDATE cook_recipe
		SET cook_meal_plan_count = cook_meal_plan_count + 1
		WHERE id = new.cook_recipe_id
		AND auth_household_id = new.auth_household_id;

		UPDATE cook_recipe
		SET cook_meal_plan_last = new.date
		WHERE id = new.cook_recipe_id
		AND (
			cook_meal_plan_last < new.date
			OR cook_meal_plan_last IS NULL
		)
		AND auth_household_id = new.auth_household_id;
	END IF;

	RETURN NULL;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER ad_cook_recipe
	AFTER DELETE ON cook_meal_plan
 FOR EACH ROW WHEN (
	old.cook_recipe_id IS NOT NULL
	)
	EXECUTE FUNCTION cook_meal_plan_update_cook_recipe();
CREATE OR REPLACE TRIGGER ai_cook_recipe
	AFTER INSERT ON cook_meal_plan
	FOR EACH ROW WHEN (
		new.cook_recipe_id IS NOT NULL
	)
	EXECUTE FUNCTION cook_meal_plan_update_cook_recipe();
CREATE OR REPLACE TRIGGER au_cook_recipe
	AFTER UPDATE ON cook_meal_plan
	FOR EACH ROW WHEN (
		old.cook_recipe_id IS DISTINCT FROM new.cook_recipe_id
	)
	EXECUTE FUNCTION cook_meal_plan_update_cook_recipe();
