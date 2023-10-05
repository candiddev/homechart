package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

// BudgetRecurrenceCreate creates a new BudgetRecurrence using POST data.
// @Accept json
// @ID BudgetRecurrenceCreate
// @Param body body models.BudgetRecurrence true "BudgetRecurrence"
// @Produce json
// @Router /budget/recurrences [post]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetRecurrences}
// @Summary Create BudgetRecurrence
// @Tags BudgetRecurrence
func (*Handler) BudgetRecurrenceCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get BudgetRecurrence from body
	var b models.BudgetRecurrence

	if err := getJSON(ctx, &b, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	// Validate entries
	if err := b.Template.Validate(); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	if err := b.Recurrence.Validate(); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	// Check required fields
	p := getPermissions(ctx)

	// Create BudgetPayee if necessary
	if b.Template.BudgetPayeeName != "" {
		bp := models.BudgetPayee{
			AuthHouseholdID: b.Template.AuthHouseholdID,
			Name:            b.Template.BudgetPayeeName,
		}

		if err := models.Create(ctx, &bp, models.CreateOpts{
			PermissionsOpts: p,
		}); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}
	}

	// Create the BudgetRecurrence
	err := models.Create(ctx, &b, models.CreateOpts{
		PermissionsOpts: p,
	})

	WriteResponse(ctx, w, b, nil, 1, "", logger.Error(ctx, err))
}

// BudgetRecurrenceDelete deletes a BudgetRecurrence.
// @Accept json
// @ID BudgetRecurrenceDelete
// @Param id path string true "ID"
// @Produce json
// @Router /budget/recurrences/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete BudgetRecurrences
// @Tags BudgetRecurrence
func (*Handler) BudgetRecurrenceDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionDelete.do(ctx, &models.BudgetRecurrence{}, w, r)) //nolint:errcheck
}

// BudgetRecurrenceRead reads a BudgetRecurrence.
// @Accept json
// @ID BudgetRecurrenceRead
// @Param id path string true "ID"
// @Produce json
// @Router /budget/recurrences/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetRecurrences}
// @Summary Read BudgetRecurrences
// @Tags BudgetRecurrence
func (*Handler) BudgetRecurrenceRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, actionRead.do(ctx, &models.BudgetRecurrence{}, w, r)) //nolint:errcheck
}

// BudgetRecurrenceUpdate updates a BudgetRecurrence.
// @Accept json
// @ID BudgetRecurrenceUpdate
// @Param body body models.BudgetRecurrence true "BudgetRecurrence"
// @Param id path string true "ID"
// @Produce json
// @Router /budget/recurrences/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetRecurrences}
// @Summary Update BudgetRecurrence
// @Tags BudgetRecurrence
func (*Handler) BudgetRecurrenceUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get BudgetRecurrence from body
	var b models.BudgetRecurrence

	if err := getJSON(ctx, &b, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	// Validate entries
	if err := b.Template.Validate(); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	if err := b.Recurrence.Validate(); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

		return
	}

	// Get Recurrence ID and AuthHouseholdID
	b.ID = getUUID(r, "id")
	if b.ID == uuid.Nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderBadRequest))

		return
	}

	p := getPermissions(ctx)

	// Create BudgetPayee if necessary
	if b.Template.BudgetPayeeName != "" {
		bp := models.BudgetPayee{
			AuthHouseholdID: b.Template.AuthHouseholdID,
			Name:            b.Template.BudgetPayeeName,
		}

		if err := models.Create(ctx, &bp, models.CreateOpts{
			PermissionsOpts: p,
		}); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}
	}

	// Update recurrence
	err := models.Update(ctx, &b, models.UpdateOpts{
		PermissionsOpts: p,
	})

	WriteResponse(ctx, w, b, nil, 1, "", logger.Error(ctx, err))
}

// BudgetRecurrencesRead reads all BudgetRecurrences for an AuthHousehold.
// @Accept json
// @ID BudgetRecurrencesRead
// @Produce json
// @Router /budget/recurrences [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.BudgetRecurrences}
// @Summary Read all BudgetRecurrences
// @Tags BudgetRecurrence
func (*Handler) BudgetRecurrencesRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	logger.Error(ctx, readAll(ctx, &models.BudgetRecurrences{}, w)) //nolint:errcheck
}
