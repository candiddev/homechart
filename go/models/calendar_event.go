package models

import (
	"bytes"
	"context"
	"fmt"
	"strings"
	"text/template"
	"time"

	"github.com/candiddev/homechart/go/templates"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// CalendarEvent defines the calendar event fields.
type CalendarEvent struct {
	DateEnd             *types.CivilDate  `db:"date_end" format:"date" json:"dateEnd" swaggertype:"string"` // end of event or recurrence
	NotifyOffset        *int              `db:"notify_offset" json:"notifyOffset"`
	TimeNotification    *time.Time        `db:"time_notification" json:"-"` // generated by database, only used for notifications
	Recurrence          *types.Recurrence `db:"recurrence" json:"recurrence"`
	AuthAccountID       *uuid.UUID        `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	AuthHouseholdID     *uuid.UUID        `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	CalendarICalendarID *uuid.UUID        `db:"calendar_icalendar_id" format:"uuid" json:"calendarICalendarID"`
	Participants        types.SliceString `db:"participants" json:"participants"`
	SkipDays            types.SliceString `db:"skip_days" json:"skipDays"`
	Created             time.Time         `db:"created" format:"date-time" json:"created"`
	TimestampStart      time.Time         `db:"timestamp_start" format:"date-time" json:"timestampStart"` // set by database based on date_start + time_start at the right time zone
	TimestampEnd        time.Time         `db:"timestamp_end" format:"date-time" json:"timestampEnd"`     // set by database based on date_start + time_start + duration + travel_time at the right time zone
	Updated             time.Time         `db:"updated" format:"date-time" json:"updated"`
	DateStart           types.CivilDate   `db:"date_start" format:"date" json:"dateStart" swaggertype:"string"` // start of event or recurrence
	TimeStart           types.CivilTime   `db:"time_start" format:"time" json:"timeStart" swaggertype:"string"`
	ID                  uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Notified            bool              `db:"notified" json:"-"`
	Color               types.Color       `db:"color" json:"color"`
	Duration            types.PositiveInt `db:"duration" json:"duration"`
	TravelTime          types.PositiveInt `db:"travel_time" json:"travelTime"`
	Details             types.StringLimit `db:"details" json:"details"`
	ICalendarUID        types.StringLimit `db:"icalendar_uid" json:"-"`
	Location            types.StringLimit `db:"location" json:"location"`
	Name                types.StringLimit `db:"name" json:"name"`
	TimeZone            types.TimeZone    `db:"time_zone" json:"timeZone"`
} // @Name CalendarEvent

func (c *CalendarEvent) SetID(id uuid.UUID) {
	c.ID = id
}

func (c *CalendarEvent) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	c.ID = GenerateUUID()

	return logger.Log(ctx, db.Query(ctx, false, c, `
INSERT INTO calendar_event (
	  auth_account_id
	, auth_household_id
	, calendar_icalendar_id
	, color
	, date_end
	, date_start
	, details
	, duration
	, icalendar_uid
	, id
	, location
	, name
	, notify_offset
	, participants
	, recurrence
	, skip_days
	, time_start
	, time_zone
	, travel_time
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :calendar_icalendar_id
	, :color
	, :date_end
	, :date_start
	, :details
	, :duration
	, :icalendar_uid
	, :id
	, :location
	, :name
	, :notify_offset
	, :participants
	, :recurrence
	, :skip_days
	, :time_start
	, :time_zone
	, :travel_time
)
RETURNING *
`, c))
}

func (c *CalendarEvent) getChange(_ context.Context) string {
	if c.AuthHouseholdID != nil {
		return string(c.Name)
	}

	return ""
}

func (c *CalendarEvent) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return c.AuthAccountID, c.AuthHouseholdID, &c.ID
}

