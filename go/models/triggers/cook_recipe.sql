CREATE OR REPLACE TRIGGER adiu_cook_recipe_notify
	AFTER DELETE OR INSERT OR UPDATE ON cook_recipe
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_cook_recipe_noop
	BEFORE UPDATE ON cook_recipe
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_cook_recipe_updated
	BEFORE UPDATE ON cook_recipe
	FOR EACH ROW WHEN (
		old *<> new
	)
	EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION cook_recipe_set_note_aggregates()
RETURNS trigger AS $$
BEGIN
	SELECT
		AVG((note->>'complexity')::int)::int,
		AVG((note->>'rating')::int)::int
	INTO
		new.complexity,
		new.rating
	FROM jsonb_array_elements(new.notes) AS note;

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_cook_recipe_notes
	BEFORE INSERT ON cook_recipe FOR EACH ROW WHEN (
		new.notes != '[]'
	)
	EXECUTE FUNCTION cook_recipe_set_note_aggregates();
CREATE OR REPLACE TRIGGER bu_cook_recipe_notes
	BEFORE UPDATE ON cook_recipe
	FOR EACH ROW WHEN (
		new.notes IS DISTINCT FROM old.notes
	)
	EXECUTE FUNCTION cook_recipe_set_note_aggregates();
