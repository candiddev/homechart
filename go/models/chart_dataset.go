package models

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// ChartDataset contains data for charts.
type ChartDataset struct {
	Name   string      `db:"name" json:"name"`
	Values ChartValues `db:"values" json:"values"`
}

// ChartValue contains a value configuration for a chart.
type ChartValue struct {
	Name  string `json:"name"`
	Value int    `json:"value"`
}

// ChartDatasets is multiple ChartDataset.
type ChartDatasets []ChartDataset

// ChartValues is multiple ChartValue.
type ChartValues []ChartValue

// Scan reads in a ChartValues from a database.
func (c *ChartValues) Scan(src any) error {
	if src != nil {
		source := string(src.([]byte))
		if strings.Contains(source, `[{`) {
			err := json.Unmarshal(src.([]byte), c)

			return err
		} else if source == "[]" {
			return nil
		}
	}

	return nil
}

// ChartDatasetsReadBudgetCategories reads chart data for BudgetCategories.
func ChartDatasetsReadBudgetCategories(ctx context.Context, authHouseholdID uuid.UUID, from, to types.YearMonth, groupings bool) (ChartDatasets, errs.Err) {
	ctx = logger.Trace(ctx)

	d := ChartDatasets{}

	groupBy := "name"

	if groupings {
		groupBy = "grouping"
	}

	return d, logger.Error(ctx, db.Query(ctx, true, &d, fmt.Sprintf(`
SELECT
	  %[1]s AS name
	, coalesce(
		json_build_array(
			json_build_object(
				  'name', 'amount'
				, 'value', sum(budget_transaction_category.amount)
			)
		), '{}'
	) as values
FROM budget_category
LEFT JOIN budget_transaction_category ON budget_transaction_category.budget_category_id = budget_category.id
WHERE budget_transaction_category.auth_household_id = $1
AND budget_transaction_category.amount < 0
AND budget_transaction_category.year_month >= $2
AND budget_transaction_category.year_month <= $3
AND budget_category.grouping != ''
GROUP BY %[1]s
ORDER BY sum(budget_transaction_category.amount)
`, groupBy), nil, authHouseholdID, from.Int(), to.Int()))
}

// ChartDatasetsReadBudgetIncomeExpense reads chart data for BudgetIncomeExpenses.
func ChartDatasetsReadBudgetIncomeExpense(ctx context.Context, authHouseholdID uuid.UUID, from, to types.YearMonth) (ChartDatasets, errs.Err) {
	ctx = logger.Trace(ctx)

	d := ChartDatasets{}

	return d, logger.Error(ctx, db.Query(ctx, true, &d, `
SELECT
	format('%s-%s', left(year_month::text, 4), right(year_month::text, -4)) as name,
	coalesce(
		json_build_array(
			json_build_object(
				  'name', 'total'
				, 'value', sum(total)
			),
			json_build_object(
				  'name', 'income'
				, 'value', sum(income)
			),
			json_build_object(
				  'name', 'expense'
				, 'value', sum(expense) * -1
			)
		), '{}'
	) as values
FROM (
	SELECT
		  year_month
		, sum(sum(budget_month_category.budget_transaction_amount)) OVER (ORDER BY year_month) AS total
		, sum(case when budget_transaction_amount < 0 then budget_transaction_amount else 0 end) as expense
		, sum(case when budget_transaction_amount > 0 then budget_transaction_amount else 0 end) as income
	FROM budget_month_category
	WHERE auth_household_id = $1
	GROUP BY year_month
) data
WHERE year_month >= $2
AND year_month <= $3
GROUP BY year_month
ORDER BY year_month
`, nil, authHouseholdID, from.Int(), to.Int()))
}

// ChartDatasetsReadBudgetPayees reads chart data for BudgetPayees.
func ChartDatasetsReadBudgetPayees(ctx context.Context, authHouseholdID uuid.UUID, from, to types.YearMonth) (ChartDatasets, errs.Err) {
	ctx = logger.Trace(ctx)

	d := ChartDatasets{}

	return d, logger.Error(ctx, db.Query(ctx, true, &d, `
SELECT
	CASE
		WHEN budget_transaction.budget_payee_id IS NULL
			THEN budget_account.name
		ELSE budget_payee.name
		END as name,
	coalesce(
		json_build_array(
			json_build_object(
				  'name', 'amount'
				, 'value', sum(CASE
						WHEN budget_transaction.budget_payee_id IS NULL
							THEN budget_transaction_account.amount * -1
							ELSE budget_transaction.amount
						END)
			)
		), '{}'
	) as values
FROM budget_transaction
LEFT JOIN budget_payee ON budget_transaction.budget_payee_id = budget_payee.id
LEFT JOIN budget_transaction_account ON budget_transaction.id = budget_transaction_account.budget_transaction_id
LEFT JOIN budget_account ON budget_transaction_account.budget_account_id = budget_account.id
WHERE budget_transaction.auth_household_id = $1
AND (
	(
		budget_transaction.budget_payee_id IS NOT NULL
		AND budget_transaction.amount < 0
	) OR (
		budget_transaction_account.amount > 0
		AND budget_account.budget IS FALSE
	)
)
AND to_char(budget_transaction.date, 'YYYYMM')::integer >= $2
AND to_char(budget_transaction.date, 'YYYYMM')::integer <= $3
GROUP BY budget_transaction.budget_payee_id, budget_account.name, budget_payee.name
ORDER BY CASE
	WHEN budget_transaction.budget_payee_id IS NULL
		THEN sum(budget_transaction_account.amount) * -1
	ELSE sum(budget_transaction.amount)
	END,
	CASE WHEN budget_transaction.budget_payee_id IS NULL
		THEN budget_account.name
	ELSE budget_payee.name
END
`, nil, authHouseholdID, from.Int(), to.Int()))
}
