package controllers

import (
	"net/http"
	"strconv"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/go-chi/chi/v5"
)

type chartDatasetsType int

const (
	chartDatasetsTypeBudgetCategory chartDatasetsType = iota
	chartDatasetsTypeBudgetCategoryHeader
	chartDatasetsTypeBudgetIncomeExpense
	chartDatasetsTypeBudgetPayee
)

// ChartDatasetsRead reads ChartDatasets for a ChartRequestType.
func (*Handler) ChartDatasetsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	ah := getUUID(r, "auth_household_id")
	p := getPermissions(ctx)

	if p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&ah, models.PermissionComponentBudget, models.PermissionView) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientForbidden))

		return
	}

	from, err := types.YearMonthFromString(r.URL.Query().Get("from"))
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestProperty))

		return
	}

	to, err := types.YearMonthFromString(r.URL.Query().Get("to"))
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestProperty))

		return
	}

	var d models.ChartDatasets

	var e errs.Err

	switch chi.URLParam(r, "chart_type") {
	case strconv.Itoa(int(chartDatasetsTypeBudgetCategory)):
		d, e = models.ChartDatasetsReadBudgetCategories(ctx, ah, from, to, false)
	case strconv.Itoa(int(chartDatasetsTypeBudgetCategoryHeader)):
		d, e = models.ChartDatasetsReadBudgetCategories(ctx, ah, from, to, true)
	case strconv.Itoa(int(chartDatasetsTypeBudgetIncomeExpense)):
		d, e = models.ChartDatasetsReadBudgetIncomeExpense(ctx, ah, from, to)
	case strconv.Itoa(int(chartDatasetsTypeBudgetPayee)):
		d, e = models.ChartDatasetsReadBudgetPayees(ctx, ah, from, to)
	}

	WriteResponse(ctx, w, d, nil, len(d), "", logger.Log(ctx, e))
}
