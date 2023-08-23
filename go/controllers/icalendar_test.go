package controllers

import (
	"fmt"
	"io"
	"net/http"
	"strings"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestICalendar(t *testing.T) {
	logger.UseTestLogger(t)

	a := seed.AuthAccounts[0]
	a.EmailAddress = "icalendar@example.com"
	a.Create(ctx, false)

	aaah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	models.Create(ctx, &aaah, models.CreateOpts{})

	s := models.AuthSession{
		AuthAccountID: a.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	s.Create(ctx, false)

	var o1 models.AuthAccounts

	var o2 models.AuthAccounts

	r := request{
		method:       "PUT",
		responseType: &o1,
		session:      s,
		uri:          "/icalendar",
	}

	noError(t, r.do())

	r.responseType = &o2

	noError(t, r.do())
	assert.Equal(t, o2[0].ICalendarID != o1[0].ICalendarID, true)

	res, _ := http.Get(fmt.Sprintf("%s/api/v1/icalendar/%s.ics", ts.URL, o2[0].ICalendarID.UUID))

	body, _ := io.ReadAll(res.Body)

	assert.Contains(t, string(body), "John's Birthday")

	res, _ = http.Get(fmt.Sprintf("%s/api/v1/icalendar/%s.ics?calendarevent=no", ts.URL, o2[0].ICalendarID.UUID))

	body, _ = io.ReadAll(res.Body)

	assert.Equal(t, strings.Contains(string(body), "John's Birthday"), false)

	r.method = "DELETE"
	r.responseType = &o1

	noError(t, r.do())

	if o1[0].ICalendarID != nil {
		t.Error("ICalendarID is not nil")
	}

	a.Delete(ctx)
}
