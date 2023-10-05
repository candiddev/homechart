package models

import (
	"context"
	"fmt"
	"time"

	"github.com/candiddev/homechart/go/templates"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// CookMealPlan defines meal plan fields.
type CookMealPlan struct {
	AuthAccountID        *uuid.UUID        `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	CookRecipeID         *uuid.UUID        `db:"cook_recipe_id" format:"uuid" json:"cookRecipeID"`
	NotificationTimeCook *time.Time        `db:"notification_time_cook" format:"date-time" json:"notificationTimeCook"`
	NotificationTimePrep *time.Time        `db:"notification_time_prep" format:"date-time" json:"notificationTimePrep"`
	Created              time.Time         `db:"created" format:"date-time" json:"created"`
	Updated              time.Time         `db:"updated" format:"date-time" json:"updated"`
	AuthHouseholdID      uuid.UUID         `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	CookMealTimeID       uuid.UUID         `db:"cook_meal_time_id" format:"uuid" json:"cookMealTimeID"`
	ID                   uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Date                 types.CivilDate   `db:"date" format:"date" json:"date" swaggertype:"string"`
	Time                 types.CivilTime   `db:"time" format:"time" json:"time" swaggertype:"string"`
	CookRecipeName       string            `db:"cook_recipe_name" json:"-"`
	CookRecipeScale      string            `db:"cook_recipe_scale" json:"cookRecipeScale"`
	CustomRecipe         types.StringLimit `db:"custom_recipe" json:"customRecipe"`
} // @Name CookMealPlan

func (c *CookMealPlan) SetID(id uuid.UUID) {
	c.ID = id
}

func (c *CookMealPlan) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Set fields
	c.ID = GenerateUUID()
	if c.CookRecipeID != nil && c.CookRecipeScale == "" {
		c.CookRecipeScale = "1"
	}

	return logger.Error(ctx, db.Query(ctx, false, c, `
INSERT INTO cook_meal_plan (
	  auth_account_id
	, auth_household_id
	, cook_meal_time_id
	, cook_recipe_id
	, cook_recipe_scale
	, custom_recipe
	, date
	, id
	, notification_time_cook
	, notification_time_prep
	, time
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :cook_meal_time_id
	, :cook_recipe_id
	, :cook_recipe_scale
	, :custom_recipe
	, :date
	, :id
	, :notification_time_cook
	, :notification_time_prep
	, :time
)
RETURNING *
`, c))
}

func (c *CookMealPlan) getChange(ctx context.Context) string {
	if c.CookRecipeID != nil {
		r := CookRecipe{
			AuthHouseholdID: c.AuthHouseholdID,
			ID:              *c.CookRecipeID,
		}

		err := Read(ctx, &r, ReadOpts{})
		if err != nil {
			return ""
		}

		return string(r.Name)
	}

	return string(c.CustomRecipe)
}

func (c *CookMealPlan) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &c.AuthHouseholdID, &c.ID
}

func (*CookMealPlan) getType() modelType {
	return modelCookMealPlan
}

func (c *CookMealPlan) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		c.AuthHouseholdID = *authHouseholdID
	}
}