func (c *CalendarEvent) getStartTime(includeLeaveTime bool) string {
	add := int(c.TravelTime)
	prefix := "at "

	if !includeLeaveTime {
		add = 0
		prefix = ""
	}

	if c.NotifyOffset != nil {
		add += *c.NotifyOffset
	}

	tz, err := time.LoadLocation(c.TimeZone.String())
	if err != nil {
		if includeLeaveTime {
			return fmt.Sprintf("%s%s", prefix, c.TimeStart.String12())
		}

		return fmt.Sprintf("%s%s", prefix, c.TimeStart.AddMinutes(-1*int(c.TravelTime)).String12())
	}

	start := c.TimeNotification.Add(time.Duration(add) * time.Minute).In(tz)

	var startTime string

	if c.Duration%24 != 0 || !includeLeaveTime {
		startTime = fmt.Sprintf(" at %s", types.CivilTimeOf(start).String12())
	}

	now := time.Now().In(tz)

	if types.CivilDateOf(start).After(types.CivilDateOf(now)) {
		startDate := fmt.Sprintf("%s, %s %d", start.Weekday().String(), start.Month(), start.Day())

		if types.CivilDateOf(start) == types.CivilDateOf(now).AddDays(1) {
			startDate = "tomorrow"
		}

		return fmt.Sprintf("%s%s", startDate, startTime)
	}

	return fmt.Sprintf("%s%s", prefix, types.CivilTimeOf(start).String12())
}

func (*CalendarEvent) getType() modelType {
	return modelCalendarEvent
}

func (c *CalendarEvent) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
	switch {
	case c.AuthAccountID != nil && authAccountID != nil:
		c.AuthAccountID = authAccountID
		c.AuthHouseholdID = nil
	case c.AuthHouseholdID != nil && authHouseholdID != nil:
		c.AuthAccountID = nil
		c.AuthHouseholdID = authHouseholdID
	default:
		c.AuthAccountID = authAccountID
		c.AuthHouseholdID = authHouseholdID
	}
}

// ToICalendarEvents converts a CalendarEvent to ICalendarEvents.
func (c *CalendarEvent) ToICalendarEvents() types.ICalendarEvents {
	var end *types.CivilDate

	b := types.ICalendarEvent{
		Created:       &c.Created,
		Details:       c.Details,
		Duration:      c.TravelTime,
		Location:      c.Location,
		NotifyOffset:  c.NotifyOffset,
		Recurrence:    c.Recurrence,
		RecurrenceEnd: c.DateEnd,
		SkipDays:      c.SkipDays,
		Updated:       &c.Updated,
	}
	e := types.ICalendarEvents{}

	if len(c.Participants) > 0 {
		b.Details = types.StringLimit(fmt.Sprintf("Participants: %s\n\n%s", strings.Join(c.Participants, ", "), c.Details))
	}

	if int(c.Duration)%(60*24) == 0 {
		d := 1

		if c.Duration > 0 {
			d = int(c.Duration) / (60 * 24)
		}

		e := c.DateStart.AddDays(d)
		end = &e
	}

	if c.TravelTime != 0 {
		ts := c.TimestampStart
		n := b
		n.Duration = c.TravelTime
		n.ID = types.StringLimit(fmt.Sprintf("%s_travel", c.ID))
		n.Name = types.StringLimit(fmt.Sprintf("Event: Travel to %s", c.Location))
		n.TimestampStart = &ts

		if end != nil {
			n.DateStart = &c.DateStart
			n.DateEnd = end
		}

		e = append(e, n)

		c.TimestampStart = c.TimestampStart.Add(1 * time.Minute * time.Duration(c.TravelTime))
	}

	n := b
	n.Duration = c.Duration
	n.ID = types.StringLimit(c.ID.String())
	n.Name = types.StringLimit("Event: " + string(c.Name))
	n.TimestampStart = &c.TimestampStart

	if end != nil {
		n.DateStart = &c.DateStart
		n.DateEnd = end
	}

	e = append(e, n)

	return e
}

