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

func TestBudgetMonthCategoryCreate(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)
	ah.SubscriptionExpires = seed.AuthHouseholds[0].SubscriptionExpires
	ah.UpdateSubscription(ctx)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testbudgetmonthcategorycreate@example.com"
	aa.Create(ctx, false)

	aaah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: ah.ID,
	}
	models.Create(ctx, &aaah, models.CreateOpts{})

	as := models.AuthSession{
		AuthAccountID: aa.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	as.Create(ctx, false)

	bc := seed.BudgetCategories[1]
	bc.AuthHouseholdID = ah.ID
	models.Create(ctx, &bc, models.CreateOpts{})

	good := seed.BudgetMonthCategories[1]
	good.AuthHouseholdID = ah.ID
	good.BudgetCategoryID = bc.ID
	good.YearMonth = types.CivilDateOf(models.GenerateTimestamp()).AddMonths(-10).YearMonth()
	wrongHousehold := good
	wrongHousehold.AuthHouseholdID = seed.AuthHouseholds[0].ID

	noBudgetCategoryID := good
	noBudgetCategoryID.BudgetCategoryID = uuid.Nil
	tests := map[string]struct {
		err      string
		category models.BudgetMonthCategory
	}{
		"missing year month": {
			err:      errs.ErrSenderForbidden.Message(),
			category: wrongHousehold,
		},
		"missing budget category ID": {
			err:      errs.ErrSenderBadRequest.Message(),
			category: noBudgetCategoryID,
		},
		"good": {
			category: good,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var b models.BudgetMonthCategories

			r := request{
				data:         tc.category,
				method:       "POST",
				responseType: &b,
				session:      as,
				uri:          "/budget/month-categories",
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				assert.Equal(t, b[0].YearMonth, tc.category.YearMonth)

				b[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
				b[0].Amount = 0
				b[0].Update(ctx)
			}
		})
	}

	aa.Delete(ctx)
	ah.Delete(ctx)
}

func TestBudgetMonthCategoryUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testbudgetmonthcategorycreate@example.com"
	aa.Create(ctx, false)

	aaah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: ah.ID,
	}
	models.Create(ctx, &aaah, models.CreateOpts{})

	as := models.AuthSession{
		AuthAccountID: aa.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	as.Create(ctx, false)

	bc := seed.BudgetCategories[1]
	bc.AuthHouseholdID = ah.ID
	models.Create(ctx, &bc, models.CreateOpts{})

	bm := seed.BudgetMonthCategories[1]
	bm.AuthHouseholdID = ah.ID
	bm.BudgetCategoryID = bc.ID
	bm.YearMonth = types.CivilDateOf(models.GenerateTimestamp()).AddMonths(-10).YearMonth()
	bm.Create(ctx)

	badHousehold := bm
	badHousehold.AuthHouseholdID = seed.AuthHouseholds[0].ID

	good := bm
	good.Amount = 1

	tests := map[string]struct {
		err      string
		category models.BudgetMonthCategory
	}{
		"bad household": {
			err:      errs.ErrSenderForbidden.Message(),
			category: badHousehold,
		},
		"good": {
			category: good,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r := request{
				data:    tc.category,
				method:  "PUT",
				session: as,
				uri:     "/budget/month-categories",
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				bm.Read(ctx)

				assert.Equal(t, bm, good)
			}
		})
	}

	aa.Delete(ctx)
	ah.Delete(ctx)
}
