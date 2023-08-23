CREATE OR REPLACE FUNCTION check_recurrence (
	  date_end DATE
	, date_start DATE
	, date_target DATE
	, recurrence JSONB
	, skip_days DATE[]
)
RETURNS BOOL AS $$
BEGIN
	WHILE
		recurrence IS NOT NULL
		AND recurrence->'separation' != '0'
		AND (
			date_start < date_target
			OR date_start::DATE = ANY(skip_days)
		)
	LOOP
		date_start = recur_timestamp(date_start::TIMESTAMP, recurrence)::DATE;
	END LOOP;

	RETURN date_start = date_target AND (
		date_end IS NULL
		OR date_start < date_end
	);
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_lastday (
	t TIMESTAMP WITH TIME ZONE
)
RETURNS INT AS $$
DECLARE
	lastdays INT[] DEFAULT ARRAY[31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
	year INT;
BEGIN
	year = EXTRACT(year FROM t);

	/* check if leap year */
	IF MOD(year, 4) = 0
	THEN
		lastdays[2] = 29;
	END IF;

	RETURN lastdays[EXTRACT(month FROM t)];
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_monthweek (
	  t TIMESTAMP WITH TIME ZONE
	, LAST bool
)
RETURNS INT AS $$
DECLARE
	week INT;
BEGIN
	IF last
	THEN
		week = CEILING(
			(
				get_lastday(t) - EXTRACT(day FROM t)::INT
			) / 7
		);

		IF week > 4
		THEN
			RETURN -4;
		END IF;

		IF week = 0
		THEN
			RETURN -1;
		END IF;

		RETURN week * -1;
	ELSE
		week = CEILING(
			EXTRACT(day FROM t)::INT / 7
		);

		IF week > 4
		THEN
			RETURN 4;
		END IF;

		IF week = 0
		THEN
			RETURN 1;
		END IF;

		RETURN week;
	END IF;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_day (
	  t TIMESTAMP WITH TIME ZONE
	, day INT
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
	lastday INT;
BEGIN
	lastday = get_lastday(t);

	IF day > lastday
	THEN
		day = lastday;
	END IF;

	IF EXTRACT(day FROM t) > day
	THEN
		t = t + INTERVAL '1 day' * (lastday - EXTRACT(day FROM t) + day);
	ELSE
		t = t + INTERVAL '1 day' * (day - EXTRACT(day FROM t));
	END IF;

	RETURN t;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_weekday (
	  t TIMESTAMP WITH TIME ZONE
	, day INT
)
RETURNS TIMESTAMP AS $$
BEGIN
	IF EXTRACT(isodow FROM t)::INT > day
	THEN
		t = t + INTERVAL '1 day' * (7 - EXTRACT(isodow FROM t)::INT + day);
	ELSIF EXTRACT(isodow FROM t)::INT < day
	THEN
		t = t + INTERVAL '1 day' * (day - EXTRACT(isodow FROM t)::INT);
	END IF;

	RETURN t;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION set_monthweek_weekday (
	  t TIMESTAMP WITH TIME ZONE
	, monthweek INT
	, weekday INT
)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
	start_week INT;
BEGIN
	start_week = get_monthweek(t, monthweek > 0);

	IF monthweek > 0
	THEN
		IF start_week > monthweek
		OR monthweek = 1
		THEN
			t = set_day(t, 1);
		ELSE
			t = set_day(t, 7 * (monthweek - 1));
		END IF;
	ELSE
		IF start_week > monthweek
		THEN
			t = set_day(t, 1);
		END IF;

		t = set_day(t, get_lastday(t) + 7 * monthweek);
	END IF;

	t = set_weekday(t, weekday);

	RETURN t;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION recur_timestamp (
	  t TIMESTAMP
	, recurrence JSONB
)
RETURNS TIMESTAMP AS $$
DECLARE
	next TIMESTAMP;
	r_day INT;
	r_month INT;
	r_monthweek INT;
	r_separation INT;
	r_weekday INT;
	r_weekdays INT[];
BEGIN
	/* Decode recurrence */
	r_day = (recurrence -> 'day')::INT;
	r_month = (recurrence -> 'month')::INT;
	r_monthweek = (recurrence -> 'monthWeek')::INT;
	r_separation = (recurrence -> 'separation')::INT;
	r_weekday = (recurrence -> 'weekday')::INT;

	/* Decode recurrence.weekdays */
	IF recurrence -> 'weekdays' != 'null'
	THEN
		SELECT ARRAY_AGG(arr)::INT[]
		INTO r_weekdays
		FROM (
			SELECT jsonb_array_elements(recurrence -> 'weekdays') AS arr
			ORDER BY arr
		) AS _;
	END IF;

	/* Every X days */
	IF r_day = 0
	AND r_month = 0
	AND r_monthweek = 0
	AND r_separation != 0
	AND r_weekday = 0
	AND r_weekdays IS NULL
	THEN
		t = t + INTERVAL '1 day' * r_separation;

	/* Every X weekdays */
	ELSIF r_day = 0
	AND r_month = 0
	AND r_monthweek = 0
	AND r_separation != 0
	AND r_weekday = 0
	AND r_weekdays IS NOT NULL
	AND ARRAY_LENGTH(r_weekdays, 1) > 0
	THEN
		IF EXTRACT(isodow FROM t)::INT >= ALL (r_weekdays)
		THEN
			t = t + INTERVAL '1 day' * (7 * (r_separation - 1));
		END IF;

		t = t + INTERVAL '1 day';

		WHILE NOT (
			extract(isodow FROM t)::INT = ANY (r_weekdays)
		) LOOP
			t = t + INTERVAL '1 day';
		END LOOP;

	/* Every day of X months */
	ELSIF r_day != 0
	AND r_month = 0
	AND r_monthweek = 0
	AND r_separation != 0
	AND r_weekday = 0
	AND r_weekdays IS NULL
	THEN
		t = t + INTERVAL '1 day';
		t = set_day(t, r_day);
		t = t + INTERVAL '1 month' * (r_separation - 1);
		t = set_day(t, r_day);

	/* Every weekday of monthweek of X months */
	ELSIF r_day = 0
	AND r_month = 0
	AND r_monthweek != 0
	AND r_separation != 0
	AND r_weekday != 0
	AND r_weekdays IS NULL
	THEN
		WHILE r_separation > 0 LOOP
			t = t + interval '1 day';

			next = t;
			next = next - INTERVAL '1 day' * (EXTRACT(day FROM t)::INT - 1);
			next = set_monthweek_weekday(next, r_monthweek, r_weekday);

			IF next < t
			THEN
				next = next - INTERVAL '1 day' * (EXTRACT(day FROM t)::INT - 1);
				next = next + INTERVAL '1 month';
				next = set_monthweek_weekday(next, r_monthweek, r_weekday);
			END IF;

			t = next;

			r_separation = r_separation - 1;
		END LOOP;

	/* Every day of month of X years */
	ELSIF r_day != 0
	AND r_month != 0
	AND r_monthweek = 0
	AND r_separation != 0
	AND r_weekday = 0
	AND r_weekdays IS NULL
	THEN
		t = t + INTERVAL '1 day';
		t = set_day(t, r_day);

		IF r_month < extract(month FROM t)
		THEN
			t = t + INTERVAL '1 month' * (12 + r_month - EXTRACT(month FROM t));
		ELSIF r_month > EXTRACT(month FROM t)
		THEN
			t = t + INTERVAL '1 month' * (r_month - EXTRACT(month FROM t));
		END IF;

		t = t + INTERVAL '1 month' * (12 * (r_separation - 1));

	/* Every weekday of monthweek of month of X years */
	ELSIF r_day = 0
	AND r_month != 0
	AND r_monthweek != 0
	AND r_separation != 0
	AND r_weekday != 0
	AND r_weekdays IS NULL
	THEN
		WHILE r_separation > 0 LOOP
			t = t + INTERVAL '1 day';

			next = t;
			next = next - INTERVAL '1 day' * (EXTRACT(day FROM t) - 1);
			next = next - INTERVAL '1 month' * (EXTRACT(month FROM t));
			next = next + INTERVAL '1 month' * (r_month);
			next = set_monthweek_weekday(next, r_monthweek, r_weekday);

			IF next < t
			THEN
				next = next - INTERVAL '1 day' * (EXTRACT(day FROM t) - 1);
				next = next + INTERVAL '1 year';
				next = set_monthweek_weekday(next, r_monthweek, r_weekday);
			END IF;

			t = next;

			r_separation = r_separation - 1;
		END LOOP;
	END IF;

	RETURN T;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION notify()
RETURNS trigger AS $$
DECLARE
	_auth_account_id uuid;
	_auth_household_id uuid;
	_id uuid;
	_operation int default 0;
	_updated timestamp with time zone;
BEGIN
	IF TG_OP = 'DELETE'
	THEN
		_id = old.id;
		_operation = 1;

		IF TG_TABLE_NAME = 'auth_account'
		THEN
			_auth_account_id = old.id;
		ELSIF TG_TABLE_NAME = 'auth_account_auth_household'
		THEN
			_auth_account_id = old.auth_account_id;
			_auth_household_id = old.auth_household_id;
			_id = old.auth_household_id;
		ELSIF TG_TABLE_NAME = 'auth_household'
		THEN
			_auth_household_id = old.id;
		ELSIF TG_TABLE_NAME = 'auth_session'
		THEN
			_auth_account_id = old.auth_account_id;
		ELSIF TG_TABLE_NAME = 'health_item'
		OR TG_TABLE_NAME = 'health_log'
		THEN
			_auth_account_id = old.auth_account_id;
			SELECT
				primary_auth_household_id
			INTO
				_auth_household_id
			FROM auth_account
			WHERE auth_account.id = old.auth_account_id
			AND auth_account.child;
		ELSIF TG_TABLE_NAME = 'calendar_event'
		OR TG_TABLE_NAME = 'calendar_icalendar'
		OR TG_TABLE_NAME = 'bookmark'
		OR TG_TABLE_NAME = 'notes_page'
		OR TG_TABLE_NAME = 'plan_project'
		OR TG_TABLE_NAME = 'plan_task'
		OR TG_TABLE_NAME = 'secrets_vault'
		OR TG_TABLE_NAME = 'shop_item'
		OR TG_TABLE_NAME = 'shop_list'
		THEN
			_auth_account_id = old.auth_account_id;
			_auth_household_id = old.auth_household_id;
		ELSIF TG_TABLE_NAME = 'reward_card'
		THEN
			_id = NULL;
			_auth_household_id = old.auth_household_id;
		ELSIF TG_TABLE_NAME = 'notes_page_version'
		THEN
			SELECT
				  notes_page.auth_account_id
				, notes_page.auth_household_id
			INTO
				  _auth_account_id
				, _auth_household_id
			FROM notes_page
			WHERE notes_page.id = old.notes_page_id;
		ELSIF TG_TABLE_NAME = 'secrets_value'
		THEN
			SELECT
				  secrets_vault.auth_account_id
				, secrets_vault.auth_household_id
			INTO
				  _auth_account_id
				, _auth_household_id
			FROM secrets_vault
			WHERE secrets_vault.id = old.secrets_vault_id;
		ELSE
			_auth_household_id = old.auth_household_id;
		END IF;
	ELSE
		_id = new.id;

		IF TG_TABLE_NAME = 'auth_account'
		THEN
			_auth_account_id = new.id;
		ELSIF TG_TABLE_NAME = 'auth_account_auth_household'
		THEN
			_auth_account_id = new.auth_account_id;
			_auth_household_id = new.auth_household_id;
			_id = new.auth_household_id;
		ELSIF TG_TABLE_NAME = 'auth_household'
		THEN
			_auth_household_id = new.id;
		ELSIF TG_TABLE_NAME = 'auth_session'
		THEN
			_auth_account_id = new.auth_account_id;
		ELSIF TG_TABLE_NAME = 'health_item'
		OR TG_TABLE_NAME = 'health_log'
		THEN
			_auth_account_id = new.auth_account_id;
			SELECT
				primary_auth_household_id
			INTO
				_auth_household_id
			FROM auth_account
			WHERE auth_account.id = new.auth_account_id
			AND auth_account.child;
		ELSIF TG_TABLE_NAME = 'reward_card'
		THEN
			_id = NULL;
			_auth_household_id = new.auth_household_id;
		ELSIF TG_TABLE_NAME = 'calendar_event'
		OR TG_TABLE_NAME = 'calendar_icalendar'
		OR TG_TABLE_NAME = 'bookmark'
		OR TG_TABLE_NAME = 'notes_page'
		OR TG_TABLE_NAME = 'plan_project'
		OR TG_TABLE_NAME = 'plan_task'
		OR TG_TABLE_NAME = 'secrets_vault'
		OR TG_TABLE_NAME = 'shop_item'
		OR TG_TABLE_NAME = 'shop_list'
		THEN
			_auth_account_id = new.auth_account_id;
			_auth_household_id = new.auth_household_id;
		ELSIF TG_TABLE_NAME = 'notes_page_version'
		THEN
			SELECT
				  notes_page.auth_account_id
				, notes_page.auth_household_id
			INTO
				  _auth_account_id
				, _auth_household_id
			FROM notes_page
			WHERE notes_page.id = new.notes_page_id;
		ELSIF TG_TABLE_NAME = 'secrets_value'
		THEN
			SELECT
				  secrets_vault.auth_account_id
				, secrets_vault.auth_household_id
			INTO
				  _auth_account_id
				, _auth_household_id
			FROM secrets_vault
			WHERE secrets_vault.id = new.secrets_vault_id;
		ELSE
			_auth_household_id = new.auth_household_id;
		END IF;

		IF TG_TABLE_NAME != 'auth_session'
		THEN
			_updated = new.updated;
		END IF;

		IF TG_OP = 'UPDATE'
		THEN
			_operation = 2;
		END IF;
	END IF;

	IF TG_TABLE_NAME = 'auth_account'
	THEN
		DELETE FROM cache
		WHERE (
			cache.id = _auth_account_id
			AND table_name = 'auth_account'
		) OR (
			(
				cache.auth_account_id = _auth_account_id
				OR cache.auth_household_id = _auth_household_id
			)
			AND table_name = 'auth_account_notify'
		);

		DELETE FROM cache
		USING auth_account_auth_household
		WHERE auth_account_auth_household.auth_account_id = _auth_account_id
		AND cache.auth_household_id = auth_account_auth_household.auth_household_id
		AND table_name = 'auth_household';

		_auth_household_id = null;
	ELSIF TG_TABLE_NAME = 'auth_account_auth_household'
	THEN
		DELETE FROM cache
		WHERE id = _auth_household_id
			AND table_name = 'auth_household';
		DELETE FROM cache
		WHERE auth_account_id = _auth_account_id
			AND table_name = 'auth_session';
	ELSIF TG_TABLE_NAME = 'auth_household'
	THEN
		DELETE FROM cache
		WHERE id = _auth_household_id
			AND table_name = 'auth_household';
	ELSIF TG_TABLE_NAME = 'auth_session'
	THEN
		DELETE FROM cache
		WHERE (
			(
			auth_account_id = _auth_account_id
			OR auth_household_id = _auth_household_id
			) AND table_name = 'auth_account_notify'
		) OR (
			id = _id
			AND table_name = 'auth_session'
		);

		_auth_household_id = null;
	ELSIF TG_TABLE_NAME = 'health_item'
	OR TG_TABLE_NAME = 'health_log'
	OR TG_TABLE_NAME = 'reward_card'
	THEN
		DELETE FROM cache
		USING auth_account_auth_household
		WHERE auth_account_auth_household.auth_household_id = _auth_household_id
		AND cache.auth_account_id = auth_account_auth_household.auth_account_id
		AND table_name = TG_TABLE_NAME;
	ELSE
		DELETE FROM cache
		WHERE
			table_name = TG_TABLE_NAME
			AND (
				(
					auth_account_id IS NOT NULL
					AND auth_account_id = _auth_account_id
				) OR (
					auth_household_id IS NOT NULL
					AND auth_household_id = _auth_household_id
				) OR (
					id IS NOT NULL
					AND id = _id
				)
			);
	END IF;

	EXECUTE 'notify changes, '''
		|| json_build_object(
			'authAccountID', _auth_account_id,
			'authHouseholdID', _auth_household_id,
			'id', _id,
			'operation', _operation,
			'table', TG_TABLE_NAME,
			'updated', _updated
		) || '''';

	RETURN NULL;
END
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_noop()
RETURNS TRIGGER AS $$
BEGIN
	RETURN NULL;
END
$$ language plpgsql;

CREATE OR REPLACE FUNCTION update_updated()
RETURNS TRIGGER AS $$
BEGIN
	new.updated = current_timestamp;
	return new;
END
$$ LANGUAGE plpgsql;