func (c *CookMealPlan) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Error(ctx, db.Query(ctx, false, c, `
UPDATE cook_meal_plan
SET
	  auth_account_id = :auth_account_id
	, cook_meal_time_id = :cook_meal_time_id
	, cook_recipe_id = :cook_recipe_id
	, cook_recipe_scale = :cook_recipe_scale
	, custom_recipe = :custom_recipe
	, date = :date
	, notification_time_cook = :notification_time_cook
	, notification_time_prep = :notification_time_prep
	, time = :time
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, c))
}

// CookMealPlans contains multiple CookMealPlan.
type CookMealPlans []CookMealPlan

func (*CookMealPlans) getType() modelType {
	return modelCookMealPlan
}

// CookMealPlansDelete deletes old CookMealPlans from a database.
func CookMealPlansDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf("DELETE FROM cook_meal_plan WHERE date < CURRENT_DATE - INTERVAL '%d day'", c.App.KeepCookMealPlanDays)

	logger.Error(ctx, db.Exec(ctx, query, nil)) //nolint:errcheck
}

// CookMealPlansReadAssistant reads all plans for an Assistant and returns a text prompt.
func CookMealPlansReadAssistant(ctx context.Context, p PermissionsOpts, date types.CivilDate, dateOriginal, cookMealName string) (speech, link string, list []string) {
	ctx = logger.Trace(ctx)

	f, err := getFilter(ctx, &CookMealPlan{}, p)
	if err != nil {
		return speechForbidden, "", []string{}
	}

	filter := map[string]any{
		"auth_household_ids": f.AuthHouseholdIDs,
		"date":               date,
		"cook_meal_name":     cookMealName,
	}

	var meals []string

	err = db.Query(ctx, true, &meals, `
SELECT
	CASE
		WHEN cook_meal_plan.custom_recipe != ''
			THEN cook_meal_plan.custom_recipe
		ELSE
			cook_recipe.name
	END as name
FROM cook_meal_plan
LEFT JOIN cook_meal_time ON cook_meal_plan.cook_meal_time_id = cook_meal_time.id
LEFT JOIN cook_recipe ON cook_meal_plan.cook_recipe_id = cook_recipe.id
WHERE
	cook_meal_plan.auth_household_id = ANY(:auth_household_ids)
	AND cook_meal_plan.date = :date
	AND lower(cook_meal_time.name) = lower(:cook_meal_name)
ORDER BY name ASC
`, filter)

	return toSpeechList(err, meals, fmt.Sprintf("for %s %s", cookMealName, getDateOriginal(dateOriginal, true)), "scheduled meal", "/calendar")
}

// CookMealPlansReadNotifications reads all CookMealPlans ready for notification.
func CookMealPlansReadNotifications(ctx context.Context) (Notifications, error) {
	ctx = logger.Trace(ctx)

	p := CookMealPlans{}
	n := Notifications{}

	err := db.Query(ctx, true, &p, `
WITH old AS (
	SELECT
		  id
		, cook_recipe_id
		, notification_time_cook
		, notification_time_prep
	FROM cook_meal_plan
	WHERE cook_meal_plan.notification_time_cook <= NOW()
	OR cook_meal_plan.notification_time_prep <= NOW()
	ORDER BY cook_meal_plan.created
)
UPDATE cook_meal_plan
SET
	notification_time_cook =
		CASE WHEN DATE_TRUNC('minute', cook_meal_plan.notification_time_cook) <= DATE_TRUNC('minute', NOW())
		THEN
			NULL
		ELSE
			cook_meal_plan.notification_time_cook
		END,
	notification_time_prep =
		CASE WHEN DATE_TRUNC('minute', cook_meal_plan.notification_time_prep) <= DATE_TRUNC('minute', NOW())
		THEN
			NULL
		ELSE
			cook_meal_plan.notification_time_prep
		END
FROM old
LEFT JOIN cook_recipe
ON old.cook_recipe_id = cook_recipe.id
WHERE cook_meal_plan.id = old.id
AND date_trunc('minute', cook_meal_plan.notification_time_cook) <= DATE_TRUNC('minute', NOW())
OR date_trunc('minute', cook_meal_plan.notification_time_prep) <= DATE_TRUNC('minute', NOW())
RETURNING
	  cook_recipe.name AS cook_recipe_name
	, cook_meal_plan.auth_account_id
	, cook_meal_plan.auth_household_id
	, cook_meal_plan.cook_recipe_id
	, cook_meal_plan.cook_recipe_scale
	, old.notification_time_cook
	, old.notification_time_prep
`, nil)

	if err != nil {
		return n, logger.Error(ctx, err)
	}

	for i := range p {
		now := time.Now()
		url := fmt.Sprintf("/cook/recipes/%s?scale=%s", p[i].CookRecipeID, p[i].CookRecipeScale)
		a := notify.WebPushActions{
			Default:    url,
			Target:     p[i].CookRecipeID.String(),
			TargetType: tableNames[modelCookRecipe],
			Types: []notify.WebPushActionType{
				NotificationActionsTypesSnooze,
			},
		}

		if p[i].NotificationTimeCook != nil && p[i].NotificationTimeCook.Before(now) {
			nsC := AuthAccountsReadNotifications(ctx, p[i].AuthAccountID, &p[i].AuthHouseholdID, AuthAccountNotifyTypeMealPlanCook)
			for j := range nsC {
				nsC[j].Actions = a
				nsC[j].BodyWebPush = templates.PushMealPlanReminderBody(nsC[j].ISO639Code, p[i].CookRecipeName)
				nsC[j].BodySMTP = templates.EmailMealPlanReminderCookBody(nsC[j].ISO639Code, p[i].CookRecipeName, c.App.BaseURL+url)
				nsC[j].SubjectWebPush = yaml8n.EmailPushMealPlanReminderCookSubject.Translate(nsC[j].ISO639Code)
				nsC[j].SubjectSMTP = templates.EmailMealPlanReminderCookSubject(nsC[j].ISO639Code, p[i].CookRecipeName)
			}

			n = append(n, nsC...)
		}

		if p[i].NotificationTimePrep != nil && p[i].NotificationTimePrep.Before(now) {
			nsP := AuthAccountsReadNotifications(ctx, p[i].AuthAccountID, &p[i].AuthHouseholdID, AuthAccountNotifyTypeMealPlanPrep)
			for j := range nsP {
				nsP[j].Actions = a
				nsP[j].BodyWebPush = templates.PushMealPlanReminderBody(nsP[j].ISO639Code, p[i].CookRecipeName)
				nsP[j].BodySMTP = templates.EmailMealPlanReminderPrepBody(nsP[j].ISO639Code, p[i].CookRecipeName, c.App.BaseURL+url)
				nsP[j].SubjectWebPush = yaml8n.EmailPushMealPlanReminderPrepSubject.Translate(nsP[j].ISO639Code)
				nsP[j].SubjectSMTP = templates.EmailMealPlanReminderPrepSubject(nsP[j].ISO639Code, p[i].CookRecipeName)
			}

			n = append(n, nsP...)
		}
	}

	return n, logger.Error(ctx, err)
}
