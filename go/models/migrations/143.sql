UPDATE auth_household
SET preferences = preferences - 'colorPlanTasksEvents' || jsonb_build_object(
    'colorPlanTaskEvents', color_to_string(preferences ->> 'colorPlanTaskEvents')
);
DROP FUNCTION IF EXISTS color_to_string;
