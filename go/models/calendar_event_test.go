package models

import (
	"fmt"
	"testing"
	"time"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
)

func TestCalendarEventsDelete(t *testing.T) {
	logger.UseTestLogger(t)

	for i := 1; i <= 10; i++ {
		ce := seed.CalendarEvents[0]
		ce.DateStart = types.CivilDateOf(GenerateTimestamp()).AddDays(-1 * (c.App.KeepCalendarEventDays + 1))
		ce.Name = types.StringLimit(fmt.Sprintf("%s-%d", ce.Name, i))
		ce.Recurrence = nil
		ce.create(ctx, CreateOpts{})
	}

	ce := seed.CalendarEvents[0]
	ce.DateStart = types.CivilDateOf(GenerateTimestamp()).AddDays(-1 * (c.App.KeepCalendarEventDays + 1))
	ce.Name = "Should work"
	ce.create(ctx, CreateOpts{})

	events := CalendarEvents{}

	ReadAll(ctx, &events, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	})

	CalendarEventsDelete(ctx)

	want := len(events) - 10
	events = CalendarEvents{}
	ReadAll(ctx, &events, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	})

	assert.Equal(t, len(events), want)
	assert.Equal(t, Delete(ctx, &ce, DeleteOpts{}), nil)
}

func TestCalendarEventsReadAssistant(t *testing.T) {
	logger.UseTestLogger(t)

	ce := seed.CalendarEvents[0]
	ce.AuthAccountID = &seed.AuthAccounts[2].ID
	ce.create(ctx, CreateOpts{})

	got, _, list := CalendarEventsReadAssistant(ctx, PermissionsOpts{
		AuthAccountID:          &seed.AuthAccounts[2].ID,
		AuthAccountPermissions: &Permissions{},
		AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[1].ID,
			},
		},
	}, types.CivilDateToday(), "today", "America/Chicago", false, "")

	assert.Contains(t, got, "I found 1 event today, starting at 3:00 PM: Pickup kids.")
	assert.Equal(t, len(list), 1)

	Delete(ctx, &ce, DeleteOpts{})
}

func TestCalendarEventsReadICal(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testcalendareventsreadical@example.com"
	aa.Create(ctx, false)

	aaah1 := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: ah.ID,
	}
	aaah1.create(ctx, CreateOpts{})

	aaah2 := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		Permissions: Permissions{
			Calendar: PermissionNone,
		},
	}
	aaah2.create(ctx, CreateOpts{})

	aa.UpdateICalendarID(ctx, false)

	c1 := seed.CalendarEvents[0]
	c1.AuthAccountID = &aa.ID
	c1.Duration = 45
	c1.Participants = []string{
		aa.ID.String(),
	}
	c1.TravelTime = 30
	c1.create(ctx, CreateOpts{})

	details := "Participants: Jane\n\n"

	c2 := seed.CalendarEvents[4]
	c2.AuthHouseholdID = &ah.ID
	c2.Participants = types.SliceString{}
	c2.create(ctx, CreateOpts{})

	yesterday := types.CivilDateToday().AddDays(-1)

	c3 := seed.CalendarEvents[0]
	c3.AuthAccountID = &aa.ID
	c3.DateStart = types.CivilDateToday().AddDays(-30)
	c3.DateEnd = &yesterday
	c3.Recurrence = &types.Recurrence{
		Separation: 1,
	}
	c3.create(ctx, CreateOpts{})

	ds := types.CivilDateOf(c2.TimestampStart)
	de := ds.AddDays(1)

	c1start := c1.TimestampStart.Add(time.Duration(c1.TravelTime) * time.Minute)

	want := types.ICalendarEvents{
		{
			Created:        &c1.Created,
			Duration:       c1.TravelTime,
			Details:        types.StringLimit(details),
			ID:             types.StringLimit(c1.ID.String() + "_travel"),
			Location:       c1.Location,
			Name:           "Event: Travel to " + c1.Location,
			NotifyOffset:   c1.NotifyOffset,
			Recurrence:     c1.Recurrence,
			SkipDays:       c1.SkipDays,
			TimestampStart: &c1.TimestampStart,
			Updated:        &c1.Updated,
		},
		{
			Created:        &c1.Created,
			Duration:       c1.Duration,
			Details:        types.StringLimit(details),
			ID:             types.StringLimit(c1.ID.String()),
			Location:       c1.Location,
			Name:           types.StringLimit("Event: " + string(c1.Name)),
			NotifyOffset:   c1.NotifyOffset,
			Recurrence:     c1.Recurrence,
			SkipDays:       c1.SkipDays,
			TimestampStart: &c1start,
			Updated:        &c1.Updated,
		},
		{
			Created:        &c2.Created,
			DateEnd:        &de,
			DateStart:      &ds,
			Duration:       c2.Duration,
			ID:             types.StringLimit(c2.ID.String()),
			Location:       c2.Location,
			Name:           types.StringLimit("Event: " + string(c2.Name)),
			NotifyOffset:   c2.NotifyOffset,
			Recurrence:     c2.Recurrence,
			SkipDays:       c2.SkipDays,
			TimestampStart: &c2.TimestampStart,
			Updated:        &c2.Updated,
		},
		{
			Created:        &c3.Created,
			Duration:       c3.Duration,
			ID:             types.StringLimit(c3.ID.String()),
			Location:       c3.Location,
			Name:           types.StringLimit("Event: " + string(c3.Name)),
			NotifyOffset:   c3.NotifyOffset,
			Recurrence:     c3.Recurrence,
			RecurrenceEnd:  c3.DateEnd,
			SkipDays:       c3.SkipDays,
			TimestampStart: &c3.TimestampStart,
			Updated:        &c3.Updated,
		},
	}

	got, err := CalendarEventsReadICalendar(ctx, aa.ICalendarID)
	assert.Equal(t, err, nil)
	assert.Equal(t, got, want)

	ah.Delete(ctx)
	aa.Delete(ctx)

	aaPersonal := seed.AuthAccounts[0]
	aaPersonal.EmailAddress = "testicalpersonal@example.com"
	aaPersonal.Create(ctx, false)
	aaPersonal.UpdateICalendarID(ctx, false)

	ce := seed.CalendarEvents[0]
	ce.AuthAccountID = &aaPersonal.ID
	ce.AuthHouseholdID = nil
	ce.create(ctx, CreateOpts{})

	_, err = CalendarEventsReadICalendar(ctx, aaPersonal.ICalendarID)
	assert.Equal(t, err, nil)

	aaPersonal.Delete(ctx)
}

