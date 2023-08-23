package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestCalendarICalendarCreate(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "icalendar@example.com"
	aa.Create(ctx, false)

	c := CalendarICalendar{
		AuthAccountID: &aa.ID,
		Name:          "test1",
		URL:           "test1",
	}

	assert.Equal[error](t, c.create(ctx, CreateOpts{}), ErrClientBadRequestCalendarICalendarURL)

	e := seed.CalendarEvents[2].ToICalendarEvents()

	c.ID = nil
	c.ICS, _ = e.String()
	c.Name = ""

	assert.Equal(t, c.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, c.ID == nil, true)

	events := CalendarEvents{}
	ReadAll(ctx, &events, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &aa.ID,
		},
	})

	assert.Equal(t, len(events), 2)

	c.ICS = `BEGIN:VCALENDAR
END:VCALENDAR`
	c.Name = "test"

	assert.Equal(t, c.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, c.ID != nil, true)

	aa.HideCalendarICalendars = types.SliceString{
		c.ID.String(),
	}
	aa.Update(ctx)

	assert.Equal(t, aa.HideCalendarICalendars[0], c.ID.String())

	Delete(ctx, &c, DeleteOpts{})

	aa.Read(ctx)

	assert.Equal(t, len(aa.HideCalendarICalendars), 0)

	aa.Delete(ctx)
}

func TestCalendarICalendarUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "icalendar@example.com"
	aa.Create(ctx, false)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: ah.ID,
	}
	aaah.create(ctx, CreateOpts{})

	c := CalendarICalendar{
		AuthAccountID: &aa.ID,
		Name:          "test1",
	}

	e := seed.CalendarEvents[0].ToICalendarEvents()
	c.ICS, _ = e.String()

	c.create(ctx, CreateOpts{})

	aa.HideCalendarICalendars = types.SliceString{
		c.ID.String(),
	}

	c.AuthAccountID = nil
	c.AuthHouseholdID = &ah.ID
	c.Name = "test2"

	p := PermissionsOpts{
		AuthAccountID: &aa.ID,
		AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
			{
				AuthHouseholdID: ah.ID,
			},
		},
	}

	e = seed.CalendarEvents[2].ToICalendarEvents()
	c.ICS, _ = e.String()

	assert.Equal(t, c.update(ctx, UpdateOpts{
		PermissionsOpts: p,
	}), nil)

	events := CalendarEvents{}
	ReadAll(ctx, &events, ReadAllOpts{
		PermissionsOpts: p,
	})

	assert.Equal(t, len(events), 2)

	var icalendars CalendarICalendars

	ReadAll(ctx, &icalendars, ReadAllOpts{
		PermissionsOpts: p,
	})

	var got CalendarICalendar

	for _, icalendar := range icalendars {
		if *icalendar.ID == *c.ID {
			got = icalendar
			c.ICS = ""
		}
	}

	assert.Equal(t, got, c)
	Delete(ctx, &c, DeleteOpts{})

	aa.Read(ctx)

	assert.Equal(t, len(aa.HideCalendarICalendars), 0)

	aa.Delete(ctx)
	ah.Delete(ctx)
}
