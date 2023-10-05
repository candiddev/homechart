package models

import (
	"context"
	"fmt"

	"github.com/candiddev/homechart/go/metrics"
	"github.com/candiddev/shared/go/logger"
)

// Counts is used by metrics.
type Counts struct {
	AuthAccountCountAll             int `db:"auth_account_count_all"`
	AuthAccountCountDaily           int `db:"auth_account_count_daily"`
	AuthAccountCountVerified        int `db:"auth_account_count_verified"`
	AuthHouseholdCountAll           int `db:"auth_household_count_all"`
	AuthHouseholdCountExpired       int `db:"auth_household_count_expired"`
	AuthHouseholdCountLifetime      int `db:"auth_household_count_lifetime"`
	AuthHouseholdCountMonthlyPaddle int `db:"auth_household_count_monthly_paddle"`
	AuthHouseholdCountSelfHosted    int `db:"auth_household_count_self_hosted"`
	AuthHouseholdCountSubscribers   int `db:"auth_household_count_subscribers"`
	AuthSessionCountAll             int `db:"auth_session_count_all"`
	AuthSessionCountAPI             int `db:"auth_session_count_api"`
	AuthSessionCountChrome          int `db:"auth_session_count_chrome"`
	AuthSessionCountEdge            int `db:"auth_session_count_edge"`
	AuthSessionCountFirefox         int `db:"auth_session_count_firefox"`
	AuthSessionCountSafari          int `db:"auth_session_count_safari"`
	AuthSessionCountUnknown         int `db:"auth_session_count_unknown"`
}

type pgclass struct {
	Name   string `db:"relname"`
	Tuples int    `db:"reltuples"`
}

