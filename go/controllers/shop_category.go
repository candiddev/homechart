package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// ShopCategoryCreate creates a new ShopCategory using POST data.
// @Accept json
// @ID ShopCategoryCreate
// @Param body body models.ShopCategory true "ShopCategory"
// @Produce json
// @Router /shop/categories [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopCategories}
// @Summary Create ShopCategory
// @Tags ShopCategory
func (*Handler) ShopCategoryCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.ShopCategory{}, w, r)) //nolint:errcheck
}

// ShopCategoryDelete deletes a ShopCategory.
// @Accept json
// @ID ShopCategoryDelete
// @Param id path string true "ID"
// @Produce json
// @Router /shop/categories/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete ShopCategory
// @Tags ShopCategory
func (*Handler) ShopCategoryDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.ShopCategory{}, w, r)) //nolint:errcheck
}

// ShopCategoryRead reads a ShopCategory.
// @Accept json
// @ID ShopCategoryRead
// @Param id path string true "ID"
// @Produce json
// @Router /shop/categories/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopCategories}
// @Summary Read ShopCategory
// @Tags ShopCategory
func (*Handler) ShopCategoryRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.ShopCategory{}, w, r)) //nolint:errcheck
}

// ShopCategoryUpdate updates a ShopCategory.
// @Accept json
// @ID ShopCategoryUpdate
// @Param body body models.ShopCategory true "ShopCategory"
// @Param id path string true "ID"
// @Produce json
// @Router /shop/categories/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopCategories}
// @Summary Update ShopCategory
// @Tags ShopCategory
func (*Handler) ShopCategoryUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionUpdate.do(ctx, &models.ShopCategory{}, w, r)) //nolint:errcheck
}

// ShopCategoriesRead reads all ShopCategories for an AuthHousehold.
// @Accept json
// @ID ShopCategoriesRead
// @Produce json
// @Router /shop/categories [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.ShopCategories}
// @Summary Read all ShopCategories
// @Tags ShopCategory
func (*Handler) ShopCategoriesRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.ShopCategories{}, w)) //nolint:errcheck
}
