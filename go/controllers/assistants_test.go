package controllers

import (
	"strconv"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestGetAssistantResponse(t *testing.T) {
	logger.UseTestLogger(t)

	actx := models.SetAuthAccountID(ctx, seed.AuthAccounts[0].ID)
	actx = setPermissions(actx, models.PermissionsOpts{
		AuthAccountID:          &seed.AuthAccounts[0].ID,
		AuthAccountPermissions: &models.Permissions{},
		AuthHouseholdsPermissions: &models.AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
				Permissions:     models.Permissions{},
			},
		},
	})

	tests := map[string]struct {
		wantList   int
		wantSpeech string
	}{
		"ReadAgenda": {
			wantSpeech: "3 recurring transactions, 1 event, 2 meals, and 5 tasks scheduled for today",
		},
		"ReadCalendarEvents": {
			wantSpeech: "Pickup kids, starting at 3:00 PM",
		},
		"ReadCookMealPlans": {
			wantList:   2,
			wantSpeech: "2 scheduled meals for Supper today: Apple Pie, and Chicken Noodle Soup",
		},
		"ReadInventoryItems": {
			wantSpeech: "2 of Flour in your inventory",
		},
		"ReadPlanTasks": {
			wantSpeech: "I couldn't find any overdue tasks",
		},
		"ReadShopItems": {
			wantSpeech: "3 shopping items from Janes General Store: 1 loaf sourdough bread, 2 1/2 cups wide egg noodles, and Broom",
			wantList:   3,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			for i, assistant := range []assistantRequest{} {
				t.Run(strconv.Itoa(i), func(t *testing.T) {
					speech, url, list := getAssistantResponse(actx, assistant)

					assert.Contains(t, speech, tc.wantSpeech)
					assert.Equal(t, url, "")
					assert.Equal(t, len(list), tc.wantList)
				})
			}
		})
	}
}
