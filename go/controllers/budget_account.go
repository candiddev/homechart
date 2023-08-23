package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// BudgetAccountCreate creates a new BudgetAccount using POST data.
// @Accept json
// @ID BudgetAccountCreate
// @Param body body models.BudgetAccount true "BudgetAccount"
// @Produce json
// @Router /budget/accounts [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetAccounts}
// @Summary Create BudgetAccount
// @Tags BudgetAccount
func (*Handler) BudgetAccountCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.BudgetAccount{}, w, r)) //nolint:errcheck
}

// BudgetAccountDelete deletes a BudgetAccount.
// @Accept json
// @ID BudgetAccountDelete
// @Param id path string true "ID"
// @Produce json
// @Router /budget/accounts/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete BudgetAccount
// @Tags BudgetAccount
func (*Handler) BudgetAccountDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.BudgetAccount{}, w, r)) //nolint:errcheck
}

// BudgetAccountRead reads a BudgetAccount.
// @Accept json
// @ID BudgetAccountRead
// @Param id path string true "ID"
// @Produce json
// @Router /budget/accounts/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetAccounts}
// @Summary Read BudgetAccount
// @Tags BudgetAccount
func (*Handler) BudgetAccountRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.BudgetAccount{}, w, r)) //nolint:errcheck
}

// BudgetAccountReconcile reconciles all cleared BudgetTransactions for a BudgetAccount.
// @Accept json
// @ID BudgetAccountReconcile
// @Param id path string true "ID"
// @Produce json
// @Router /budget/accounts/{id}/reconcile [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetAccounts}
// @Summary Reconcile a BudgetAccount
// @Tags BudgetAccount
func (*Handler) BudgetAccountReconcile(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get fields from ctx
	ba := getUUID(r, "id")

	err := models.BudgetTransactionAccountsReconcile(ctx, getPermissions(ctx), ba)
	WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))
}

// BudgetAccountUpdate updates a BudgetAccount.
// @Accept json
// @ID BudgetAccountUpdate
// @Param body body models.BudgetAccount true "BudgetAccount"
// @Param id path string true "ID"
// @Produce json
// @Router /budget/accounts/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetAccounts}
// @Summary Update BudgetAccount
// @Tags BudgetAccount
func (*Handler) BudgetAccountUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionUpdate.do(ctx, &models.BudgetAccount{}, w, r)) //nolint:errcheck
}

// BudgetAccountsRead reads all BudgetAccounts for an AuthHousehold.
// @Accept json
// @ID BudgetAccountsRead
// @Produce json
// @Router /budget/accounts [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetAccounts}
// @Summary Read all BudgetAccounts
// @Tags BudgetAccount
func (*Handler) BudgetAccountsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.BudgetAccounts{}, w)) //nolint:errcheck
}
