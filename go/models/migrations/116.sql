UPDATE budget_recurrence SET template = jsonb_set(template, '{authHouseholdID}', concat('"', auth_household_id::text, '"')::jsonb)