func TestCalendarEventsReadNotifications(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testcalendareventsreadnotification@example.com"
	aa.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: ah.ID,
	}
	aaah.create(ctx, CreateOpts{})

	as := seed.AuthSessions[0]
	as.AuthAccountID = aa.ID
	as.WebPush = &notify.WebPushClient{
		Endpoint: "1",
	}
	as.Create(ctx, false)

	notifyInt := 10
	tomorrow := GenerateTimestamp().Add(24 * time.Hour).In(tz)
	d := types.CivilDateOf(tomorrow)
	twoDays := tomorrow.Add(24 * time.Hour)

	e1 := seed.CalendarEvents[0]
	e1.AuthAccountID = nil
	e1.AuthHouseholdID = &ah.ID
	e1.Location = "Test"
	e1.Name = "e1"
	e1.NotifyOffset = &notifyInt
	e1.SkipDays = types.SliceString{
		d.String(),
	}
	e1.TravelTime = 10
	e1.TimeStart = types.CivilTime{
		Hour:   1,
		Minute: 0,
	}
	e1.create(ctx, CreateOpts{})

	e2 := e1
	e2.AuthAccountID = &aa.ID
	e2.AuthHouseholdID = nil
	e2.Name = "e2"
	e2.create(ctx, CreateOpts{})

	e3 := e1
	e3.DateStart = e1.DateStart.AddDays(100)
	e3.Name = "e3"
	e3.create(ctx, CreateOpts{})

	e4 := e1
	e4.Name = "e4"
	e4.NotifyOffset = nil
	e4.create(ctx, CreateOpts{})

	e5 := e1
	e5.Participants = types.SliceString{
		seed.AuthAccounts[0].ID.String(),
		seed.AuthAccounts[1].ID.String(),
		"askdasdjfkajsdfkasdjfka",
	}
	e5.create(ctx, CreateOpts{})

	yesterday := types.CivilDateToday()
	yesterday = yesterday.AddDays(-1)

	e6 := e1
	e6.DateEnd = &yesterday
	e6.create(ctx, CreateOpts{})

	e7off := 720

	e7 := seed.CalendarEvents[0]
	e7.AuthAccountID = nil
	e7.AuthHouseholdID = &ah.ID
	e7.DateStart = types.CivilDateToday().AddDays(-1)
	e7.Name = "e7"
	e7.NotifyOffset = &e7off
	e7.Recurrence = &types.Recurrence{
		Day:        14,
		Separation: 1,
	}
	e7.SkipDays = types.SliceString{}
	e7.TimeZone = "US/Pacific"
	e7.TimeStart = types.CivilTime{
		Hour:   0,
		Minute: 0,
	}
	e7.create(ctx, CreateOpts{})

	no, err := CalendarEventsReadNotifications(ctx)
	assert.Equal(t, err, nil)
	assert.Equal(t, len(no), 5)
	assert.Equal(t, no[1].BodySMTP, fmt.Sprintf(`This is your reminder for the upcoming event: e1

Event starts %[1]s, %[2]s %[3]d at 1:00 AM
Leave by %[1]s, %[2]s %[3]d at 12:50 AM

[Click here to view event](%[4]s/calendar)`, twoDays.Weekday(), twoDays.Month(), twoDays.Day(), c.App.BaseURL))
	assert.Equal(t, no[1].BodyWebPush, fmt.Sprintf(`This is your reminder for the upcoming event: e1

Event starts %[1]s, %[2]s %[3]d at 1:00 AM
Leave by %[1]s, %[2]s %[3]d at 12:50 AM

Press here to view event`, twoDays.Weekday(), twoDays.Month(), twoDays.Day()))
	assert.Equal(t, no[1].Actions, notify.WebPushActions{
		Default:    "/calendar",
		Target:     e1.ID.String(),
		TargetType: tableNames[modelCalendarEvent],
		Types: []notify.WebPushActionType{
			NotificationActionsTypesSnooze,
		},
	})

	d = d.AddDays(1)

	Read(ctx, &e1, ReadOpts{})

	assert.Equal(t, *e1.TimeNotification, time.Date(d.Year, d.Month, d.Day, 0, 40, 0, 0, tz).UTC())

	Read(ctx, &e7, ReadOpts{})

	no, err = CalendarEventsReadNotifications(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(no), 0)

	aa.Delete(ctx)
	ah.Delete(ctx)
}

