package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// BudgetPayeeCreate creates a new BudgetPayee using POST data.
// @Accept json
// @ID BudgetPayeeCreate
// @Param body body models.BudgetPayee true "BudgetPayee"
// @Produce json
// @Router /budget/payees [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetPayees}
// @Summary Create BudgetPayee
// @Tags BudgetPayee
func (*Handler) BudgetPayeeCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.BudgetPayee{}, w, r)) //nolint:errcheck
}

// BudgetPayeeDelete deletes a BudgetPayee.
// @Accept json
// @ID BudgetPayeeDelete
// @Param id path string true "ID"
// @Produce json
// @Router /budget/payees/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete BudgetPayee
// @Tags BudgetPayee
func (*Handler) BudgetPayeeDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.BudgetPayee{}, w, r)) //nolint:errcheck
}

// BudgetPayeeRead reads a BudgetPayee.
// @Accept json
// @ID BudgetPayeeRead
// @Param id path string true "ID"
// @Produce json
// @Router /budget/payees/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetPayees}
// @Summary Read BudgetPayee
// @Tags BudgetPayee
func (*Handler) BudgetPayeeRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.BudgetPayee{}, w, r)) //nolint:errcheck
}

// BudgetPayeeUpdate updates a BudgetPayee.
// @Accept json
// @ID BudgetPayeeUpdate
// @Param body body models.BudgetPayee true "BudgetPayee"
// @Param id path string true "ID"
// @Produce json
// @Router /budget/payees/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetPayees}
// @Summary Update BudgetPayee
// @Tags BudgetPayee
func (*Handler) BudgetPayeeUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.BudgetPayee{}, w, r)) //nolint:errcheck
}

// BudgetPayeesRead reads all BudgetPayees for an AuthHousehold.
// @Accept json
// @ID BudgetPayeesRead
// @Produce json
// @Router /budget/payees [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetPayees}
// @Summary Read all BudgetPayees
// @Tags BudgetPayee
func (*Handler) BudgetPayeesRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.BudgetPayees{}, w)) //nolint:errcheck
}
