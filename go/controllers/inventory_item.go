package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// InventoryItemCreate creates a new InventoryItem using POST data.
// @Accept json
// @ID InventoryItemCreate
// @Param body body models.InventoryItem true "InventoryItem"
// @Produce json
// @Router /inventory/items [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.InventoryItems}
// @Summary Create InventoryItem
// @Tags InventoryItem
func (*Handler) InventoryItemCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.InventoryItem{}, w, r)) //nolint:errcheck
}

// InventoryItemDelete deletes a InventoryItem.
// @Accept json
// @ID InventoryItemDelete
// @Param id path string true "ID"
// @Produce json
// @Router /inventory/items/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete InventoryItem
// @Tags InventoryItem
func (*Handler) InventoryItemDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.InventoryItem{}, w, r)) //nolint:errcheck
}

// InventoryItemRead reads a InventoryItem.
// @Accept json
// @ID InventoryItemRead
// @Param id path string true "ID"
// @Produce json
// @Router /inventory/items/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.InventoryItems}
// @Summary Read InventoryItem
// @Tags InventoryItem
func (*Handler) InventoryItemRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.InventoryItem{}, w, r)) //nolint:errcheck
}

// InventoryItemUpdate updates a InventoryItem.
// @Accept json
// @ID InventoryItemUpdate
// @Param body body models.InventoryItem true "InventoryItem"
// @Param id path string true "ID"
// @Produce json
// @Router /inventory/items/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.InventoryItems}
// @Summary Update InventoryItem
// @Tags InventoryItem
func (*Handler) InventoryItemUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.InventoryItem{}, w, r)) //nolint:errcheck
}

// InventoryItemsRead reads all InventoryItem for an AuthHousehold.
// @Accept json
// @ID InventoryItemsRead
// @Produce json
// @Router /inventory/items [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.InventoryItems}
// @Summary Read all InventoryItems
// @Tags InventoryItem
func (*Handler) InventoryItemsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.InventoryItems{}, w)) //nolint:errcheck
}
