// Package metrics contains metrics for Homechart.
package metrics

import (
	"github.com/candiddev/shared/go/metrics"
	"github.com/prometheus/client_golang/prometheus"
)

//nolint:gochecknoglobals
var (
	ControllerAssistantTotal *prometheus.CounterVec
	ModelAuthAccount         *prometheus.GaugeVec
	ModelAuthHousehold       *prometheus.GaugeVec
	ModelAuthSession         *prometheus.GaugeVec
	ModelBookmark            *prometheus.GaugeVec
	ModelBudgetAccount       *prometheus.GaugeVec
	ModelBudgetCategory      *prometheus.GaugeVec
	ModelBudgetPayee         *prometheus.GaugeVec
	ModelBudgetTransaction   *prometheus.GaugeVec
	ModelCalendarEvent       *prometheus.GaugeVec
	ModelChange              *prometheus.GaugeVec
	ModelCloudBackup         *prometheus.GaugeVec
	ModelCookMealPlan        *prometheus.GaugeVec
	ModelCookMealTime        *prometheus.GaugeVec
	ModelCookRecipe          *prometheus.GaugeVec
	ModelHealthItem          *prometheus.GaugeVec
	ModelHealthLog           *prometheus.GaugeVec
	ModelInventoryCollection *prometheus.GaugeVec
	ModelInventoryItem       *prometheus.GaugeVec
	ModelNotesPage           *prometheus.GaugeVec
	ModelNotesPageVersion    *prometheus.GaugeVec
	ModelNotification        *prometheus.GaugeVec
	ModelPlanProject         *prometheus.GaugeVec
	ModelPlanTask            *prometheus.GaugeVec
	ModelRewardCard          *prometheus.GaugeVec
	ModelSecretsValue        *prometheus.GaugeVec
	ModelSecretsVault        *prometheus.GaugeVec
	ModelShopCategory        *prometheus.GaugeVec
	ModelShopItem            *prometheus.GaugeVec
	ModelShopList            *prometheus.GaugeVec
)

// Setup initializes metrics.
func Setup() {
	metrics.Setup("homechart")

	ControllerAssistantTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Help: "Controller assistant requests",
			Name: "homechart_controller_assistant_total",
		},
		[]string{"type", "assistant"},
	)
	prometheus.MustRegister(ControllerAssistantTotal)

	ModelAuthAccount = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauage of AuthAccounts",
			Name: "homechart_model_auth_account",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelAuthAccount)

	ModelAuthHousehold = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of AuthHouseholds",
			Name: "homechart_model_auth_household",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelAuthHousehold)

	ModelAuthSession = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of AuthSessions",
			Name: "homechart_model_auth_session",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelAuthSession)

	ModelBookmark = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of Bookmarks",
			Name: "homechart_model_bookmark",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelBookmark)

	ModelBudgetAccount = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of BudgetAccounts",
			Name: "homechart_model_budget_account",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelBudgetAccount)

	ModelBudgetCategory = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of BudgetCategories",
			Name: "homechart_model_budget_category",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelBudgetCategory)

	ModelBudgetPayee = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of BudgetPayees",
			Name: "homechart_model_budget_payee",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelBudgetPayee)

	ModelBudgetTransaction = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of BudgetTransactions",
			Name: "homechart_model_budget_transaction",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelBudgetTransaction)

	ModelCalendarEvent = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of CalendarEvents",
			Name: "homechart_model_calendar_event",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelCalendarEvent)

	ModelChange = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of Changes",
			Name: "homechart_change",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelChange)

	ModelCloudBackup = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of CloudBackups",
			Name: "homechart_cloud_backup",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelCloudBackup)

	ModelCookMealPlan = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of CookMealPlan",
			Name: "homechart_model_cook_meal_plan",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelCookMealPlan)

	ModelCookMealTime = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of CookMealTimes",
			Name: "homechart_model_cook_meal_time",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelCookMealTime)

	ModelCookRecipe = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of CookRecipes",
			Name: "homechart_model_cook_recipe",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelCookRecipe)

	ModelHealthItem = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of HealthItems",
			Name: "homechart_model_health_item",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelHealthItem)

	ModelHealthLog = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of HealthLogs",
			Name: "homechart_model_health_log",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelHealthLog)

	ModelInventoryCollection = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of InventoryCollections",
			Name: "homechart_model_inventory_collection",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelInventoryCollection)

	ModelInventoryItem = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of InventoryItems",
			Name: "homechart_model_inventory_item",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelInventoryItem)

	ModelNotesPage = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of NotesPages",
			Name: "homechart_model_notes_page",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelNotesPage)

	ModelNotesPageVersion = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of NotesPageVersions",
			Name: "homechart_model_notes_page_version",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelNotesPageVersion)

	ModelNotification = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of Notifications",
			Name: "homechart_model_notification",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelNotification)

	ModelPlanProject = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of PlanProjects",
			Name: "homechart_model_plan_project",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelPlanProject)

	ModelPlanTask = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of PlanTasks",
			Name: "homechart_model_plan_task",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelPlanTask)

	ModelRewardCard = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of RewardCards",
			Name: "homechart_model_reward_card",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelRewardCard)

	ModelSecretsValue = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of SecretsValues",
			Name: "homechart_model_secrets_value",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelSecretsValue)

	ModelSecretsVault = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of SecretsVaults",
			Name: "homechart_model_secrets_vault",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelSecretsVault)

	ModelShopCategory = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of ShopCategory",
			Name: "homechart_model_shop_category",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelShopCategory)

	ModelShopItem = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of ShopItems",
			Name: "homechart_model_shop_item",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelShopItem)

	ModelShopList = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Gauge of ShopLists",
			Name: "homechart_model_shop_list",
		},
		[]string{"type"},
	)
	prometheus.MustRegister(ModelShopList)
}
