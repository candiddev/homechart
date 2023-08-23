package models

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

var ErrClientBadRequestCalendarICalendarFormat = errs.NewClientBadRequestErr("Error parsing iCalendar data")
var ErrClientBadRequestCalendarICalendarURL = errs.NewClientBadRequestErr("Error retrieving iCalendar from URL")

// CalendarICalendar defines the calendar iCalendar fields.
type CalendarICalendar struct {
	AuthAccountID   *uuid.UUID `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	AuthHouseholdID *uuid.UUID `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	ID              *uuid.UUID `db:"id" format:"uuid" json:"id"`
	Created         time.Time  `db:"created" format:"date-time" json:"created"`
	Updated         time.Time  `db:"updated" format:"date-time" json:"updated"`
	CRC             string     `db:"crc" json:"-"`
	ICS             string     `db:"-" json:"ics"`
	IfModifiedSince string     `db:"if_modified_since" json:"-"`

	// If name is not specified, the ICS will be parsed, CalendarEvents created, but no CalendarICalendar will be created/associated with them.
	Name types.StringLimit `json:"name" db:"name"`
	URL  types.StringLimit `json:"url" db:"url"`
}

func (c *CalendarICalendar) SetID(id uuid.UUID) {
	c.ID = &id
}

func (c *CalendarICalendar) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if c.URL != "" && c.ICS == "" {
		if err := c.getICS(ctx); err != nil {
			return logger.Log(ctx, err)
		}
	}

	if c.Name != "" {
		id := GenerateUUID()
		c.ID = &id

		if err := db.Query(ctx, false, c, `
INSERT INTO calendar_icalendar (
	  auth_account_id
	, auth_household_id
	, crc
	, id
	, if_modified_since
	, name
	, url
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :crc
	, :id
	, :if_modified_since
	, :name
	, :url
)
RETURNING *
`, c); err != nil {
			return logger.Log(ctx, err)
		}
	}

	err := c.createCalendarEvents(ctx)
	if err != nil {
		if dErr := Delete(ctx, c, DeleteOpts{}); dErr != nil {
			return logger.Log(ctx, dErr)
		}
	}

	return logger.Log(ctx, err)
}

func (c *CalendarICalendar) createCalendarEvents(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	newEvents, err := c.getCalendarEvents(ctx)
	if err != nil {
		return logger.Log(ctx, err)
	}

	oldEvents := CalendarEvents{}

	if err := db.Query(ctx, true, &oldEvents, "SELECT * FROM calendar_event WHERE calendar_icalendar_id=:id", c); err != nil {
		return logger.Log(ctx, err)
	}

	for i := range newEvents {
		match := false

		for j := range oldEvents {
			if oldEvents[j].ICalendarUID == newEvents[i].ICalendarUID {
				match = true

				oldEvents = append(oldEvents[:j], oldEvents[j+1:]...)

				break
			}
		}

		if !match {
			if err := newEvents[i].create(ctx, CreateOpts{}); err != nil {
				return logger.Log(ctx, err)
			}
		}
	}

	for i := range oldEvents {
		if err := Delete(ctx, &oldEvents[i], DeleteOpts{}); err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}

func (c *CalendarICalendar) getCalendarEvents(ctx context.Context) (CalendarEvents, errs.Err) {
	ctx = logger.Trace(ctx)

	if c.ICS == "" {
		return CalendarEvents{}, nil
	}

	i, err := types.ICalendarEventsFromICS(c.ICS)
	if err != nil {
		return nil, logger.Log(ctx, ErrClientBadRequestCalendarICalendarFormat, err.Error())
	}

	events := CalendarEvents{}

	for _, e := range i {
		event := CalendarEvent{
			AuthAccountID:       c.AuthAccountID,
			AuthHouseholdID:     c.AuthHouseholdID,
			DateEnd:             e.RecurrenceEnd,
			Details:             e.Details,
			Duration:            e.Duration,
			ICalendarUID:        e.ID,
			Location:            e.Location,
			Name:                e.Name,
			NotifyOffset:        e.NotifyOffset,
			Recurrence:          e.Recurrence,
			CalendarICalendarID: c.ID,
			SkipDays:            e.SkipDays,
			TimeZone:            "UTC",
		}

		if e.TimeZone != "" {
			event.TimeZone = types.TimeZone(e.TimeZone)
		}

		if e.DateStart != nil {
			event.DateStart = *e.DateStart
		}

		if e.TimestampStart != nil {
			event.DateStart = types.CivilDateOf(*e.TimestampStart)
			event.TimeStart = types.CivilTimeOf(*e.TimestampStart)
			event.TimestampStart = *e.TimestampStart
		}

		events = append(events, event)
	}

	return events, nil
}

func (c *CalendarICalendar) getChange(_ context.Context) string {
	if c.AuthHouseholdID != nil {
		return string(c.Name)
	}

	return ""
}

func (c *CalendarICalendar) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return c.AuthAccountID, c.AuthHouseholdID, c.ID
}

func (c *CalendarICalendar) getICS(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	if c.URL == "" {
		return logger.Log(ctx, nil)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, string(c.URL), nil)
	if err != nil {
		return logger.Log(ctx, ErrClientBadRequestCalendarICalendarURL, string(c.URL), err.Error())
	}

	if c.IfModifiedSince != "" {
		req.Header.Add("if-modified-since", c.IfModifiedSince)
	}

	client := http.Client{}

	resp, err := client.Do(req)
	if err != nil {
		return logger.Log(ctx, ErrClientBadRequestCalendarICalendarURL, string(c.URL), err.Error())
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return logger.Log(ctx, ErrClientBadRequestCalendarICalendarURL, string(c.URL), err.Error())
	}

	ncrc := GetCRC(string(body))
	if resp.StatusCode == http.StatusNotModified || (c.CRC != "" && ncrc == c.CRC) {
		return errs.ErrClientNoContent
	}

	if string(body) == "" {
		return logger.Log(ctx, errs.NewServerErr(err), string(c.URL))
	}

	c.CRC = ncrc
	c.ICS = string(body)

	return logger.Log(ctx, nil)
}

func (*CalendarICalendar) getType() modelType {
	return modelCalendarICalendar
}

func (c *CalendarICalendar) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
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

func (c *CalendarICalendar) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if c.URL != "" {
		if err := c.getICS(ctx); err != nil {
			return logger.Log(ctx, err)
		}
	}

	if c.ICS != "" {
		if err := c.createCalendarEvents(ctx); err != nil {
			return logger.Log(ctx, err)
		}
	}

	query := fmt.Sprintf(`
UPDATE calendar_icalendar SET
	  auth_account_id = :auth_account_id
	, auth_household_id = :auth_household_id
	, if_modified_since = :if_modified_since
	, name = :name
	, url = :url
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

// CalendarICalendars is multiple CalendarICalendars.
type CalendarICalendars []CalendarICalendar

func (*CalendarICalendars) getType() modelType {
	return modelCalendarICalendar
}