// CountsRead returns a count of interesting models.
func CountsRead(ctx context.Context) {
	ctx = logger.Trace(ctx)

	var counts Counts

	if err := db.Query(ctx, false, &counts, fmt.Sprintf(`
SELECT
	  COUNT(*) FILTER (
			WHERE email_address NOT LIKE '%%example.com%%'
		) AS auth_account_count_all
	, COUNT(*) FILTER (
			WHERE email_address NOT LIKE '%%example.com%%'
			AND (last_activity at time zone '%[1]s')::date = (now() at time zone '%[1]s')::date
		) AS auth_account_count_daily
	, COUNT(*) FILTER (
			WHERE email_address NOT LIKE '%%example.com%%'
			AND verified = true
		) AS auth_account_count_verified
FROM auth_account
`, c.App.CounterTimeZone), nil); err != nil {
		logger.Error(ctx, err) //nolint:errcheck
	}

	metrics.ModelAuthAccount.WithLabelValues("all").Set(float64(counts.AuthAccountCountAll))
	metrics.ModelAuthAccount.WithLabelValues("daily").Set(float64(counts.AuthAccountCountDaily))
	metrics.ModelAuthAccount.WithLabelValues("verified").Set(float64(counts.AuthAccountCountVerified))

	if err := db.Query(ctx, false, &counts, `
SELECT
	  COUNT(*) FILTER (
			WHERE NOT demo
		) AS auth_household_count_all
	, COUNT(*) FILTER (
			WHERE NOT demo
			AND subscription_expires < CURRENT_DATE
			AND subscription_processor = 0
		) AS auth_household_count_expired
	, COUNT(*) FILTER (
			WHERE subscription_expires > CURRENT_DATE
			AND subscription_processor = $1
		) AS auth_household_count_lifetime
	, COUNT(*) FILTER (
			WHERE subscription_expires > CURRENT_DATE
			AND subscription_processor = $2
		) AS auth_household_count_monthly_paddle
	, COUNT(*) FILTER (
			WHERE subscription_expires > CURRENT_DATE
			AND subscription_processor > 0
		) AS auth_household_count_subscribers
	, COUNT(*) FILTER (
			WHERE NOT demo
			AND self_hosted_id IS NOT NULL
		) AS auth_household_count_self_hosted
FROM auth_household
`, nil, AuthHouseholdSubscriptionProcessorPaddleLifetime, AuthHouseholdSubscriptionProcessorPaddleMonthly); err != nil {
		logger.Error(ctx, err) //nolint:errcheck
	}

	metrics.ModelAuthHousehold.WithLabelValues("all").Set(float64(counts.AuthHouseholdCountAll))
	metrics.ModelAuthHousehold.WithLabelValues("lifetime").Set(float64(counts.AuthHouseholdCountLifetime))
	metrics.ModelAuthHousehold.WithLabelValues("monthly_paddle").Set(float64(counts.AuthHouseholdCountMonthlyPaddle))
	metrics.ModelAuthHousehold.WithLabelValues("expired").Set(float64(counts.AuthHouseholdCountExpired))
	metrics.ModelAuthHousehold.WithLabelValues("self_hosted").Set(float64(counts.AuthHouseholdCountSelfHosted))
	metrics.ModelAuthHousehold.WithLabelValues("subscribers").Set(float64(counts.AuthHouseholdCountSubscribers))

	if err := db.Query(ctx, false, &counts, `
SELECT
	  COUNT(*) AS auth_session_count_all
	, COUNT(*) FILTER (
			WHERE user_agent = 'unknown'
		) AS auth_session_count_unknown
	, COUNT(*) FILTER (
			WHERE user_agent = 'api'
		) AS auth_session_count_api
	, COUNT(*) FILTER (
			WHERE user_agent = 'chrome'
		) AS auth_session_count_chrome
	, COUNT(*) FILTER (
			WHERE user_agent = 'edge'
		) AS auth_session_count_edge
	, COUNT(*) FILTER (
			WHERE user_agent = 'firefox'
		) AS auth_session_count_firefox
	, COUNT(*) FILTER (
			WHERE user_agent = 'safari'
		) AS auth_session_count_safari
FROM auth_session
`, nil); err != nil {
		logger.Error(ctx, err) //nolint:errcheck
	}

	metrics.ModelAuthSession.WithLabelValues("all").Set(float64(counts.AuthSessionCountAll))
	metrics.ModelAuthSession.WithLabelValues("api").Set(float64(counts.AuthSessionCountChrome))
	metrics.ModelAuthSession.WithLabelValues("chrome").Set(float64(counts.AuthSessionCountChrome))
	metrics.ModelAuthSession.WithLabelValues("edge").Set(float64(counts.AuthSessionCountEdge))
	metrics.ModelAuthSession.WithLabelValues("firefox").Set(float64(counts.AuthSessionCountFirefox))
	metrics.ModelAuthSession.WithLabelValues("safari").Set(float64(counts.AuthSessionCountSafari))
	metrics.ModelAuthSession.WithLabelValues("unknown").Set(float64(counts.AuthSessionCountUnknown))

	modelCounts := []pgclass{}

	if err := db.Query(ctx, true, &modelCounts, "SELECT relname, reltuples FROM pg_class", nil); err != nil {
		logger.Error(ctx, err) //nolint:errcheck
	}

	for _, count := range modelCounts {
		switch count.Name {
		case "bookmark":
			metrics.ModelBookmark.WithLabelValues("all").Set(float64(count.Tuples))
		case "budget_account":
			metrics.ModelBudgetAccount.WithLabelValues("all").Set(float64(count.Tuples))
		case "budget_category":
			metrics.ModelBudgetCategory.WithLabelValues("all").Set(float64(count.Tuples))
		case "budget_payee":
			metrics.ModelBudgetPayee.WithLabelValues("all").Set(float64(count.Tuples))
		case "budget_transaction":
			metrics.ModelBudgetTransaction.WithLabelValues("all").Set(float64(count.Tuples))
		case "calendar_event":
			metrics.ModelCalendarEvent.WithLabelValues("all").Set(float64(count.Tuples))
		case "change":
			metrics.ModelChange.WithLabelValues("all").Set(float64(count.Tuples))
		case "cloud_backup":
			metrics.ModelCloudBackup.WithLabelValues("all").Set(float64(count.Tuples))
		case "cook_meal_plan":
			metrics.ModelCookMealPlan.WithLabelValues("all").Set(float64(count.Tuples))
		case "cook_meal_time":
			metrics.ModelCookMealTime.WithLabelValues("all").Set(float64(count.Tuples))
		case "cook_recipe":
			metrics.ModelCookRecipe.WithLabelValues("all").Set(float64(count.Tuples))
		case "health_item":
			metrics.ModelHealthItem.WithLabelValues("all").Set(float64(count.Tuples))
		case "health_log":
			metrics.ModelHealthLog.WithLabelValues("all").Set(float64(count.Tuples))
		case "inventory_collection":
			metrics.ModelInventoryCollection.WithLabelValues("all").Set(float64(count.Tuples))
		case "inventory_item":
			metrics.ModelInventoryItem.WithLabelValues("all").Set(float64(count.Tuples))
		case "notes_page":
			metrics.ModelNotesPage.WithLabelValues("all").Set(float64(count.Tuples))
		case "notes_page_version":
			metrics.ModelNotesPageVersion.WithLabelValues("all").Set(float64(count.Tuples))
		case "notification":
			metrics.ModelNotification.WithLabelValues("all").Set(float64(count.Tuples))
		case "plan_project":
			metrics.ModelPlanProject.WithLabelValues("all").Set(float64(count.Tuples))
		case "plan_task":
			metrics.ModelPlanTask.WithLabelValues("all").Set(float64(count.Tuples))
		case "reward_card":
			metrics.ModelRewardCard.WithLabelValues("all").Set(float64(count.Tuples))
		case "shop_category":
			metrics.ModelShopCategory.WithLabelValues("all").Set(float64(count.Tuples))
		case "shop_item":
			metrics.ModelShopItem.WithLabelValues("all").Set(float64(count.Tuples))
		case "shop_list":
			metrics.ModelShopList.WithLabelValues("all").Set(float64(count.Tuples))
		}
	}

	logger.Error(ctx, nil) //nolint:errcheck
}

// CountsReset resets count values.
func CountsReset(ctx context.Context) {
	metrics.ModelAuthAccount.Reset()
	metrics.ModelAuthHousehold.Reset()
	metrics.ModelAuthSession.Reset()
	metrics.ModelBookmark.Reset()
	metrics.ModelBudgetAccount.Reset()
	metrics.ModelBudgetCategory.Reset()
	metrics.ModelBudgetPayee.Reset()
	metrics.ModelBudgetTransaction.Reset()
	metrics.ModelCalendarEvent.Reset()
	metrics.ModelCloudBackup.Reset()
	metrics.ModelCookMealPlan.Reset()
	metrics.ModelCookMealTime.Reset()
	metrics.ModelCookRecipe.Reset()
	metrics.ModelHealthItem.Reset()
	metrics.ModelHealthLog.Reset()
	metrics.ModelInventoryCollection.Reset()
	metrics.ModelInventoryItem.Reset()
	metrics.ModelNotesPage.Reset()
	metrics.ModelNotesPageVersion.Reset()
	metrics.ModelNotification.Reset()
	metrics.ModelPlanProject.Reset()
	metrics.ModelPlanTask.Reset()
	metrics.ModelRewardCard.Reset()
	metrics.ModelShopCategory.Reset()
	metrics.ModelShopItem.Reset()
	metrics.ModelShopList.Reset()

	logger.Error(ctx, nil) //nolint:errcheck
}
