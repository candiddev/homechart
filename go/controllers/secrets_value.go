package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// SecretsValueCreate creates a new SecretsValue using POST data.
// @Accept json
// @ID SecretsValueCreate
// @Param body body models.SecretsValue true "SecretsValue"
// @Produce json
// @Router /secrets/values [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.SecretsValues}
// @Summary Create SecretsValue
// @Tags SecretsValue
func (*Handler) SecretsValueCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.SecretsValue{}, w, r)) //nolint:errcheck
}

// SecretsValueDelete deletes a SecretsValue.
// @Accept json
// @ID SecretsValueDelete
// @Param id path string true "ID"
// @Produce json
// @Router /secrets/values/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete SecretsValue
// @Tags SecretsValue
func (*Handler) SecretsValueDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.SecretsValue{}, w, r)) //nolint:errcheck
}

// SecretsValueRead reads a SecretsValue.
// @Accept json
// @ID SecretsValueRead
// @Param id path string true "ID"
// @Produce json
// @Router /secrets/values/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.SecretsValues}
// @Summary Read SecretsValue
// @Tags SecretsValue
func (*Handler) SecretsValueRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.SecretsValue{}, w, r)) //nolint:errcheck
}

// SecretsValueUpdate updates a SecretsValue.
// @Accept json
// @ID SecretsValueUpdate
// @Param body body models.SecretsValue true "SecretsValue"
// @Param id path string true "ID"
// @Produce json
// @Router /secrets/values/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.SecretsValues}
// @Summary Update SecretsValue
// @Tags SecretsValue
func (*Handler) SecretsValueUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.SecretsValue{}, w, r)) //nolint:errcheck
}

// SecretsValuesRead reads all SecretsValues for an AuthHousehold.
// @Accept json
// @ID SecretsValuesRead
// @Produce json
// @Router /secrets/values [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.SecretsValues}
// @Summary Read all SecretsValues
// @Tags SecretsValue
func (*Handler) SecretsValuesRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.SecretsValues{}, w)) //nolint:errcheck
}