func TestCalendarEventLeaveByStarts(t *testing.T) {
	logger.UseTestLogger(t)

	tz, _ := time.LoadLocation("US/Central")
	now := GenerateTimestamp()

	offset := 5

	badTZ := CalendarEvent{
		NotifyOffset: &offset,
		TimeStart: types.CivilTime{
			Hour:   15,
			Minute: 0,
		},
		TimeZone:   "US/Centralll",
		TravelTime: 10,
	}

	t1 := time.Date(now.Year(), now.Month(), now.Day(), 15, 0, 0, 0, tz)
	t1 = t1.Add(-15 * time.Minute)
	badTZ.TimeNotification = &t1

	allDay := CalendarEvent{
		TimeStart: types.CivilTime{
			Hour:   0,
			Minute: 0,
		},
		TimeZone:   "US/Central",
		TravelTime: 10,
	}

	tomorrow := types.CivilDateToday().AddDays(1)
	t2 := time.Date(tomorrow.Year, tomorrow.Month, tomorrow.Day, 0, 0, 0, 0, tz)
	t2 = t2.Add(-10 * time.Minute)
	allDay.TimeNotification = &t2

	threeDays := CalendarEvent{
		Duration: 30,
		TimeStart: types.CivilTime{
			Hour:   10,
			Minute: 0,
		},
		TimeZone:   "US/Central",
		TravelTime: 10,
	}

	three := now.Add(24 * 3 * time.Hour)
	t3s := time.Date(three.Year(), three.Month(), three.Day(), 10, 0, 0, 0, tz)
	t3 := t3s.Add(-1 * 10 * time.Minute)
	threeDays.TimeNotification = &t3

	today := CalendarEvent{
		Duration: 60,
		TimeStart: types.CivilTime{
			Hour:   23,
			Minute: 0,
		},
		TimeZone:   "US/Central",
		TravelTime: 10,
	}

	t4s := time.Date(three.Year(), three.Month(), three.Day(), 23, 0, 0, 0, tz)
	t4 := t4s.Add(time.Duration(-1*10) * time.Minute)
	today.TimeNotification = &t4

	tests := map[string]struct {
		input       CalendarEvent
		wantLeaveBy string
		wantStart   string
	}{
		"invalid timezone": {
			input:       badTZ,
			wantLeaveBy: "2:50 PM",
			wantStart:   "at 3:00 PM",
		},
		"all day": {
			input:       allDay,
			wantLeaveBy: "11:50 PM",
			wantStart:   "tomorrow",
		},
		"three days": {
			input:       threeDays,
			wantLeaveBy: fmt.Sprintf("%s, %s %d at %s", t3s.Weekday(), t3s.Month(), t3s.Day(), types.CivilTimeOf(t3s).AddMinutes(-10).String12()),
			wantStart:   fmt.Sprintf("%s, %s %d at %s", t3s.Weekday(), t3s.Month(), t3s.Day(), types.CivilTimeOf(t3s).String12()),
		},
		"today": {
			input:       today,
			wantLeaveBy: fmt.Sprintf("%s, %s %d at %s", t4s.Weekday(), t4s.Month(), t4s.Day(), types.CivilTimeOf(t4s).AddMinutes(-10).String12()),
			wantStart:   fmt.Sprintf("%s, %s %d at %s", t4s.Weekday(), t4s.Month(), t4s.Day(), types.CivilTimeOf(t4s).String12()),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, tc.input.getStartTime(true), tc.wantStart)
			assert.Equal(t, tc.input.getStartTime(false), tc.wantLeaveBy)
		})
	}
}

