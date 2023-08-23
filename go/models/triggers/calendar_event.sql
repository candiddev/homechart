CREATE OR REPLACE TRIGGER adiu_calendar_event_notify
	AFTER DELETE OR INSERT OR UPDATE ON calendar_event
	FOR EACH ROW
	EXECUTE FUNCTION notify();
CREATE OR REPLACE TRIGGER bu_calendar_event_noop
	BEFORE UPDATE ON calendar_event
	FOR EACH ROW WHEN (
		old = new
	)
	EXECUTE FUNCTION update_noop();
CREATE OR REPLACE TRIGGER bu_calendar_event_updated
	BEFORE UPDATE ON calendar_event
	FOR EACH ROW WHEN (
		old *<> new
	)
EXECUTE FUNCTION update_updated();

CREATE OR REPLACE FUNCTION calendar_event_set_time_notification()
RETURNS trigger AS $$
DECLARE
	t timestamp with time zone;
BEGIN
	t = (new.date_start + new.time_start || new.time_zone);

	IF new.recurrence IS NOT NULL
	THEN
		WHILE TG_OP = 'UPDATE'
		AND (
			t::date < now()::date
			OR t::date = ANY(new.skip_days)
		)
		LOOP
			t = recur_timestamp(t::timestamp, new.recurrence);

			t = (t::date + new.time_start || new.time_zone);
		END LOOP;
	END IF;

	new.notified = false;
	new.time_notification = t - INTERVAL '1 minute' * (new.notify_offset + new.travel_time);

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_calendar_event_time_notification
	BEFORE INSERT ON calendar_event
	FOR EACH ROW WHEN (
		new.notify_offset IS NOT NULL
	)
	EXECUTE FUNCTION calendar_event_set_time_notification();
CREATE OR REPLACE TRIGGER bu_calendar_event_time_notification
	BEFORE UPDATE ON calendar_event
	FOR EACH ROW WHEN (
		new.notify_offset IS NOT NULL
		AND (
			new.date_start IS DISTINCT FROM old.date_start
			OR new.notify_offset IS DISTINCT FROM old.notify_offset
			OR new.recurrence IS DISTINCT FROM old.recurrence
			OR new.time_zone IS DISTINCT FROM old.time_zone
			OR new.time_start IS DISTINCT FROM old.time_start
			OR new.travel_time IS DISTINCT FROM old.travel_time
		)
	)
	EXECUTE FUNCTION calendar_event_set_time_notification();

CREATE OR REPLACE FUNCTION calendar_event_set_timestamp()
RETURNS trigger AS $$
BEGIN
	new.timestamp_start = ((new.date_start + new.time_start)::timestamp || new.time_zone)::timestamp with time zone at time zone 'UTC';
	new.timestamp_start = new.timestamp_start - INTERVAL '1 minute' * new.travel_time;
	new.timestamp_end = new.timestamp_start + INTERVAL '1 minute' * (new.travel_time + new.duration);

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bi_calendar_event_timestamp
	BEFORE INSERT ON calendar_event
	FOR EACH ROW
	EXECUTE FUNCTION calendar_event_set_timestamp();
CREATE OR REPLACE TRIGGER bu_calendar_event_timestamp
	BEFORE UPDATE ON calendar_event
	FOR EACH ROW WHEN (
		new.date_start IS DISTINCT FROM old.date_start
		OR new.duration IS DISTINCT FROM old.duration
		OR new.time_zone IS DISTINCT FROM old.time_zone
		OR new.time_start IS DISTINCT FROM old.time_start
		OR new.travel_time IS DISTINCT FROM old.travel_time
	)
	EXECUTE FUNCTION calendar_event_set_timestamp();

CREATE OR REPLACE FUNCTION calendar_event_set_recurrence_time_notification()
RETURNS trigger AS $$
DECLARE
	t timestamp with time zone;
BEGIN
	new.notified = false;

	t = new.time_notification + INTERVAL '1 minute' * (new.notify_offset + new.travel_time);

	/* ensure time_notification occurs after now to avoid blasting notifications */
	WHILE ((t::date + new.time_start || new.time_zone)::timestamp at time zone new.time_zone - INTERVAL '1 minute' * (new.notify_offset + new.travel_time))::date <= now()::date
	OR t::date = ANY(new.skip_days)
	LOOP
		t = recur_timestamp(t::timestamp, new.recurrence);
	END LOOP;

	new.time_notification = (t::date + new.time_start || new.time_zone)::timestamp at time zone new.time_zone - INTERVAL '1 minute' * (new.notify_offset + new.travel_time);

	RETURN new;
END
$$ LANGUAGE plpgsql;
CREATE OR REPLACE TRIGGER bu_calendar_event_recurrence_time_notification
	BEFORE UPDATE ON calendar_event
	FOR EACH ROW WHEN (
		new.recurrence IS NOT NULL
		AND new.notify_offset IS NOT NULL
		AND (
			new.notified IS true
			AND old.notified IS false
		) OR new.recurrence IS DISTINCT FROM old.recurrence
	)
	EXECUTE FUNCTION calendar_event_set_recurrence_time_notification();