func (c *CalendarEvent) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
UPDATE calendar_event
SET
	  auth_account_id = :auth_account_id
	, auth_household_id = :auth_household_id
	, date_end = :date_end
	, date_start = :date_start
	, color = :color
	, details = :details
	, duration = :duration
	, location = :location
	, name = :name
	, notify_offset = :notify_offset
	, participants = :participants
	, recurrence = :recurrence
	, skip_days = :skip_days
	, time_start = :time_start
	, time_zone = :time_zone
	, travel_time = :travel_time
WHERE id = :id
AND (
	auth_account_id = '%s'
	OR auth_household_id = ANY('%s')
)
RETURNING *
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs())

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, c, query, c))
}

// CalendarEvents is multiple CalendarEvent.
type CalendarEvents []CalendarEvent

func (*CalendarEvents) getType() modelType {
	return modelCalendarEvent
}

// CalendarEventsDelete deletes old CalendarEvents from a database.
func CalendarEventsDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
DELETE FROM calendar_event
WHERE
	recurrence IS NULL
	AND timestamp_end < current_date - INTERVAL '%[1]d day'`, c.App.KeepCalendarEventDays)

	logger.Log(ctx, db.Exec(ctx, query, nil)) //nolint:errcheck
}

// CalendarEventsReadAssistant reads all events for an assistant and returns a text prompt.
func CalendarEventsReadAssistant(ctx context.Context, p PermissionsOpts, date types.CivilDate, dateOriginal, timeZone string, next bool, _ yaml8n.ISO639Code) (speech, link string, list []string) { //nolint:revive
	ctx = logger.Trace(ctx)

	f, err := getFilter(ctx, &CalendarEvent{}, p)
	if err != nil {
		return speechForbidden, "", []string{}
	}

	filter := map[string]any{
		"auth_account_id":    f.AuthAccountID,
		"auth_household_ids": f.AuthHouseholdIDs,
		"date":               date,
		"time_zone":          timeZone,
	}

	var c string

	var events CalendarEvents

	query := fmt.Sprintf(`
SELECT
	  name
	, notify_offset
	, time_notification
	, time_start
	, time_zone
	, travel_time
FROM calendar_event
%s
`, conditionAccountOrHousehold)

	query += `
AND time_notification IS NOT NULL
AND check_recurrence(date_end, date_start, :date, recurrence, skip_days)
ORDER BY time_start asc`

	err = db.Query(ctx, true, &events, query, filter)

	if next && err == nil && len(events) > 0 {
		speech := templates.AssistantEventNext(string(events[0].Name), events[0].TimeStart.String12())

		if events[0].TravelTime > 0 {
			speech += templates.AssistantEventNextLeave(events[0].getStartTime(true))
		}

		return speech, "", []string{}
	}

	if len(events) > 0 {
		c += fmt.Sprintf("%s, starting at %s", getDateOriginal(dateOriginal, true), events[0].TimeStart.String12())
	}

	eventNames := []string{}

	for _, event := range events {
		eventNames = append(eventNames, string(event.Name))
	}

	return toSpeechList(err, eventNames, c, "event", "/calendar")
}

// CalendarEventsReadICalendar reads all CalendarEvents for an ICalendarID.
func CalendarEventsReadICalendar(ctx context.Context, id *uuid.NullUUID) (types.ICalendarEvents, errs.Err) {
	ctx = logger.Trace(ctx)

	c := CalendarEvents{}

	e := types.ICalendarEvents{}

	err := db.Query(ctx, true, &c, `
SELECT
	  array_agg(DISTINCT participants.name) as participants
	, calendar_event.created
	, calendar_event.date_end
	, calendar_event.date_start
	, calendar_event.details
	, calendar_event.duration
	, calendar_event.id
	, calendar_event.location
	, calendar_event.notify_offset
	, calendar_event.recurrence
	, calendar_event.skip_days
	, calendar_event.name
	, calendar_event.time_start
	, calendar_event.timestamp_start
	, calendar_event.travel_time
	, calendar_event.updated
