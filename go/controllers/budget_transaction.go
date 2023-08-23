package controllers

import (
	"errors"
	"net/http"
	"strings"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// BudgetTransactionCreate creates a new BudgetTransaction using POST data.
// @Accept json
// @ID BudgetTransactionCreate
// @Param body body models.BudgetTransaction true "BudgetTransaction"
// @Produce json
// @Router /budget/transactions [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetTransactions}
// @Summary Create BudgetTransaction
// @Tags BudgetTransaction
func (*Handler) BudgetTransactionCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get BudgetTransaction from body
	var b models.BudgetTransaction

	if err := getJSON(ctx, &b, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Validate entries
	if err := b.Validate(); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	opts := models.CreateOpts{
		PermissionsOpts: getPermissions(ctx),
	}

	// Create BudgetPayee if necessary
	if b.BudgetPayeeName != "" {
		bp := models.BudgetPayee{
			AuthHouseholdID: b.AuthHouseholdID,
			Name:            b.BudgetPayeeName,
		}

		if err := models.Create(ctx, &bp, opts); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}

		b.BudgetPayeeID = &bp.ID
	}

	// Create the BudgetTransaction
	WriteResponse(ctx, w, b, nil, 1, "", logger.Log(ctx, models.Create(ctx, &b, opts)))
}

// BudgetTransactionDelete deletes a BudgetTransaction.
// @Accept json
// @ID BudgetTransactionDelete
// @Param id path string true "ID"
// @Produce json
// @Router /budget/transactions/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete BudgetTransaction
// @Tags BudgetTransaction
func (*Handler) BudgetTransactionDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.BudgetTransaction{}, w, r)) //nolint:errcheck
}

// BudgetTransactionUpdate updates a BudgetTransaction.
// @Accept json
// @ID BudgetTransactionUpdate
// @Param body body models.BudgetTransaction true "BudgetTransaction"
// @Param id path string true "ID"
// @Produce json
// @Router /budget/transactions/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetTransactions}
// @Summary Update BudgetTransaction
// @Tags BudgetTransaction
func (*Handler) BudgetTransactionUpdate(w http.ResponseWriter, r *http.Request) { //nolint:gocognit
	ctx := logger.Trace(r.Context())

	// Get BudgetTransaction from body
	var bnew models.BudgetTransaction

	if err := getJSON(ctx, &bnew, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Get Transaction ID and AuthHouseholdID
	id := getUUID(r, "id")
	bnew.ID = &id

	if id == uuid.Nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestProperty))

		return
	}

	p := getPermissions(ctx)

	// Validate entries
	if err := bnew.Validate(); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Create BudgetPayee if necessary
	if bnew.BudgetPayeeName != "" {
		bp := models.BudgetPayee{
			AuthHouseholdID: bnew.AuthHouseholdID,
			Name:            bnew.BudgetPayeeName,
		}

		if err := models.Create(ctx, &bp, models.CreateOpts{
			PermissionsOpts: p,
		}); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}

		bnew.BudgetPayeeID = &bp.ID
	}

	// Get old transaction
	bold := bnew
	bold.Accounts = nil
	bold.Categories = nil

	if err := bold.Read(ctx); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Iterate over entries between new/old and delete ones that don't exist
	for n := range bnew.Accounts {
		var match bool

		for o := range bold.Accounts {
			bnew.Accounts[n].AuthHouseholdID = bold.AuthHouseholdID
			if bnew.Accounts[n].ID == bold.Accounts[o].ID {
				if err := models.Update(ctx, &bnew.Accounts[n], models.UpdateOpts{
					PermissionsOpts: p,
				}); err != nil && !errors.Is(err, errs.ErrClientNoContent) {
					WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

					return
				}

				bold.Accounts = append(bold.Accounts[:o], bold.Accounts[o+1:]...)
				match = true

				break
			}
		}

		// Create if not existing
		if !match {
			bnew.Accounts[n].AuthHouseholdID = bold.AuthHouseholdID
			bnew.Accounts[n].BudgetTransactionID = bnew.ID

			if err := models.Create(ctx, &bnew.Accounts[n], models.CreateOpts{
				PermissionsOpts: p,
			}); err != nil {
				WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

				return
			}
		}
	}

	// Remove remaining old accounts
	for o := range bold.Accounts {
		if err := models.Delete(ctx, &bold.Accounts[o], models.DeleteOpts{
			PermissionsOpts: p,
		}); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}
	}

	// Iterate over entries between new/old and delete ones that don't exist
	for n := range bnew.Categories {
		var match bool

		for o := range bold.Categories {
			bnew.Categories[n].AuthHouseholdID = bold.AuthHouseholdID
			if bold.Categories[o].ID == bnew.Categories[n].ID {
				if err := models.Update(ctx, &bnew.Categories[n], models.UpdateOpts{
					PermissionsOpts: p,
				}); err != nil && !errors.Is(err, errs.ErrClientNoContent) {
					WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

					return
				}

				bold.Categories = append(bold.Categories[:o], bold.Categories[o+1:]...)
				match = true

				break
			}
		}

		// Create if not existing
		if !match {
			bnew.Categories[n].AuthHouseholdID = bnew.AuthHouseholdID
			bnew.Categories[n].BudgetTransactionID = bnew.ID

			if err := models.Create(ctx, &bnew.Categories[n], models.CreateOpts{
				PermissionsOpts: p,
			}); err != nil {
				WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

				return
			}
		}
	}

	// Remove remaining old categories
	for o := range bold.Categories {
		if err := models.Delete(ctx, &bold.Categories[o], models.DeleteOpts{
			PermissionsOpts: p,
		}); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}
	}

	// Update transaction
	err := models.Update(ctx, &bnew, models.UpdateOpts{
		PermissionsOpts: p,
	})

	WriteResponse(ctx, w, bnew, nil, 1, "", logger.Log(ctx, err))
}

