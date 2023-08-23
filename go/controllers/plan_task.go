package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// PlanTaskCreate creates a new PlanTask using POST data.
// @Accept json
// @ID PlanTaskCreate
// @Param body body models.PlanTask true "PlanTask"
// @Produce json
// @Router /plan/tasks [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.PlanTasks}
// @Summary Create PlanTask
// @Tags PlanTask
func (*Handler) PlanTaskCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.PlanTask{}, w, r)) //nolint:errcheck
}

// PlanTaskDelete deletes a PlanTask.
// @Accept json
// @ID PlanTaskDelete
// @Param id path string true "ID"
// @Produce json
// @Router /plan/tasks/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete PlanTask
// @Tags PlanTask
func (*Handler) PlanTaskDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.PlanTask{}, w, r)) //nolint:errcheck
}

// PlanTaskRead reads a PlanTask.
// @Accept json
// @ID PlanTaskRead
// @Param id path string true "ID"
// @Produce json
// @Router /plan/tasks/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.PlanTasks}
// @Summary Read PlanTask
// @Tags PlanTask
func (*Handler) PlanTaskRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.PlanTask{}, w, r)) //nolint:errcheck
}

// PlanTaskUpdate updates a PlanTask.
// @Accept json
// @ID PlanTaskUpdate
// @Param body body models.PlanTask true "PlanTask"
// @Param id path string true "ID"
// @Produce json
// @Router /plan/tasks/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.PlanTasks}
// @Summary Update PlanTask
// @Tags PlanTask
func (*Handler) PlanTaskUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionUpdate.do(ctx, &models.PlanTask{}, w, r)) //nolint:errcheck
}

// PlanTasksRead reads all PlanTasks for an AuthHousehold.
// @Accept json
// @ID PlanTasksRead
// @Produce json
// @Router /plan/tasks [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.PlanTasks}
// @Summary Read all PlanTasks
// @Tags PlanTask
func (*Handler) PlanTasksRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.PlanTasks{}, w)) //nolint:errcheck
}