FROM calendar_event
LEFT JOIN auth_account_auth_household ON auth_account_auth_household.auth_account_id = calendar_event.auth_account_id OR (auth_account_auth_household.auth_household_id = calendar_event.auth_household_id AND (auth_account_auth_household.permissions -> 'calendar')::integer < 2)
LEFT JOIN auth_account ON auth_account.id = calendar_event.auth_account_id OR auth_account.id = auth_account_auth_household.auth_account_id
LEFT JOIN auth_account AS participants ON participants.id::text = any (calendar_event.participants)
WHERE auth_account.icalendar_id = $1
GROUP BY
    calendar_event.id
  , auth_account.id
ORDER BY calendar_event.created
`, nil, id)
	if err != nil {
		return nil, logger.Log(ctx, err)
	}

	for i := range c {
		e = append(e, c[i].ToICalendarEvents()...)
	}

	return e, logger.Log(ctx, err)
}

// CalendarEventsReadNotifications reads all CalendarEvents ready for notification.
func CalendarEventsReadNotifications(ctx context.Context) (Notifications, errs.Err) {
	ctx = logger.Trace(ctx)

	e := CalendarEvents{}
	n := Notifications{}

	err := db.Query(ctx, true, &e, `
UPDATE calendar_event
SET notified = TRUE
WHERE DATE_TRUNC('minute', time_notification) <= DATE_TRUNC('minute', now())
AND (
	date_end IS NULL
	OR date_end >= current_date
	)
AND notified IS FALSE
RETURNING
	  auth_account_id
	, auth_household_id
	, duration
	, id
	, location
	, name
	, notify_offset
	, participants
	, time_notification
	, time_start
	, time_zone
	, travel_time
`, nil)

	if err != nil {
		return n, logger.Log(ctx, err)
	}

	t := template.Must(template.New("body").Parse(templates.EventReminderBody))

	for i := range e {
		url := "/calendar"

		nt := AuthAccountNotifyTypeEventPersonal

		if e[i].AuthAccountID == nil {
			nt = AuthAccountNotifyTypeEventHousehold
		}

		ns := AuthAccountsReadNotifications(ctx, e[i].AuthAccountID, e[i].AuthHouseholdID, nt)

		for j := range ns {
			var body bytes.Buffer

			if err := t.Execute(&body, map[string]any{
				"BodyHeader":  yaml8n.EmailPushEventReminderBodyHeader.Translate(ns[j].ISO639Code),
				"BodyLeaveBy": yaml8n.EmailPushEventReminderBodyLeave.Translate(ns[j].ISO639Code),
				"BodyStarts":  yaml8n.EmailPushEventReminderBodyStarts.Translate(ns[j].ISO639Code),
				"LeaveBy":     e[i].getStartTime(false),
				"Name":        e[i].Name,
				"Starts":      e[i].getStartTime(true),
				"TravelTime":  e[i].TravelTime,
			}); err != nil {
				return n, logger.Log(ctx, errs.NewServerErr(err))
			}

			ns[j].Actions.Default = url
			ns[j].Actions.Target = e[i].ID.String()
			ns[j].Actions.TargetType = tableNames[modelCalendarEvent]
			ns[j].Actions.Types = []notify.WebPushActionType{
				NotificationActionsTypesSnooze,
			}
			ns[j].BodyWebPush = body.String() + fmt.Sprintf("\n\n%s", yaml8n.PushEventReminderBody.Translate(ns[j].ISO639Code))
			ns[j].BodySMTP = body.String() + fmt.Sprintf("\n\n[%s](%s%s)", yaml8n.EmailEventReminderBody.Translate(ns[j].ISO639Code), c.App.BaseURL, url)
			ns[j].SubjectWebPush = yaml8n.EmailPushEventReminderSubject.Translate(ns[j].ISO639Code)
			ns[j].SubjectSMTP = templates.EmailEventReminderSubject(ns[j].ISO639Code, string(e[i].Name))

			n = append(n, ns[j])
		}
	}

	return n, logger.Log(ctx, err)
}