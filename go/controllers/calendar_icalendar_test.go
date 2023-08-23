package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestCalendarICalendarCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := models.CalendarICalendar{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		Name:          "test",
	}

	e := seed.CalendarEvents[2].ToICalendarEvents()
	good.ICS, _ = e.String()

	var c models.CalendarICalendars

	r := request{
		data:         good,
		method:       "POST",
		responseType: &c,
		session:      seed.AuthSessions[0],
		uri:          "/calendar/icalendars",
	}

	noError(t, r.do())
	assert.Equal(t, c[0].Name, good.Name)

	models.Delete(ctx, &c[0], models.DeleteOpts{})
}

func TestCalendarICalendarDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := models.CalendarICalendar{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		Name:          "test",
	}
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/calendar/icalendars/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestCalendarICalendarRead(t *testing.T) {
	logger.UseTestLogger(t)

	d := models.CalendarICalendar{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		Name:          "test",
	}
	models.Create(ctx, &d, models.CreateOpts{})

	var c models.CalendarEvents

	r := request{
		method:       "GET",
		responseType: &c,
		session:      seed.AuthSessions[0],
		uri:          "/calendar/icalendars/" + d.ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, c[0].Name, d.Name)

	models.Delete(ctx, &d, models.DeleteOpts{})
}

func TestCalendarICalendarUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	c := models.CalendarICalendar{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		Name:          "test",
	}
	models.Create(ctx, &c, models.CreateOpts{})

	newName := c
	newName.Name = "TestUpdate1"

	var cnew models.CalendarICalendars

	r := request{
		data:         newName,
		method:       "PUT",
		responseType: &cnew,
		session:      seed.AuthSessions[0],
		uri:          "/calendar/icalendars/" + c.ID.String(),
	}

	noError(t, r.do())

	cnew[0].Updated = newName.Updated

	assert.Equal(t, cnew[0], newName)

	models.Delete(ctx, &c, models.DeleteOpts{})
}

func TestCalendarICalendarsRead(t *testing.T) {
	logger.UseTestLogger(t)

	c := models.CalendarICalendar{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		Name:          "test",
	}
	models.Create(ctx, &c, models.CreateOpts{})

	var cUp models.CalendarICalendars

	r := request{
		method:       "GET",
		responseType: &c,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/calendar/icalendars",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(cUp), 0)
	assert.Equal(t, len(msg.DataIDs), 2)

	models.Delete(ctx, &c, models.DeleteOpts{})
}