// BudgetTransactionsRead reads all BudgetTransactions for a BudgetAccount.
func (*Handler) BudgetTransactionsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get fields from ctx
	var b models.BudgetTransactions

	var err errs.Err

	var total int

	offset := getOffset(ctx)

	if id := getUUID(r, "id"); id != uuid.Nil {
		switch {
		case strings.Contains(r.URL.Path, "accounts"):
			b, total, err = models.BudgetTransactionsReadAccount(ctx, id, offset, 0)
		case strings.Contains(r.URL.Path, "categories"):
			yearMonth := types.YearMonth(getInt(r, "year_month"))

			if yearMonth != 0 {
				b, total, err = models.BudgetTransactionsReadCategoryMonth(ctx, id, yearMonth, offset)
			} else {
				b, total, err = models.BudgetTransactionsReadCategory(ctx, id, offset)
			}
		case strings.Contains(r.URL.Path, "payees"):
			b, total, err = models.BudgetTransactionsReadPayee(ctx, id, offset)
		}
	}

	if len(b) > 0 {
		p := getPermissions(ctx)
		if p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&b[0].AuthHouseholdID, models.PermissionComponentBudget, models.PermissionView) {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientForbidden))

			return
		}
	}

	WriteResponse(ctx, w, b, nil, total, "", logger.Log(ctx, err))
}

// BudgetTransactionsReadAccount is a placeholder.
// @Accept json
// @ID BudgetTransactionsRead
// @Param id path string true "ID"
// @Produce json
// @Router /budget/accounts/{id}/transactions [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetTransactions}
// @Summary Read BudgetTransactions for an Account
// @Tags BudgetAccount
func (*Handler) BudgetTransactionsReadAccount(_ http.ResponseWriter, _ *http.Request) {}

// BudgetTransactionsReadCategory is a placeholder.
// @Accept json
// @ID BudgetTransactionsReadCategory
// @Param id path string true "ID"
// @Produce json
// @Router /budget/categories/{id}/transactions [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetTransactions}
// @Summary Read BudgetTransactions for a Category
// @Tags BudgetCategory
func (*Handler) BudgetTransactionsReadCategory(_ http.ResponseWriter, _ *http.Request) {}

// BudgetTransactionsReadPayee is a placeholder.
// @Accept json
// @ID BudgetTransactionsReadPayee
// @Param id path string true "ID"
// @Produce json
// @Router /budget/payees/{id}/transactions [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetTransactions}
// @Summary Read BudgetTransactions for a Payee
// @Tags BudgetPayee
func (*Handler) BudgetTransactionsReadPayee(_ http.ResponseWriter, _ *http.Request) {}
