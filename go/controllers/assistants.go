package controllers

import (
	"context"
	"fmt"
	"strings"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

type assistantRequest interface {
	budgetPayeeName() string
	cookMealTimeName() string
	date(context.Context) (date types.CivilDate, dateOriginal string)
	intent() string
	inventoryItemName() string
	next() bool
	overdue() bool
	timeZone(context.Context) string
}

func getAssistantResponse(ctx context.Context, request assistantRequest) (speech string, url string, list []string) {
	aa := models.GetAuthAccountID(ctx)
	p := getPermissions(ctx)

	switch request.intent() {
	case "ReadAgenda":
		date, dateOriginal := request.date(ctx)

		speech = models.AuthAccountReadAgendaAssistant(ctx, &aa, date, dateOriginal)
	case "ReadCalendarEvents":
		var next bool

		date, dateOriginal := request.date(ctx)

		next = request.next()

		speech, url, list = models.CalendarEventsReadAssistant(ctx, p, date, dateOriginal, request.timeZone(ctx), next, models.GetISO639Code(ctx))
	case "ReadCookMealPlans":
		cookMealName := request.cookMealTimeName()
		date, dateOriginal := request.date(ctx)

		speech, url, list = models.CookMealPlansReadAssistant(ctx, p, date, dateOriginal, cookMealName)
	case "ReadInventoryItems":
		inventoryItemName := request.inventoryItemName()

		speech = models.InventoryItemsReadAssistant(ctx, p, inventoryItemName)
	case "ReadPlanTasks":
		date, dateOriginal := request.date(ctx)
		overdue := request.overdue()

		speech, url, list = models.PlanTasksReadAssistant(ctx, p, date, dateOriginal, request.timeZone(ctx), overdue)
	case "ReadShopItems":
		var budgetPayeeName string
		if paramBudgetPayeeName := request.budgetPayeeName(); strings.ToLower(paramBudgetPayeeName) != "the store" && strings.ToLower(paramBudgetPayeeName) != "homechart" {
			budgetPayeeName = paramBudgetPayeeName
		}

		speech, url, list = models.ShopItemsReadAssistant(ctx, p, budgetPayeeName)
	default:
		logger.Log(ctx, errs.NewServerErr(fmt.Errorf("unknown intent: %s", request.intent()))) //nolint:errcheck
	}

	return speech, url, list
}
