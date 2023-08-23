UPDATE calendar_event
	SET recurrence = JSONB_SET(recurrence, '{separation}', '1')
	WHERE recurrence->'separation' = '0';

UPDATE calendar_event
	SET recurrence = JSONB_BUILD_OBJECT(
		  'day', 0
		, 'month', 0
		,'weekday', 0
		, 'weekdays', ARRAY[recurrence->'weekday']
		, 'monthWeek', 0
		, 'separation', 1
	)
	WHERE (recurrence->'weekday')::int != 0
		AND recurrence->'monthWeek' = '0';
