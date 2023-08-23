package models

import (
	"context"
	"fmt"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// PlanProject defines project fields.
type PlanProject struct {
	AuthAccountID    *uuid.UUID        `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	AuthHouseholdID  *uuid.UUID        `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	BudgetCategoryID *uuid.UUID        `db:"budget_category_id" format:"uuid" json:"budgetCategoryID"`
	ParentID         *uuid.UUID        `db:"parent_id" format:"uuid" json:"parentID"`
	ID               uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Tags             types.Tags        `db:"tags" json:"tags"`
	Created          time.Time         `db:"created" format:"date-time" json:"created"`
	Updated          time.Time         `db:"updated" format:"date-time" json:"updated"`
	PlanTaskCount    int               `db:"plan_task_count" json:"planTaskCount"`
	ShopItemCount    int               `db:"shop_item_count" json:"shopItemCount"`
	ShortID          types.Nanoid      `db:"short_id" json:"shortID"`
	Color            types.Color       `db:"color" json:"color"`
	Icon             types.StringLimit `db:"icon" json:"icon"`
	Name             types.StringLimit `db:"name" json:"name"`
	Position         types.Position    `db:"position" json:"position"`
} // @Name PlanProject

func (t *PlanProject) SetID(id uuid.UUID) {
	t.ID = id
}

func (t *PlanProject) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	t.ID = GenerateUUID()

	if !opts.Restore || t.ShortID == "" {
		t.ShortID = types.NewNanoid()
	}

	return logger.Log(ctx, db.Query(ctx, false, t, `
INSERT INTO plan_project (
	  auth_account_id
	, auth_household_id
	, budget_category_id
	, color
	, icon
	, id
	, name
	, parent_id
	, position
	, short_id
	, tags
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :budget_category_id
	, :color
	, :icon
	, :id
	, :name
	, :parent_id
	, :position
	, :short_id
	, :tags
)
RETURNING *
`, t))
}

func (t *PlanProject) getChange(_ context.Context) string {
	if t.AuthHouseholdID != nil {
		return string(t.Name)
	}

	return ""
}

func (t *PlanProject) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return t.AuthAccountID, t.AuthHouseholdID, &t.ID
}

func (*PlanProject) getType() modelType {
	return modelPlanProject
}

func (t *PlanProject) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
	switch {
	case t.AuthAccountID != nil && authAccountID != nil:
		t.AuthAccountID = authAccountID
	case t.AuthHouseholdID != nil && authHouseholdID != nil:
		t.AuthHouseholdID = authHouseholdID
	default:
		t.AuthAccountID = authAccountID
		t.AuthHouseholdID = authHouseholdID
	}
}

func (t *PlanProject) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
UPDATE plan_project
SET
	  auth_account_id = :auth_account_id
	, auth_household_id = :auth_household_id
	, budget_category_id = :budget_category_id
	, color = :color
	, icon = :icon
	, name = :name
	, parent_id = :parent_id
	, position = :position
	, tags = :tags
WHERE id = :id
AND (
	auth_account_id = '%s'
	OR auth_household_id = ANY('%s')
)
RETURNING *
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs())

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, t, query, t))
}

// PlanProjects is multiple PlanProject.
type PlanProjects []PlanProject

func (*PlanProjects) getType() modelType {
	return modelPlanProject
}
