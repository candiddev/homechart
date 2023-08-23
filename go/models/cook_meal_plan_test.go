package models

import (
	"fmt"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/templates"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
)

func TestCookMealPlanCreate(t *testing.T) {
	logger.UseTestLogger(t)

	tn := GenerateTimestamp()
	c := seed.CookMealPlans[0]
	c.AuthAccountID = &seed.AuthAccounts[0].ID
	c.CookRecipeID = &seed.CookRecipes[1].ID
	c.CookRecipeScale = ""
	c.NotificationTimeCook = &tn
	c.NotificationTimePrep = &tn

	assert.Equal(t, c.create(ctx, CreateOpts{}), nil)

	cs := CookMealPlans{}

	ReadAll(ctx, &cs, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	})

	assert.Equal(t, len(cs), len(seed.CookMealPlans)+1)
	assert.Equal(t, c.CookRecipeScale, "1")

	r := seed.CookRecipes[1]
	r.Updated = time.Time{}
	Read(ctx, &r, ReadOpts{})

	assert.Equal(t, r.CookMealPlanCount, 2)

	Delete(ctx, &c, DeleteOpts{})
}

func TestCookMealPlanDeleteTrigger(t *testing.T) {
	logger.UseTestLogger(t)

	c := seed.CookMealPlans[0]
	c.CookRecipeID = &seed.CookRecipes[1].ID
	c.create(ctx, CreateOpts{})

	Delete(ctx, &c, DeleteOpts{})

	cs := CookMealPlans{}

	ReadAll(ctx, &cs, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	})

	assert.Equal(t, len(cs), len(seed.CookMealPlans))

	r := seed.CookRecipes[1]
	r.Updated = time.Time{}
	Read(ctx, &r, ReadOpts{})

	assert.Equal(t, r.CookMealPlanCount, 1)
}

func TestCookMealPlanUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	d, _ := types.ParseCivilDate("2006-01-02")
	c := seed.CookMealPlans[0]
	c.Date = types.CivilDate{
		Day:   1,
		Month: 1,
		Year:  2019,
	}
	c.create(ctx, CreateOpts{})
	c.AuthAccountID = &seed.AuthAccounts[0].ID
	c.CookRecipeID = &seed.CookRecipes[1].ID
	c.CookMealTimeID = seed.CookMealTimes[1].ID
	c.CookRecipeID = &seed.CookRecipes[1].ID
	c.Date = d
	tn := GenerateTimestamp()
	c.NotificationTimeCook = &tn
	c.NotificationTimePrep = &tn
	c.Time = seed.CookMealPlans[1].Time
	cc := c

	assert.Equal(t, cc.update(ctx, UpdateOpts{}), nil)

	c.Updated = cc.Updated

	assert.Equal(t, cc, c)

	r1 := seed.CookRecipes[0]
	r1.Updated = time.Time{}
	Read(ctx, &r1, ReadOpts{})

	assert.Equal(t, r1.CookMealPlanCount, 1)

	r2 := seed.CookRecipes[1]
	r2.Updated = time.Time{}
	Read(ctx, &r2, ReadOpts{})

	assert.Equal(t, r2.CookMealPlanCount, 2)

	Delete(ctx, &c, DeleteOpts{})
}

func TestCookMealPlansReadAssistant(t *testing.T) {
	logger.UseTestLogger(t)

	got, _, list := CookMealPlansReadAssistant(ctx, PermissionsOpts{
		AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
				Permissions:     Permissions{},
			},
		},
	}, types.CivilDateToday(), "today", "supper")

	assert.Contains(t, got, "I found 2 scheduled meals for supper today: Apple Pie, and Chicken Noodle Soup.")
	assert.Equal(t, len(list), 2)
}

func TestCookMealPlansReadNotifications(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "csrn@example.com"
	aa.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	aaah.create(ctx, CreateOpts{})

	aa.Preferences.NotificationsHouseholds = []AuthAccountPreferencesNotificationsHousehold{
		{
			AuthHouseholdID:             seed.AuthHouseholds[0].ID,
			IgnoreEmailCookMealPlanPrep: true,
		},
	}
	aa.Update(ctx)

	as := seed.AuthSessions[0]
	as.AuthAccountID = aa.ID
	as.WebPush = &notify.WebPushClient{
		Endpoint: "1",
	}
	as.Create(ctx, false)

	tn := GenerateTimestamp()
	c1 := seed.CookMealPlans[0]
	c1.AuthAccountID = &aa.ID
	c1.CookRecipeID = &seed.CookRecipes[1].ID
	c1.CookRecipeScale = "5"
	c1.CustomRecipe = ""
	c1.NotificationTimeCook = &tn
	c1.NotificationTimePrep = &tn
	c1.create(ctx, CreateOpts{})

	c2 := c1
	c2.NotificationTimeCook = nil
	c2.NotificationTimePrep = nil
	c2.create(ctx, CreateOpts{})

	tn = tn.Add(24 * time.Hour)
	c3 := c1
	c3.NotificationTimeCook = &tn
	c3.NotificationTimePrep = nil
	c3.create(ctx, CreateOpts{})

	n, err := CookMealPlansReadNotifications(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(n), 18) // seedmeal1 cook 3, prep 2, seedmeal2 cook 3, prep 2, c1 cook 3, prep 2, 3 webPush
	assert.Equal(t, n[0].SubjectSMTP, templates.EmailMealPlanReminderCookSubject(seed.AuthAccounts[0].ISO639Code, string(seed.CookRecipes[0].Name)))
	assert.Equal(t, n[0].ToSMTP, seed.AuthAccounts[0].EmailAddress.String())
	assert.Equal(t, n[1].ToSMTP, seed.AuthAccounts[1].EmailAddress.String())
	assert.Equal(t, n[2].ToSMTP, aa.EmailAddress.String())
	assert.Contains(t, n[0].BodySMTP, "It's time to start cooking")
	assert.Equal(t, n[0].Actions, notify.WebPushActions{
		Default:    fmt.Sprintf("/cook/recipes/%s?scale=%d", seed.CookRecipes[0].ID, 2),
		Target:     seed.CookRecipes[0].ID.String(),
		TargetType: tableNames[modelCookRecipe],
		Types: []notify.WebPushActionType{
			NotificationActionsTypesSnooze,
		},
	})

	c := CookMealPlan{
		AuthHouseholdID: c3.AuthHouseholdID,
		ID:              c3.ID,
	}

	Read(ctx, &c, ReadOpts{})

	assert.Equal(t, c, c3)

	aa.Delete(ctx)
	Delete(ctx, &c1, DeleteOpts{})
	Delete(ctx, &c2, DeleteOpts{})
	Delete(ctx, &c3, DeleteOpts{})
}

// This needs to be ran AFTER the read tests.
func TestCookMealPlansDelete(t *testing.T) {
	logger.UseTestLogger(t)

	c := seed.CookMealPlans[0]
	d := seed.CookMealPlans[0].Date.AddDays(-366)
	c.CookMealTimeID = seed.CookMealTimes[1].ID
	c.Date = d
	c.create(ctx, CreateOpts{})
	CookMealPlansDelete(ctx)

	cn := CookMealPlans{}

	ReadAll(ctx, &cn, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	})

	assert.Equal(t, len(cn), len(seed.CookMealPlans))
}
