package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// NotesPageVersionCreate creates a new NotesPageVersion using POST data.
// @Accept json
// @ID NotesPageVersionCreate
// @Param body body models.NotesPageVersion true "NotesPageVersion"
// @Produce json
// @Router /notes/page-versions [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.NotesPageVersions}
// @Summary Create NotesPageVersion
// @Tags NotesPageVersion
func (*Handler) NotesPageVersionCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.NotesPageVersion{}, w, r)) //nolint:errcheck
}

// NotesPageVersionDelete deletes a NotesPageVersion.
// @Accept json
// @ID NotesPageVersionDelete
// @Param id path string true "ID"
// @Produce json
// @Router /notes/page-versions/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete NotesPageVersion
// @Tags NotesPageVersion
func (*Handler) NotesPageVersionDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.NotesPageVersion{}, w, r)) //nolint:errcheck
}

// NotesPageVersionRead reads a NotesPageVersion.
// @Accept json
// @ID NotesPageVersionRead
// @Param id path string true "ID"
// @Produce json
// @Router /notes/page-versions/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.NotesPageVersions}
// @Summary Read NotesPageVersion
// @Tags NotesPageVersion
func (*Handler) NotesPageVersionRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.NotesPageVersion{}, w, r)) //nolint:errcheck
}

// NotesPageVersionsRead reads all NotesPageVersions for an AuthHousehold.
// @Accept json
// @ID NotesPageVersionsRead
// @Produce json
// @Router /notes/page-versions [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.NotesPageVersions}
// @Summary Read all NotesPageVersions
// @Tags NotesPageVersion
func (*Handler) NotesPageVersionsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.NotesPageVersions{}, w)) //nolint:errcheck
}
