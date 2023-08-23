UPDATE auth_account
SET preferences = jsonb_set(preferences, '{notificationsHouseholds}', '[]');

UPDATE auth_account_auth_household
SET
	permissions = jsonb_build_object(
		  'auth', CASE
				WHEN permissions -> 'auth' = 'null'
				THEN '0'
				ELSE permissions -> 'auth'
			END
		, 'budget', CASE
				WHEN permissions -> 'budget' = 'null'
				THEN '0'
				ELSE permissions -> 'budget'
			END
		, 'calendar', CASE
				WHEN permissions -> 'calendar' = 'null'
				THEN '0'
				ELSE permissions -> 'calendar'
			END
		, 'cook', CASE
				WHEN permissions -> 'cook' = 'null'
				THEN '0'
				ELSE permissions -> 'cook'
			END
		, 'health', CASE
				WHEN permissions -> 'health' = 'null'
				THEN '0'
				ELSE permissions -> 'health'
			END
		, 'inventory', CASE
				WHEN permissions -> 'inventory' = 'null'
				THEN '0'
				ELSE permissions -> 'inventory'
			END
		, 'notes', CASE
				WHEN permissions -> 'notes' = 'null'
				THEN '0'
				ELSE permissions -> 'notes'
			END
		, 'plan', CASE
				WHEN permissions -> 'plan' = 'null'
				THEN '0'
				ELSE permissions -> 'plan'
			END
		, 'reward', CASE
				WHEN permissions -> 'reward' = 'null'
				THEN '0'
				ELSE permissions -> 'reward'
			END
		, 'shop', CASE
				WHEN permissions -> 'shop' = 'null'
				THEN '0'
				ELSE permissions -> 'shop'
			END
	);
