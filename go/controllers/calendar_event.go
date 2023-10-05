package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// CalendarEventCreate creates a new CalendarEvent using POST data.
// @Accept json
// @ID CalendarEventCreate
// @Param body body models.CalendarEvent true "CalendarEvent"
// @Produce json
// @Router /calendar/events [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CalendarEvents}
// @Summary Create CalendarEvent
// @Tags CalendarEvent
func (*Handler) CalendarEventCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.CalendarEvent{}, w, r)) //nolint:errcheck
}

// CalendarEventDelete deletes a CalendarEvent.
// @Accept json
// @ID CalendarEventDelete
// @Param id path string true "ID"
// @Produce json
// @Router /calendar/events/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete CalendarEvent
// @Tags CalendarEvent
func (*Handler) CalendarEventDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.CalendarEvent{}, w, r)) //nolint:errcheck
}

// CalendarEventRead reads a CalendarEvent.
// @Accept json
// @ID CalendarEventRead
// @Param id path string true "ID"
// @Produce json
// @Router /calendar/events/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CalendarEvents}
// @Summary Read CalendarEvent
// @Tags CalendarEvent
func (*Handler) CalendarEventRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.CalendarEvent{}, w, r)) //nolint:errcheck
}

// CalendarEventUpdate updates a CalendarEvent.
// @Accept json
// @ID CalendarEventUpdate
// @Param body body models.CalendarEvent true "CalendarEvent"
// @Param id path string true "ID"
// @Produce json
// @Router /calendar/events/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CalendarEvents}
// @Summary Update CalendarEvent
// @Tags CalendarEvent
func (*Handler) CalendarEventUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.CalendarEvent{}, w, r)) //nolint:errcheck
}

// CalendarEventsRead reads all CalendarEvents for an AuthHousehold.
// @Accept json
// @ID CalendarEventsRead
// @Produce json
// @Router /calendar/events [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CalendarEvents}
// @Summary Read all CalendarEvents
// @Tags CalendarEvent
func (*Handler) CalendarEventsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.CalendarEvents{}, w)) //nolint:errcheck
}
