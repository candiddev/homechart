package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// NotesPageCreate creates a new NotesPage using POST data.
// @Accept json
// @ID NotesPageCreate
// @Param body body models.NotesPage true "NotesPage"
// @Produce json
// @Router /notes/pages [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.NotesPages}
// @Summary Create NotesPage
// @Tags NotesPage
func (*Handler) NotesPageCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.NotesPage{}, w, r)) //nolint:errcheck
}

// NotesPageDelete deletes a NotesPage.
// @Accept json
// @ID NotesPageDelete
// @Param id path string true "ID"
// @Produce json
// @Router /notes/pages/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete NotesPage
// @Tags NotesPage
func (*Handler) NotesPageDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.NotesPage{}, w, r)) //nolint:errcheck
}

// NotesPageRead reads a NotesPage.
// @Accept json
// @ID NotesPageRead
// @Param id path string true "ID"
// @Produce json
// @Router /notes/pages/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.NotesPages}
// @Summary Read NotesPage
// @Tags NotesPage
func (*Handler) NotesPageRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.NotesPage{}, w, r)) //nolint:errcheck
}

// NotesPageUpdate updates a NotesPage.
// @Accept json
// @ID NotesPageUpdate
// @Param body body models.NotesPage true "NotesPage"
// @Param id path string true "ID"
// @Produce json
// @Router /notes/pages/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.NotesPages}
// @Summary Update NotesPage
// @Tags NotesPage
func (*Handler) NotesPageUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionUpdate.do(ctx, &models.NotesPage{}, w, r)) //nolint:errcheck
}

// NotesPagesRead reads all NotesPages for an AuthAccount and AuthHousehold.
// @Accept json
// @ID NotesPagesRead
// @Produce json
// @Router /notes/pages [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.NotesPages}
// @Summary Read all NotesPages
// @Tags NotesPage
func (*Handler) NotesPagesRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.NotesPages{}, w)) //nolint:errcheck
}
