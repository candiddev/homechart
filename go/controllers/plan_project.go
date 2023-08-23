package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// PlanProjectCreate creates a new PlanProject using POST data.
// @Accept json
// @ID PlanProjectCreate
// @Param body body models.PlanProject true "PlanProject"
// @Produce json
// @Router /plan/projects [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.PlanProjects}
// @Summary Create PlanProject
// @Tags PlanProject
func (*Handler) PlanProjectCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.PlanProject{}, w, r)) //nolint:errcheck
}

// PlanProjectDelete deletes a PlanProject.
// @Accept json
// @ID PlanProjectDelete
// @Param id path string true "ID"
// @Produce json
// @Router /plan/projects/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete PlanProject
// @Tags PlanProject
func (*Handler) PlanProjectDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.PlanProject{}, w, r)) //nolint:errcheck
}

// PlanProjectRead reads a PlanProject.
// @Accept json
// @ID PlanProjectRead
// @Param id path string true "ID"
// @Produce json
// @Router /plan/projects/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.PlanProjects}
// @Summary Read PlanProject
// @Tags PlanProject
func (*Handler) PlanProjectRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.PlanProject{}, w, r)) //nolint:errcheck
}

// PlanProjectUpdate updates a PlanProject.
// @Accept json
// @ID PlanProjectUpdate
// @Param body body models.PlanProject true "PlanProject"
// @Param id path string true "ID"
// @Produce json
// @Router /plan/projects/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.PlanProjects}
// @Summary Update PlanProject
// @Tags PlanProject
func (*Handler) PlanProjectUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionUpdate.do(ctx, &models.PlanProject{}, w, r)) //nolint:errcheck
}

// PlanProjectsRead reads all PlanProjects for an AuthHousehold.
// @Accept json
// @ID PlanProjectsRead
// @Produce json
// @Router /plan/projects [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.PlanProjects}
// @Summary Read all PlanProjects
// @Tags PlanProject
func (*Handler) PlanProjectsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.PlanProjects{}, w)) //nolint:errcheck
}
