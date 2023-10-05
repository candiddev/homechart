package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// CookMealTimeCreate creates a new CookMealTime using POST data.
// @Accept json
// @ID CookMealTimeCreate
// @Param body body models.CookMealTime true "CookMealTime"
// @Produce json
// @Router /cook/meal-times [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookMealTimes}
// @Summary Create CookMealTime
// @Tags CookMealTime
func (*Handler) CookMealTimeCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.CookMealTime{}, w, r)) //nolint:errcheck
}

// CookMealTimeDelete deletes a CookMealTime.
// @Accept json
// @ID CookMealTimeDelete
// @Param id path string true "ID"
// @Produce json
// @Router /cook/meal-times/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete CookMealTime
// @Tags CookMealTime
func (*Handler) CookMealTimeDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.CookMealTime{}, w, r)) //nolint:errcheck
}

// CookMealTimeRead reads a CookMealTime.
// @Accept json
// @ID CookMealTimeRead
// @Param id path string true "ID"
// @Produce json
// @Router /cook/meal-times/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookMealTimes}
// @Summary Read CookMealTime
// @Tags CookMealTime
func (*Handler) CookMealTimeRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.CookMealTime{}, w, r)) //nolint:errcheck
}

// CookMealTimeUpdate updates a CookMealTime.
// @Accept json
// @ID CookMealTimeUpdate
// @Param body body models.CookMealTime true "CookMealTime"
// @Param id path string true "ID"
// @Produce json
// @Router /cook/meal-times/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookMealTimes}
// @Summary Update CookMealTime
// @Tags CookMealTime
func (*Handler) CookMealTimeUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.CookMealTime{}, w, r)) //nolint:errcheck
}

// CookMealTimesRead reads all CookMealTime for an AuthHousehold.
// @Accept json
// @ID CookMealTimesRead
// @Produce json
// @Router /cook/meal-times [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookMealTimes}
// @Summary Read all CookMealTimes
// @Tags CookMealTime
func (*Handler) CookMealTimesRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.CookMealTimes{}, w)) //nolint:errcheck
}
