package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// HealthLogCreate creates a new HealthLog using POST data.
// @Accept json
// @ID HealthLogCreate
// @Param body body models.HealthLog true "HealthLog"
// @Produce json
// @Router /health/logs [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.HealthLogs}
// @Summary Create HealthLog
// @Tags HealthLog
func (*Handler) HealthLogCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.HealthLog{}, w, r)) //nolint:errcheck
}

// HealthLogDelete deletes a HealthLog.
// @Accept json
// @ID HealthLogDelete
// @Param id path string true "ID"
// @Produce json
// @Router /health/logs/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete HealthLog
// @Tags HealthLog
func (*Handler) HealthLogDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.HealthLog{}, w, r)) //nolint:errcheck
}

// HealthLogRead reads a HealthLog.
// @Accept json
// @ID HealthLogRead
// @Param id path string true "ID"
// @Produce json
// @Router /health/logs/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.HealthLogs}
// @Summary Read HealthLog
// @Tags HealthLog
func (*Handler) HealthLogRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.HealthLog{}, w, r)) //nolint:errcheck
}

// HealthLogUpdate updates a HealthLog.
// @Accept json
// @ID HealthLogUpdate
// @Param body body models.HealthLog true "HealthLog"
// @Param id path string true "ID"
// @Produce json
// @Router /health/logs/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.HealthLogs}
// @Summary Update HealthLog
// @Tags HealthLog
func (*Handler) HealthLogUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionUpdate.do(ctx, &models.HealthLog{}, w, r)) //nolint:errcheck
}

// HealthLogsRead reads all HealthLogs for an AuthAccount.
// @Accept json
// @ID HealthLogsRead
// @Produce json
// @Router /health/logs [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.HealthLogs}
// @Summary Read all HealthLogs
// @Tags HealthLog
func (*Handler) HealthLogsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.HealthLogs{}, w)) //nolint:errcheck
}
