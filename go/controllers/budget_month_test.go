package controllers

import (
	"fmt"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestBudgetMonthRead(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]types.YearMonth{
		"read":         seed.BudgetMonthCategories[0].YearMonth,
		"future month": types.CivilDateOf(models.GenerateTimestamp()).AddMonths(2).YearMonth(),
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var b models.BudgetMonths

			r := request{
				method:       "GET",
				responseType: &b,
				session:      seed.AuthSessions[0],
				uri:          fmt.Sprintf("/budget/months/%s/%d", seed.AuthHouseholds[0].ID, tc.Int()),
			}

			noError(t, r.do())
			assert.Equal(t, b[0].BudgetTransactionAmountIncomeRemaining, 40000)
		})
	}
}
