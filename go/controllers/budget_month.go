package controllers

import (
	"errors"
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

// BudgetMonthRead reads a BudgetMonth for an AuthHousehold.
// @Accept json
// @ID BudgetMonthRead
// @Param yearMonth path string true "yearMonth"
// @Produce json
// @Router /budget/months/{yearMonth} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetMonth}
// @Summary Read BudgetMonth
// @Tags BudgetMonth
func (*Handler) BudgetMonthRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get fields from ctx
	b := models.BudgetMonth{
		AuthHouseholdID: getUUID(r, "auth_household_id"),
		YearMonth:       types.YearMonth(getInt(r, "year_month")),
	}

	p := getPermissions(ctx)
	if p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&b.AuthHouseholdID, models.PermissionComponentBudget, models.PermissionView) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientForbidden))

		return
	}

	if b.YearMonth == 0 {
		b.YearMonth = types.CivilDateOf(models.GenerateTimestamp()).YearMonth()
	}

	err := b.Read(ctx)
	if errors.Is(err, errs.ErrClientBadRequestMissing) {
		err = errs.ErrClientNoContent
	}

	WriteResponse(ctx, w, b, nil, 1, "", logger.Log(ctx, err))
}
