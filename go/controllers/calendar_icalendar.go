package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// CalendarICalendarCreate creates a new CalendarICalendar using POST data.
// @Accept json
// @ID CalendarICalendarCreate
// @Param body body models.CalendarICalendar true "CalendarICalendar"
// @Produce json
// @Router /calendar/icalendars [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CalendarICalendars}
// @Summary Create CalendarICalendar
// @Tags CalendarICalendar
func (*Handler) CalendarICalendarCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.CalendarICalendar{}, w, r)) //nolint:errcheck
}

// CalendarICalendarDelete deletes a CalendarICalendar.
// @Accept json
// @ID CalendarICalendarDelete
// @Param id path string true "ID"
// @Produce json
// @Router /calendar/icalendars/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete CalendarICalendar
// @Tags CalendarICalendar
func (*Handler) CalendarICalendarDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.CalendarICalendar{}, w, r)) //nolint:errcheck
}

// CalendarICalendarRead reads a CalendarICalendar.
// @Accept json
// @ID CalendarICalendarRead
// @Param id path string true "ID"
// @Produce json
// @Router /calendar/icalendars/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CalendarICalendars}
// @Summary Read CalendarICalendar
// @Tags CalendarICalendar
func (*Handler) CalendarICalendarRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.CalendarICalendar{}, w, r)) //nolint:errcheck
}

// CalendarICalendarUpdate updates a CalendarICalendar.
// @Accept json
// @ID CalendarICalendarUpdate
// @Param body body models.CalendarICalendar true "CalendarICalendar"
// @Param id path string true "ID"
// @Produce json
// @Router /calendar/icalendars/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CalendarICalendars}
// @Summary Update CalendarICalendar
// @Tags CalendarICalendar
func (*Handler) CalendarICalendarUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.CalendarICalendar{}, w, r)) //nolint:errcheck
}

// CalendarICalendarsRead reads all CalendarICalendars for an AuthHousehold.
// @Accept json
// @ID CalendarICalendarsRead
// @Produce json
// @Router /calendar/icalendars [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CalendarICalendars}
// @Summary Read all CalendarICalendars
// @Tags CalendarICalendar
func (*Handler) CalendarICalendarsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.CalendarICalendars{}, w)) //nolint:errcheck
}
