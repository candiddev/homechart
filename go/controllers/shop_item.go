package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// ShopItemCreate creates a new ShopItem using POST data.
// @Accept json
// @ID ShopItemCreate
// @Param body body models.ShopItem true "ShopItem"
// @Produce json
// @Router /shop/items [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopItems}
// @Summary Create ShopItem
// @Tags ShopItem
func (*Handler) ShopItemCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.ShopItem{}, w, r)) //nolint:errcheck
}

// ShopItemDelete deletes a ShopItem.
// @Accept json
// @ID ShopItemDelete
// @Param id path string true "ID"
// @Produce json
// @Router /shop/items/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete ShopItem
// @Tags ShopItem
func (*Handler) ShopItemDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.ShopItem{}, w, r)) //nolint:errcheck
}

// ShopItemRead reads a ShopItem.
// @Accept json
// @ID ShopItemRead
// @Param id path string true "ID"
// @Produce json
// @Router /shop/items/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopItems}
// @Summary Read ShopItem
// @Tags ShopItem
func (*Handler) ShopItemRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.ShopItem{}, w, r)) //nolint:errcheck
}

// ShopItemUpdate updates a ShopItem.
// @Accept json
// @ID ShopItemUpdate
// @Param body body models.ShopItem true "ShopItem"
// @Param id path string true "ID"
// @Produce json
// @Router /shop/items/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopItems}
// @Summary Update ShopItem
// @Tags ShopItem
func (*Handler) ShopItemUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.ShopItem{}, w, r)) //nolint:errcheck
}

// ShopItemsRead reads all ShopItem for an AuthAccount and AuthHousehold.
// @Accept json
// @ID ShopItemsRead
// @Produce json
// @Router /shop/items [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopItems}
// @Summary Read all ShopItems
// @Tags ShopItem
func (*Handler) ShopItemsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.ShopItems{}, w)) //nolint:errcheck
}
