package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// CookMealPlanCreate creates a new CookMealPlan using POST data.
// @Accept json
// @ID CookMealPlanCreate
// @Param body body models.CookMealPlan true "CookMealPlan"
// @Produce json
// @Router /cook/meal-plans [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookMealPlans}
// @Summary Create CookMealPlan
// @Tags CookMealPlan
func (*Handler) CookMealPlanCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.CookMealPlan{}, w, r)) //nolint:errcheck
}

// CookMealPlanDelete deletes a CookMealPlan.
// @Accept json
// @ID CookMealPlanDelete
// @Param id path string true "ID"
// @Produce json
// @Router /cook/meal-plans/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete CookMealPlan
// @Tags CookMealPlan
func (*Handler) CookMealPlanDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.CookMealPlan{}, w, r)) //nolint:errcheck
}

// CookMealPlanRead reads a CookMealPlan.
// @Accept json
// @ID CookMealPlanRead
// @Param id path string true "ID"
// @Produce json
// @Router /cook/meal-plans/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookMealPlans}
// @Summary Read CookMealPlan
// @Tags CookMealPlan
func (*Handler) CookMealPlanRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.CookMealPlan{}, w, r)) //nolint:errcheck
}

// CookMealPlanUpdate updates a CookMealPlan.
// @Accept json
// @ID CookMealPlanUpdate
// @Param body body models.CookMealPlan true "CookMealPlan"
// @Param id path string true "ID"
// @Produce json
// @Router /cook/meal-plans/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookMealPlans}
// @Summary Update CookMealPlan
// @Tags CookMealPlan
func (*Handler) CookMealPlanUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionUpdate.do(ctx, &models.CookMealPlan{}, w, r)) //nolint:errcheck
}

// CookMealPlansRead reads all CookMealPlan for an AuthHousehold.
// @Accept json
// @ID CookMealPlansRead
// @Produce json
// @Router /cook/meal-plans [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookMealPlans}
// @Summary Read all CookMealPlans between from and to
// @Tags CookMealPlan
func (*Handler) CookMealPlansRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.CookMealPlans{}, w)) //nolint:errcheck
}
