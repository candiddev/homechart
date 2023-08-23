package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestCalendarEventCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.CalendarEvents[0]
	badRecurrence := seed.CalendarEvents[0]
	badRecurrence.Name = "BadRecurrence"
	badRecurrence.Recurrence = &types.Recurrence{
		Month: 10,
		Weekdays: []types.Weekday{
			types.Monday,
		},
	}

	badTimezone := seed.CalendarEvents[0]
	badTimezone.TimeZone = "NotATimezone"

	tests := map[string]struct {
		err     string
		event   models.CalendarEvent
		session models.AuthSession
	}{
		"invalid recurrence": {
			err:     types.ErrRecurrence.Message(),
			event:   badRecurrence,
			session: seed.AuthSessions[0],
		},
		"invalid timezone": {
			err:     types.ErrTimeZone.Message(),
			event:   badTimezone,
			session: seed.AuthSessions[0],
		},
		"good": {
			event:   good,
			session: seed.AuthSessions[0],
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var c models.CalendarEvents

			r := request{
				data:         tc.event,
				method:       "POST",
				responseType: &c,
				session:      tc.session,
				uri:          "/calendar/events",
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				assert.Equal(t, c[0].Name, tc.event.Name)
				assert.Equal(t, c[0].AuthHouseholdID, nil)

				models.Delete(ctx, &c[0], models.DeleteOpts{})
			}
		})
	}
}

func TestCalendarEventDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.CalendarEvents[0]
	d.Name = "TestDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/calendar/events/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestCalendarEventRead(t *testing.T) {
	logger.UseTestLogger(t)

	var c models.CalendarEvents

	r := request{
		method:       "GET",
		responseType: &c,
		session:      seed.AuthSessions[0],
		uri:          "/calendar/events/" + seed.CalendarEvents[2].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, c[0].Name, seed.CalendarEvents[2].Name)
}

func TestCalendarEventUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	c := seed.CalendarEvents[0]
	c.Name = "TestUpdate"
	models.Create(ctx, &c, models.CreateOpts{})

	newName := c
	newName.Name = "TestUpdate1"

	var cnew models.CalendarEvents

	r := request{
		data:         newName,
		method:       "PUT",
		responseType: &cnew,
		session:      seed.AuthSessions[0],
		uri:          "/calendar/events/" + c.ID.String(),
	}

	noError(t, r.do())

	cnew[0].TimeNotification = newName.TimeNotification
	cnew[0].Updated = newName.Updated

	assert.Equal(t, cnew[0], newName)

	models.Delete(ctx, &c, models.DeleteOpts{})
}

func TestCalendarEventsRead(t *testing.T) {
	logger.UseTestLogger(t)

	c := seed.CalendarEvents[0]
	c.AuthAccountID = &seed.AuthAccounts[1].ID
	models.Create(ctx, &c, models.CreateOpts{})

	var cUp models.CalendarEvents

	r := request{
		method:       "GET",
		responseType: &cUp,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/calendar/events",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(cUp), 0)
	assert.Equal(t, len(msg.DataIDs), len(seed.CalendarEvents))

	models.Delete(ctx, &c, models.DeleteOpts{})
}
