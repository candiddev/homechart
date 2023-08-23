UPDATE auth_account
	SET preferences = preferences || '{"ignoreEmailAgenda": true}'
WHERE preferences -> 'ignoreEmailAgenda' IS NULL;
