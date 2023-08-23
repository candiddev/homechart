package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// ShopListCreate creates a new ShopList using POST data.
// @Accept json
// @ID ShopListCreate
// @Param body body models.ShopList true "ShopList"
// @Produce json
// @Router /shop/lists [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopLists}
// @Summary Create ShopList
// @Tags ShopList
func (*Handler) ShopListCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.ShopList{}, w, r)) //nolint:errcheck
}

// ShopListDelete deletes a ShopList.
// @Accept json
// @ID ShopListDelete
// @Param id path string true "ID"
// @Produce json
// @Router /shop/lists/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete ShopList
// @Tags ShopList
func (*Handler) ShopListDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get ShopList from body
	logger.Log(ctx, actionDelete.do(ctx, &models.ShopList{}, w, r)) //nolint:errcheck
}

// ShopListRead reads a ShopList.
// @Accept json
// @ID ShopListRead
// @Param id path string true "ID"
// @Produce json
// @Router /shop/lists/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopLists}
// @Summary Read ShopList
// @Tags ShopList
func (*Handler) ShopListRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.ShopList{}, w, r)) //nolint:errcheck
}

// ShopListUpdate updates a ShopList.
// @Accept json
// @ID ShopListUpdate
// @Param body body models.ShopList true "ShopList"
// @Param id path string true "ID"
// @Produce json
// @Router /shop/lists/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopLists}
// @Summary Update ShopList
// @Tags ShopList
func (*Handler) ShopListUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionUpdate.do(ctx, &models.ShopList{}, w, r)) //nolint:errcheck
}

// ShopListsRead reads all ShopLists for an AuthAccount and AuthHousehold.
// @Accept json
// @ID ShopListsRead
// @Produce json
// @Router /shop/lists [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopLists}
// @Summary Read all ShopLists
// @Tags ShopList
func (*Handler) ShopListsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.ShopLists{}, w)) //nolint:errcheck
}
