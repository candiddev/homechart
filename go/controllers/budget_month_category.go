package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

// BudgetMonthCategoryCreate creates a new BudgetMonth using POST data.
// @Accept json
// @ID BudgetMonthCategoryCreate
// @Param body body models.BudgetMonthCategory true "BudgetMonthCategory"
// @Produce json
// @Router /budget/month-categories [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetMonthCategories}
// @Summary Create BudgetMonthCategory
// @Tags BudgetMonthCategory
func (*Handler) BudgetMonthCategoryCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get BudgetMonthCategory from body
	var b models.BudgetMonthCategory

	if err := getJSON(ctx, &b, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	p := getPermissions(ctx)
	if p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&b.AuthHouseholdID, models.PermissionComponentBudget, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	// Create the BudgetMonth
	WriteResponse(ctx, w, b, nil, 1, "", logger.Error(ctx, b.Create(ctx)))
}

// BudgetMonthCategoryUpdate updates a BudgetMonthCategory.
// @Accept json
// @ID BudgetMonthCategoryUpdate
// @Param body body models.BudgetMonthCategory true "BudgetMonthCategory"
// @Produce json
// @Router /budget/month-categories [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetMonthCategories}
// @Summary Update BudgetMonthCategory
// @Tags BudgetMonthCategory
func (*Handler) BudgetMonthCategoryUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get BudgetMonthCategory from body
	var b models.BudgetMonthCategory

	if err := getJSON(ctx, &b, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	p := getPermissions(ctx)
	if p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&b.AuthHouseholdID, models.PermissionComponentBudget, models.PermissionEdit) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	// Update month
	WriteResponse(ctx, w, b, nil, 1, "", logger.Error(ctx, b.Update(ctx)))
}
