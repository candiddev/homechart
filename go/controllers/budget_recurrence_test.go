package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestBudgetRecurrenceCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.BudgetRecurrences[0]
	noAccount := seed.BudgetRecurrences[0]
	noAccount.BudgetAccountID = uuid.Nil
	noRecurrence := seed.BudgetRecurrences[0]
	noRecurrence.Recurrence = types.Recurrence{}

	tests := map[string]struct {
		err        string
		recurrence models.BudgetRecurrence
	}{
		"missing account": {
			err:        errs.ErrSenderBadRequest.Message(),
			recurrence: noAccount,
		},
		"missing recurrence": {
			err:        types.ErrRecurrence.Message(),
			recurrence: noRecurrence,
		},
		"good": {
			recurrence: good,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var b models.BudgetRecurrences

			r := request{
				data:         tc.recurrence,
				method:       "POST",
				responseType: &b,
				session:      seed.AuthSessions[0],
				uri:          "/budget/recurrences",
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				assert.Equal(t, b[0].BudgetAccountID, tc.recurrence.BudgetAccountID)

				b[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
				models.Delete(ctx, &b[0], models.DeleteOpts{})
			}
		})
	}
}

func TestBudgetRecurrenceDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.BudgetRecurrences[0]
	models.Create(ctx, &d, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/budget/recurrences/" + d.ID.String(),
	}

	noError(t, r.do())
}

func TestBudgetRecurrenceRead(t *testing.T) {
	logger.UseTestLogger(t)

	var b models.BudgetRecurrences

	r := request{
		method:       "GET",
		responseType: &b,
		session:      seed.AuthSessions[0],
		uri:          "/budget/recurrences/" + seed.BudgetRecurrences[0].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, b[0].Template.Date, seed.BudgetRecurrences[0].Template.Date)
}

func TestBudgetRecurrenceUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	b := seed.BudgetRecurrences[0]
	models.Create(ctx, &b, models.CreateOpts{})
	noAccount := b
	noAccount.BudgetAccountID = uuid.Nil
	newRecurrence := b
	newRecurrence.BudgetAccountID = seed.BudgetAccounts[2].ID
	noRecurrence := seed.BudgetRecurrences[0]
	noRecurrence.Recurrence = types.Recurrence{}

	tests := map[string]struct {
		err        string
		recurrence models.BudgetRecurrence
		uri        string
	}{
		"missing account": {
			err:        errs.ErrSenderBadRequest.Message(),
			recurrence: noAccount,
			uri:        "/budget/recurrences/" + b.ID.String(),
		},
		"bad recurrence": {
			err:        types.ErrRecurrence.Message(),
			recurrence: noRecurrence,
			uri:        "/budget/recurrences/" + b.ID.String(),
		},
		"good": {
			recurrence: newRecurrence,
			uri:        "/budget/recurrences/" + b.ID.String(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var b models.BudgetRecurrences

			r := request{
				data:         tc.recurrence,
				method:       "PUT",
				responseType: &b,
				session:      seed.AuthSessions[0],
				uri:          tc.uri,
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				b[0].AuthHouseholdID = newRecurrence.AuthHouseholdID
				b[0].Updated = newRecurrence.Updated

				assert.Equal(t, b[0], newRecurrence)
			}
		})
	}

	models.Delete(ctx, &b, models.DeleteOpts{})
}

func TestBudgetRecurrencesRead(t *testing.T) {
	logger.UseTestLogger(t)

	var b models.BudgetRecurrences

	r := request{
		method:       "GET",
		responseType: &b,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/budget/recurrences",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(b), 0)
	assert.Equal(t, len(msg.DataIDs), 3)
}
