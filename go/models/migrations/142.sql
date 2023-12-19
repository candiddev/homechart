CREATE or replace FUNCTION color_to_string(TEXT)
  RETURNS text
AS $$
DECLARE
  out TEXT;
BEGIN
  SELECT str INTO out
  FROM (
    VALUES
        ('1', 'red')
      , ('2', 'pink')
      , ('3', 'orange')
      , ('4', 'yellow')
      , ('5', 'green')
      , ('6', 'teal')
      , ('7', 'blue')
      , ('8', 'indigo')
      , ('9', 'purple')
      , ('10', 'brown')
      , ('11', 'black')
      , ('12', 'gray')
      , ('13', 'white')
  ) AS v (num,str)
  WHERE num = $1;

  IF out IS NULL THEN
    RETURN '';
  END IF;

  RETURN out;
END
$$ LANGUAGE plpgsql;

ALTER TABLE auth_account_auth_household DROP CONSTRAINT auth_account_auth_household_color_check;
ALTER TABLE auth_account_auth_household ALTER COLUMN color TYPE TEXT USING color::text;
UPDATE auth_account_auth_household SET color = color_to_string(color);

ALTER TABLE calendar_event DROP CONSTRAINT calendar_event_color_check;
ALTER TABLE calendar_event ALTER COLUMN color TYPE TEXT USING color::text;
UPDATE calendar_event SET color = color_to_string(color);

ALTER TABLE health_item DROP CONSTRAINT health_item_color_check;
ALTER TABLE health_item ALTER COLUMN color TYPE TEXT USING color::text;
UPDATE health_item SET color = color_to_string(color);

ALTER TABLE notes_page DROP CONSTRAINT notes_page_color_check;
ALTER TABLE notes_page ALTER COLUMN color TYPE TEXT USING color::text;
UPDATE notes_page SET color = color_to_string(color);

ALTER TABLE plan_project DROP CONSTRAINT plan_project_color_check;
ALTER TABLE plan_project ALTER COLUMN color TYPE TEXT USING color::text;
UPDATE plan_project SET color = color_to_string(color);

ALTER TABLE plan_task DROP CONSTRAINT plan_task_color_check;
ALTER TABLE plan_task ALTER COLUMN color TYPE TEXT USING color::text;
UPDATE plan_task SET color = color_to_string(color);

UPDATE auth_account
SET preferences = preferences || jsonb_build_object(
    'colorAccent', color_to_string(preferences ->> 'colorAccent')
  , 'colorNegative', color_to_string(preferences ->> 'colorNegative')
  , 'colorPositive', color_to_string(preferences ->> 'colorPositive')
  , 'colorPrimary', color_to_string(preferences ->> 'colorPrimary')
  , 'colorSecondary', color_to_string(preferences ->> 'colorSecondary')
);

UPDATE auth_household
SET preferences = preferences || jsonb_build_object(
    'colorBudgetRecurrenceEvents', color_to_string(preferences ->> 'colorBudgetRecurrenceEvents')
  , 'colorCookMealPlanEvents', color_to_string(preferences ->> 'colorCookMealPlanEvents')
  , 'colorPlanTasksEvents', color_to_string(preferences ->> 'colorPlanTasksEvents')
);
