package controllers

import (
	"fmt"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestChartDatasetsRead(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]struct {
		datasetType chartDatasetsType
		err         string
		session     models.AuthSession
		want        models.ChartDatasets
	}{
		"no permissions": {
			err:         errs.ErrClientForbidden.Message(),
			datasetType: chartDatasetsTypeBudgetCategory,
			session:     seed.AuthSessions[1],
		},
		"budget category": {
			datasetType: chartDatasetsTypeBudgetCategory,
			session:     seed.AuthSessions[0],
			want: models.ChartDatasets{
				models.ChartDataset{
					Name: "Cleaning",
					Values: models.ChartValues{
						models.ChartValue{
							Name:  "amount",
							Value: -15000,
						},
					},
				},
				models.ChartDataset{
					Name: "Electronics",
					Values: models.ChartValues{
						models.ChartValue{
							Name:  "amount",
							Value: -10000,
						},
					},
				},
				models.ChartDataset{
					Name: "Pistachios",
					Values: models.ChartValues{
						models.ChartValue{
							Name:  "amount",
							Value: -5000,
						},
					},
				},
			},
		},
		"budget category header": {
			datasetType: chartDatasetsTypeBudgetCategoryHeader,
			session:     seed.AuthSessions[0],
			want: models.ChartDatasets{
				{
					Name: "Home",
					Values: models.ChartValues{
						{
							Name:  "amount",
							Value: -25000,
						},
					},
				},
				{
					Name: "Food",
					Values: models.ChartValues{
						{
							Name:  "amount",
							Value: -5000,
						},
					},
				},
			},
		},
		"budget income expense": {
			session:     seed.AuthSessions[0],
			datasetType: chartDatasetsTypeBudgetIncomeExpense,
			want: models.ChartDatasets{
				{
					Name: types.CivilDateToday().YearMonth().StringDash(),
					Values: models.ChartValues{
						{
							Name:  "total",
							Value: 75000,
						},
						{
							Name:  "income",
							Value: 105000,
						},
						{
							Name:  "expense",
							Value: 30000,
						},
					},
				},
			},
		},
		"budget payee": {
			session:     seed.AuthSessions[0],
			datasetType: chartDatasetsTypeBudgetPayee,
			want: models.ChartDatasets{
				{
					Name: "Jane's Thrift Shop",
					Values: models.ChartValues{
						{
							Name:  "amount",
							Value: -20000,
						},
					},
				},
				{
					Name: "John's Mega Mart",
					Values: models.ChartValues{
						{
							Name:  "amount",
							Value: -15000,
						},
					},
				},
				{
					Name: "Cash Buried Outside",
					Values: models.ChartValues{
						{
							Name:  "amount",
							Value: -10000,
						},
					},
				},
				{
					Name: "Jane's General Store",
					Values: models.ChartValues{
						{
							Name:  "amount",
							Value: -10000,
						},
					},
				},
			},
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var d models.ChartDatasets

			assert.Equal(t, request{
				from:         types.CivilDateToday().YearMonth().String(),
				method:       "GET",
				responseType: &d,
				session:      tc.session,
				to:           types.CivilDateToday().YearMonth().String(),
				uri:          fmt.Sprintf("/charts/datasets/%s/%d", seed.AuthHouseholds[0].ID, tc.datasetType),
			}.do().Error(), tc.err)

			assert.Equal(t, d, tc.want)
		})
	}
}
