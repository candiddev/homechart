package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// BudgetCategoryCreate creates a new BudgetCategory using POST data.
// @Accept json
// @ID BudgetCategoryCreate
// @Param body body models.BudgetCategory true "BudgetCategory"
// @Produce json
// @Router /budget/categories [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetCategories}
// @Summary Create BudgetCategory
// @Tags BudgetCategory
func (*Handler) BudgetCategoryCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.BudgetCategory{}, w, r)) //nolint:errcheck
}

// BudgetCategoryDelete deletes a BudgetCategory.
// @Accept json
// @ID BudgetCategoryDelete
// @Param id path string true "ID"
// @Produce json
// @Router /budget/categories/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete BudgetCategory
// @Tags BudgetCategory
func (*Handler) BudgetCategoryDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.BudgetCategory{}, w, r)) //nolint:errcheck
}

// BudgetCategoryRead reads a BudgetCategory.
// @Accept json
// @ID BudgetCategoryRead
// @Param id path string true "ID"
// @Produce json
// @Router /budget/categories/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetCategories}
// @Summary Read BudgetCategory
// @Tags BudgetCategory
func (*Handler) BudgetCategoryRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.BudgetCategory{}, w, r)) //nolint:errcheck
}

// BudgetCategoryUpdate updates a BudgetCategory.
// @Accept json
// @ID BudgetCategoryUpdate
// @Param body body models.BudgetCategory true "BudgetCategory"
// @Param id path string true "ID"
// @Produce json
// @Router /budget/categories/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetCategories}
// @Summary Read BudgetCategory
// @Tags BudgetCategory
func (*Handler) BudgetCategoryUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionUpdate.do(ctx, &models.BudgetCategory{}, w, r)) //nolint:errcheck
}

// BudgetCategoriesRead reads all BudgetCategories for an AuthHousehold.
// @Accept json
// @ID BudgetCategoriesRead
// @Produce json
// @Router /budget/categories [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetCategories}
// @Summary Read all BudgetCategories
// @Tags BudgetCategory
func (*Handler) BudgetCategoriesRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.BudgetCategories{}, w)) //nolint:errcheck
}