func TestCalendarEventCreate(t *testing.T) {
	logger.UseTestLogger(t)

	n := 20
	now := GenerateTimestamp()

	e1 := CalendarEvent{
		AuthAccountID:   &seed.AuthAccounts[0].ID,
		AuthHouseholdID: &seed.AuthHouseholds[0].ID,
		DateStart:       types.CivilDateOf(GenerateTimestamp()).AddDays(-5),
		NotifyOffset:    &n,
		SkipDays: types.SliceString{
			types.CivilDateOf(GenerateTimestamp()).String(),
		},
		TimeStart: types.CivilTime{
			Hour:   23,
			Minute: 30,
		},
		TravelTime: 30,
		Color:      types.ColorBlue,
		Duration:   60,
		Details:    "An important event",
		Location:   "Someplace",
		Name:       "An Event",
		Participants: types.SliceString{
			seed.AuthAccounts[0].ID.String(),
		},
		TimeZone: "US/Central",
	}

	e2 := e1
	e2.AuthAccountID = nil

	e3 := e1
	e3.AuthHouseholdID = nil

	tests := map[string]struct {
		err   error
		input *CalendarEvent
	}{
		"create - fail": {
			err:   errs.ErrSenderBadRequest,
			input: &e1,
		},
		"create - household": {
			input: &e2,
		},
		"create - account": {
			input: &e3,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, tc.input.create(ctx, CreateOpts{}), tc.err)

			if tc.err == nil {
				d := time.Date(now.Year(), now.Month(), now.Day()-5, 22, 40, 0, 0, tz).UTC()

				assert.Equal(t, tc.input.TimeNotification, &d)
				assert.Equal(t, tc.input.TimestampStart, d.Add(time.Duration(n)*time.Minute))
				assert.Equal(t, tc.input.TimestampEnd, d.Add(time.Duration(types.PositiveInt(n)+tc.input.Duration+tc.input.TravelTime)*time.Minute))
			}
		})
	}

	Delete(ctx, &e2, DeleteOpts{})
	Delete(ctx, &e3, DeleteOpts{})
}

func TestCalendarEventUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	e1 := seed.CalendarEvents[0]
	e1.create(ctx, CreateOpts{})

	n := 20
	de := types.CivilDateOf(GenerateTimestamp().In(tz)).AddDays(5)

	e1.AuthAccountID = nil
	e1.AuthHouseholdID = &seed.AuthHouseholds[0].ID
	e1.Color = types.ColorYellow
	e1.DateEnd = &de
	e1.DateStart = types.CivilDateOf(GenerateTimestamp().In(tz))
	e1.Details = "New description"
	e1.Duration = 30
	e1.Location = "Somewhere"
	e1.Name = "Another lunch"
	e1.NotifyOffset = &n
	e1.Participants = types.SliceString{
		seed.AuthAccounts[0].ID.String(),
	}
	e1.Recurrence = &types.Recurrence{
		Separation: 2,
	}
	e1.SkipDays = types.SliceString{
		types.CivilDateOf(GenerateTimestamp()).String(),
	}
	e1.TimeStart = types.CivilTime{
		Hour:   2,
		Minute: 20,
	}
	e1.TimeZone = types.TimeZone(tz.String())
	e1.TravelTime = 1

	e2 := e1

	assert.Equal(t, e2.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}), nil)

	e := CalendarEvent{
		AuthAccountID:   &seed.AuthAccounts[0].ID,
		AuthHouseholdID: &seed.AuthHouseholds[0].ID,
		ID:              e2.ID,
	}

	Read(ctx, &e, ReadOpts{})

	now := types.CivilDateOf(GenerateTimestamp().In(tz))

	d := types.CivilDateOf(GenerateTimestamp().In(tz)).AddDays(2)
	no := time.Date(d.Year, d.Month, d.Day, 1, 59, 0, 0, tz).UTC()
	ts := time.Date(now.Year, now.Month, now.Day, 2, 19, 0, 0, tz).UTC()
	te := time.Date(now.Year, now.Month, now.Day, 2, 50, 0, 0, tz).UTC()
	e1.TimeNotification = &no
	e1.TimestampEnd = te
	e1.TimestampStart = ts
	e.Updated = e1.Updated

	assert.Equal(t, e, e1)
}
