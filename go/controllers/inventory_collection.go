package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// InventoryCollectionCreate creates a new InventoryCollection using POST data.
// @Accept json
// @ID InventoryCollectionCreate
// @Param body body models.InventoryCollection true "InventoryCollection"
// @Produce json
// @Router /inventory/collections [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.InventoryCollections}
// @Summary Create InventoryCollection
// @Tags InventoryCollection
func (*Handler) InventoryCollectionCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.InventoryCollection{}, w, r)) //nolint:errcheck
}

// InventoryCollectionDelete deletes a InventoryCollection.
// @Accept json
// @ID InventoryCollectionDelete
// @Param id path string true "ID"
// @Produce json
// @Router /inventory/collections/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete InventoryCollection
// @Tags InventoryCollection
func (*Handler) InventoryCollectionDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.InventoryCollection{}, w, r)) //nolint:errcheck
}

// InventoryCollectionRead reads a InventoryCollection.
// @Accept json
// @ID InventoryCollectionRead
// @Param id path string true "ID"
// @Produce json
// @Router /inventory/collections/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.InventoryCollections}
// @Summary Read InventoryCollection
// @Tags InventoryCollection
func (*Handler) InventoryCollectionRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.InventoryCollection{}, w, r)) //nolint:errcheck
}

// InventoryCollectionUpdate updates a InventoryCollection.
// @Accept json
// @ID InventoryCollectionUpdate
// @Param body body models.InventoryCollection true "InventoryCollection"
// @Param id path string true "ID"
// @Produce json
// @Router /inventory/collections/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.InventoryCollections}
// @Summary Update InventoryCollection
// @Tags InventoryCollection
func (*Handler) InventoryCollectionUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.InventoryCollection{}, w, r)) //nolint:errcheck
}

// InventoryCollectionsRead reads all InventoryCollection for an AuthHousehold.
// @Accept json
// @ID InventoryCollectionsRead
// @Produce json
// @Router /inventory/collections [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.InventoryCollections}
// @Summary Read all InventoryCollections
// @Tags InventoryCollection
func (*Handler) InventoryCollectionsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.InventoryCollections{}, w)) //nolint:errcheck
}
