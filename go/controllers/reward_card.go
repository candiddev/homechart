package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// RewardCardCreate creates a new RewardCard using POST data.
// @Accept json
// @ID RewardCardCreate
// @Param body body models.RewardCard true "RewardCard"
// @Produce json
// @Router /reward/cards [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.RewardCards}
// @Summary Create RewardCard
// @Tags RewardCard
func (*Handler) RewardCardCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionCreate.do(ctx, &models.RewardCard{}, w, r)) //nolint:errcheck
}

// RewardCardDelete deletes a RewardCard.
// @Accept json
// @ID RewardCardDelete
// @Param id path string true "ID"
// @Produce json
// @Router /reward/cards/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete RewardCard
// @Tags RewardCard
func (*Handler) RewardCardDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.RewardCard{}, w, r)) //nolint:errcheck
}

// RewardCardRead reads a RewardCard.
// @Accept json
// @ID RewardCardRead
// @Param id path string true "ID"
// @Produce json
// @Router /reward/cards/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.RewardCards}
// @Summary Read RewardCard
// @Tags RewardCard
func (*Handler) RewardCardRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.RewardCard{}, w, r)) //nolint:errcheck
}

// RewardCardUpdate updates a RewardCard.
// @Accept json
// @ID RewardCardUpdate
// @Param body body models.RewardCard true "RewardCard"
// @Param id path string true "ID"
// @Produce json
// @Router /reward/cards/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.RewardCards}
// @Summary Update RewardCard
// @Tags RewardCard
func (*Handler) RewardCardUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionUpdate.do(ctx, &models.RewardCard{}, w, r)) //nolint:errcheck
}

// RewardCardsRead reads all RewardCards for an AuthHousehold.
// @Accept json
// @ID RewardCardsRead
// @Produce json
// @Router /reward/cards [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.RewardCards}
// @Summary Read all RewardCards
// @Tags RewardCard
func (*Handler) RewardCardsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.RewardCards{}, w)) //nolint:errcheck
}
