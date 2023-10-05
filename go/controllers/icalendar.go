package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

// ICalendarRead returns an ics file for an ICalendarID.
func (*Handler) ICalendarRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	id := types.UUIDToNullUUID(getUUID(r, "icalendar_id"))

	e := types.ICalendarEvents{}

	if r.URL.Query().Get("calendarevent") != "no" {
		c, err := models.CalendarEventsReadICalendar(ctx, id)
		if err != nil {
			logger.Error(ctx, err) //nolint:errcheck
			w.WriteHeader(err.Status())

			return
		}

		e = append(e, c...)
	}

	if r.URL.Query().Get("plantask") != "no" {
		p, err := models.PlanTasksReadICalendar(ctx, id)
		if err != nil {
			logger.Error(ctx, err) //nolint:errcheck
			w.WriteHeader(errs.ErrSenderNotFound.Status())

			return
		}

		e = append(e, p...)
	}

	b, err := e.String()
	if err != nil {
		w.WriteHeader(logger.Error(ctx, errs.ErrReceiver.Wrap(err)).Status())
	}

	w.Header().Set("Content-Type", "text/calendar")

	_, err = w.Write([]byte(b))
	if err != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(err)) //nolint:errcheck
	}
}

// ICalendarUpdate updates an ICalendarID from an AuthAccountID.
func (*Handler) ICalendarUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	a := models.AuthAccount{
		ID: models.GetAuthAccountID(ctx),
	}

	WriteResponse(ctx, w, a, nil, 1, "", logger.Error(ctx, a.UpdateICalendarID(ctx, r.Method == http.MethodDelete)))
}
