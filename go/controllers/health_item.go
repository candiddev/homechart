package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

// HealthItemCreate creates a new HealthItem using POST data.
// @Accept json
// @ID HealthItemCreate
// @Param body body models.HealthItem true "HealthItem"
// @Produce json
// @Router /health/items [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.HealthItems}
// @Summary Create HealthItem
// @Tags HealthItem
func (*Handler) HealthItemCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.HealthItem{}, w, r)) //nolint:errcheck
}

// HealthItemDelete deletes a HealthItem.
// @Accept json
// @ID HealthItemDelete
// @Param id path string true "ID"
// @Produce json
// @Router /health/items/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete HealthItem
// @Tags HealthItem
func (*Handler) HealthItemDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.HealthItem{}, w, r)) //nolint:errcheck
}

// HealthItemRead reads a HealthItem.
// @Accept json
// @ID HealthItemRead
// @Param id path string true "ID"
// @Produce json
// @Router /health/items/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.HealthItems}
// @Summary Read HealthItem
// @Tags HealthItem
func (*Handler) HealthItemRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.HealthItem{}, w, r)) //nolint:errcheck
}

// HealthItemUpdate updates a HealthItem.
// @Accept json
// @ID HealthItemUpdate
// @Param body body models.HealthItem true "HealthItem"
// @Param id path string true "ID"
// @Produce json
// @Router /health/items/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.HealthItems}
// @Summary Update HealthItem
// @Tags HealthItem
func (*Handler) HealthItemUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.HealthItem{}, w, r)) //nolint:errcheck
}

// HealthItemsInit re-initializes defaults for HealthItems for an AuthAccount.
// @Accept json
// @ID HealthItemsInit
// @Produce json
// @Router /health/items [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.HealthItems}
// @Summary Add default HealthItems
// @Tags HealthItem
func (*Handler) HealthItemsInit(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get fields from ctx
	aa := models.GetAuthAccountID(ctx)
	p := getPermissions(ctx)

	if p.AuthAccountPermissions != nil && p.AuthAccountPermissions.Health > models.PermissionEdit {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderForbidden))

		return
	}

	aai, err := uuid.Parse(r.URL.Query().Get("authAccountID"))
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderBadRequest))

		return
	}

	a := models.AuthAccount{
		ID: aai,
	}

	if err := a.Read(ctx); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	if aai != aa {
		if a.Child && a.PrimaryAuthHouseholdID != nil {
			if p.AuthHouseholdsPermissions.IsPermitted(&a.PrimaryAuthHouseholdID.UUID, models.PermissionComponentAuth, models.PermissionEdit) {
				aa = aai
			}
		}
	}

	// Read cards
	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, models.HealthItemsInit(ctx, aa)))
}

// HealthItemsRead reads all HealthItems for an AuthAccount.
// @Accept json
// @ID HealthItemsRead
// @Produce json
// @Router /health/items [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.HealthItems}
// @Summary Read all HealthItems
// @Tags HealthItem
func (*Handler) HealthItemsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.HealthItems{}, w)) //nolint:errcheck
}
