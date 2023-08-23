package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// CookRecipeCreate creates a new CookRecipe using POST data.
// @Accept json
// @ID CookRecipeCreate
// @Param body body models.CookRecipe true "CookRecipe"
// @Produce json
// @Router /cook/recipes [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookRecipes}
// @Summary Create CookRecipe
// @Tags CookRecipe
func (*Handler) CookRecipeCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionCreate.do(ctx, &models.CookRecipe{}, w, r)) //nolint:errcheck
}

// CookRecipeDelete deletes a CookRecipe.
// @Accept json
// @ID CookRecipeDelete
// @Param id path string true "ID"
// @Produce json
// @Router /cook/recipes/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete CookRecipe
// @Tags CookRecipe
func (*Handler) CookRecipeDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionDelete.do(ctx, &models.CookRecipe{}, w, r)) //nolint:errcheck
}

// CookRecipeRead reads a CookRecipe.
// @Accept json
// @ID CookRecipeRead
// @Description Can read recipes marked public unauthenticated
// @Param id path string true "ID"
// @Produce json
// @Router /cook/recipes/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookRecipes}
// @Summary Read CookRecipe
// @Tags CookRecipe
func (*Handler) CookRecipeRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionRead.do(ctx, &models.CookRecipe{}, w, r)) //nolint:errcheck
}

// CookRecipeUpdate updates a CookRecipe.
// @Accept json
// @ID CookRecipeUpdate
// @Param body body models.CookRecipe true "CookRecipe"
// @Param id path string true "ID"
// @Produce json
// @Router /cook/recipes/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookRecipes}
// @Summary Update CookRecipe
// @Tags CookRecipe
func (*Handler) CookRecipeUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, actionUpdate.do(ctx, &models.CookRecipe{}, w, r)) //nolint:errcheck
}

// CookRecipesRead reads all CookRecipe for a AuthHousehold.
// @Accept json
// @ID CookRecipesRead
// @Produce json
// @Router /cook/recipes [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.CookRecipes}
// @Summary Read all CookRecipes
// @Tags CookRecipe
func (*Handler) CookRecipesRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Log(ctx, readAll(ctx, &models.CookRecipes{}, w)) //nolint:errcheck
}
