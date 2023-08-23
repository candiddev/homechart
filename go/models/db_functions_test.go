package models

import (
	"fmt"
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestFunctionsCheckRecurrence(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]struct {
		input string
		want  bool
	}{
		"bad - recurrence": {
			input: "2021-08-24",
			want:  false,
		},
		"bad - skip day": {
			input: "2021-08-18",
			want:  false,
		},
		"bad - date end": {
			input: "2021-09-01",
			want:  false,
		},
		"good": {
			input: "2021-08-25",
			want:  true,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			got := false

			assert.Equal(t, db.Query(ctx, false, &got, `
SELECT check_recurrence(
	'2021-08-31',
	'2021-08-01',
	$1,
	'{
		"day": 0,
		"month": 0,
		"monthWeek": 0,
		"separation": 1,
		"weekday": 0,
		"weekdays": [3]
	}',
	'{"2021-08-18"}'
)`, nil, tc.input), nil)
			assert.Equal(t, got, tc.want)
		})
	}
}

func TestFunctionsRecurTimestamp(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]struct {
		inputRange      []string
		inputRecurrence *types.Recurrence
		want            string
	}{
		"every 1 day": {
			inputRange: []string{
				"2020-10-14",
			},
			inputRecurrence: &types.Recurrence{
				Separation: 1,
			},
			want: "2020-10-15",
		},
		"every 2 days": {
			inputRange: []string{
				"2020-10-14",
			},
			inputRecurrence: &types.Recurrence{
				Separation: 2,
			},
			want: "2020-10-16",
		},
		"every 1 week on monday and wednesday": {
			inputRange: []string{
				"2020-10-14",
				"2020-10-18",
			},
			inputRecurrence: &types.Recurrence{
				Separation: 1,
				Weekdays: []types.Weekday{
					3,
					1,
				},
			},
			want: "2020-10-19",
		},
		"every 1 week on tuesday and thursday": {
			inputRange: []string{
				"2020-10-13",
				"2020-10-14",
			},
			inputRecurrence: &types.Recurrence{
				Separation: 1,
				Weekdays: []types.Weekday{
					4,
					2,
				},
			},
			want: "2020-10-15",
		},
		"every 2 weeks on monday and wednesday": {
			inputRange: []string{
				"2020-10-14",
				"2020-10-18",
			},
			inputRecurrence: &types.Recurrence{
				Separation: 2,
				Weekdays: []types.Weekday{
					3,
					1,
				},
			},
			want: "2020-10-26",
		},
		"every 2 weeks on tuesday and thursday": {
			inputRange: []string{
				"2020-10-13",
				"2020-10-14",
			},
			inputRecurrence: &types.Recurrence{
				Separation: 2,
				Weekdays: []types.Weekday{
					4,
					2,
				},
			},
			want: "2020-10-15",
		},
		"every 2 weeks on saturday": {
			inputRange: []string{
				"2020-11-01",
			},
			inputRecurrence: &types.Recurrence{
				Separation: 2,
				Weekdays: []types.Weekday{
					7,
				},
			},
			want: "2020-11-15",
		},
		"every 1 month on day 2": {
			inputRange: []string{
				"2020-10-02",
				"2020-11-01",
			},
			inputRecurrence: &types.Recurrence{
				Day:        2,
				Separation: 1,
			},
			want: "2020-11-02",
		},
		"every 1 month on day 31": {
			inputRange: []string{
				"2020-09-01",
				"2020-09-29",
			},
			inputRecurrence: &types.Recurrence{
				Day:        31,
				Separation: 1,
			},
			want: "2020-09-30",
		},
		"every 2 months on day 2": {
			inputRange: []string{
				"2020-09-02",
				"2020-10-01",
			},
			inputRecurrence: &types.Recurrence{
				Day:        2,
				Separation: 2,
			},
			want: "2020-11-02",
		},
		"every 1 month on first monday": {
			inputRange: []string{
				"2020-09-08",
				"2020-10-04",
			},
			inputRecurrence: &types.Recurrence{
				MonthWeek:  1,
				Separation: 1,
				Weekday:    1,
			},
			want: "2020-10-05",
		},
		"every 1 month on last friday": {
			inputRange: []string{
				"2020-09-25",
				"2020-10-29",
			},
			inputRecurrence: &types.Recurrence{
				MonthWeek:  -1,
				Separation: 1,
				Weekday:    5,
			},
			want: "2020-10-30",
		},
		"every 2 months on second to last thursday": {
			inputRange: []string{
				"2020-09-17",
				"2020-10-21",
			},
			inputRecurrence: &types.Recurrence{
				MonthWeek:  -2,
				Separation: 2,
				Weekday:    4,
			},
			want: "2020-11-19",
		},
		"every 1 year on november 15": {
			inputRange: []string{
				"2019-11-15",
				"2020-11-14",
			},
			inputRecurrence: &types.Recurrence{
				Day:        15,
				Month:      11,
				Separation: 1,
			},
			want: "2020-11-15",
		},
		"every 1 year on november 16": {
			inputRange: []string{
				"2020-11-16",
				"2021-11-15",
			},
			inputRecurrence: &types.Recurrence{
				Day:        16,
				Month:      11,
				Separation: 1,
			},
			want: "2021-11-16",
		},
		"every 2 years on november 15": {
			inputRange: []string{
				"2020-11-15",
				"2021-11-14",
			},
			inputRecurrence: &types.Recurrence{
				Day:        15,
				Month:      11,
				Separation: 2,
			},
			want: "2022-11-15",
		},
		"every 1 year on last friday of october": {
			inputRange: []string{
				"2019-10-25",
				"2020-10-29",
			},
			inputRecurrence: &types.Recurrence{
				Month:      10,
				MonthWeek:  -1,
				Separation: 1,
				Weekday:    5,
			},
			want: "2020-10-30",
		},
		"every 1 year on first monday of october": {
			inputRange: []string{
				"2020-10-05",
				"2021-10-03",
			},
			inputRecurrence: &types.Recurrence{
				Month:      10,
				MonthWeek:  1,
				Separation: 1,
				Weekday:    1,
			},
			want: "2021-10-04",
		},
		"every 1 year on first sunday of november": {
			inputRange: []string{
				"2020-11-01",
			},
			inputRecurrence: &types.Recurrence{
				Month:      11,
				MonthWeek:  1,
				Separation: 1,
				Weekday:    7,
			},
			want: "2021-11-07",
		},
		"every 2 years on last tuesday of october": {
			inputRange: []string{
				"2020-10-27",
				"2021-10-18",
			},
			inputRecurrence: &types.Recurrence{
				Month:      10,
				MonthWeek:  -1,
				Separation: 2,
				Weekday:    2,
			},
			want: "2022-10-25",
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, tc.inputRecurrence.Validate(), nil)

			for _, input := range tc.inputRange {
				t.Run(fmt.Sprintf("%s: %s", name, input), func(t *testing.T) {
					var output string

					date, _ := types.ParseCivilDate(input)

					db.Query(ctx, false, &output, "select recur_timestamp($1::timestamp, $2)::date::text", nil, date, tc.inputRecurrence)

					assert.Equal(t, output, tc.want)
				})
			}
		})
	}
}
