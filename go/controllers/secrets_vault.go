package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// SecretsVaultCreate creates a new SecretsVault using POST data.
// @Accept json
// @ID SecretsVaultCreate
// @Param body body models.SecretsVault true "SecretsVault"
// @Produce json
// @Router /secrets/vaults [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataVault=models.SecretsVaults}
// @Summary Create SecretsVault
// @Tags SecretsVault
func (*Handler) SecretsVaultCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.SecretsVault{}, w, r)) //nolint:errcheck
}

// SecretsVaultDelete deletes a SecretsVault.
// @Accept json
// @ID SecretsVaultDelete
// @Param id path string true "ID"
// @Produce json
// @Router /secrets/vaults/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete SecretsVault
// @Tags SecretsVault
func (*Handler) SecretsVaultDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.SecretsVault{}, w, r)) //nolint:errcheck
}

// SecretsVaultRead reads a SecretsVault.
// @Accept json
// @ID SecretsVaultRead
// @Param id path string true "ID"
// @Produce json
// @Router /secrets/vaults/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataVault=models.SecretsVaults}
// @Summary Read SecretsVault
// @Tags SecretsVault
func (*Handler) SecretsVaultRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.SecretsVault{}, w, r)) //nolint:errcheck
}

// SecretsVaultUpdate updates a SecretsVault.
// @Accept json
// @ID SecretsVaultUpdate
// @Param body body models.SecretsVault true "SecretsVault"
// @Param id path string true "ID"
// @Produce json
// @Router /secrets/vaults/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataVault=models.SecretsVaults}
// @Summary Update SecretsVault
// @Tags SecretsVault
func (*Handler) SecretsVaultUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.SecretsVault{}, w, r)) //nolint:errcheck
}

// SecretsVaultsRead reads all SecretsVaults for an AuthHousehold.
// @Accept json
// @ID SecretsVaultsRead
// @Produce json
// @Router /secrets/vaults [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataVault=models.SecretsVaults}
// @Summary Read all SecretsVaults
// @Tags SecretsVault
func (*Handler) SecretsVaultsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.SecretsVaults{}, w)) //nolint:errcheck
}
