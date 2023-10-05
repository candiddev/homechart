package models

import (
	"context"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// Change is an change log entry for the UI to display.
type Change struct {
	AuthAccountID   uuid.UUID                  `db:"auth_account_id" json:"authAccountID"`
	AuthHouseholdID uuid.UUID                  `db:"auth_household_id" json:"authHouseholdID"`
	Created         time.Time                  `db:"created" format:"date-time" json:"created"`
	ID              uuid.UUID                  `db:"id" json:"id"`
	Name            string                     `db:"name" json:"name"`
	TableName       string                     `db:"table_name" json:"tableName"`
	Operation       types.TableNotifyOperation `db:"operation" json:"operation"`
	Updated         time.Time                  `db:"updated" format:"date-time" json:"updated"`
} // @Name Change

// IsPermitted checks if a permissions allow a change to be viewed.
func (c *Change) IsPermitted(permissions AuthHouseholdsPermissions) bool {
	p := permissions.Get(&c.AuthHouseholdID)
	if p == nil {
		return false
	}

	var pc PermissionComponent

	switch c.TableName {
	case tableNames[modelBudgetAccount]:
		fallthrough
	case tableNames[modelBudgetCategory]:
		fallthrough
	case tableNames[modelBudgetRecurrence]:
		fallthrough
	case tableNames[modelBudgetPayee]:
		fallthrough
	case tableNames[modelBudgetTransaction]:
		pc = PermissionComponentBudget
	case tableNames[modelCalendarEvent]:
		pc = PermissionComponentCalendar
	case tableNames[modelCookMealPlan]:
		fallthrough
	case tableNames[modelCookMealTime]:
		fallthrough
	case tableNames[modelCookRecipe]:
		pc = PermissionComponentCook
	case tableNames[modelHealthItem]:
		fallthrough
	case tableNames[modelHealthLog]:
		pc = PermissionComponentAuth
	case tableNames[modelInventoryCollection]:
		fallthrough
	case tableNames[modelInventoryItem]:
		pc = PermissionComponentInventory
	case tableNames[modelNotesPage]:
		fallthrough
	case tableNames[modelNotesPageVersion]:
		pc = PermissionComponentNotes
	case tableNames[modelPlanProject]:
		fallthrough
	case tableNames[modelPlanTask]:
		pc = PermissionComponentPlan
	case tableNames[modelRewardCard]:
		pc = PermissionComponentReward
	case tableNames[modelSecretsValue]:
		fallthrough
	case tableNames[modelSecretsVault]:
		pc = PermissionComponentSecrets
	case tableNames[modelShopCategory]:
		fallthrough
	case tableNames[modelShopItem]:
		fallthrough
	case tableNames[modelShopList]:
		pc = PermissionComponentShop
	}

	return p.IsPermitted(pc, PermissionView, false)
}

func (c *Change) SetID(id uuid.UUID) {
	c.ID = id
}

func (*Change) create(_ context.Context, _ CreateOpts) errs.Err {
	return nil
}

func (*Change) getChange(_ context.Context) string {
	return ""
}

func (c *Change) getIDs() (_, authHouseholdID, id *uuid.UUID) { //nolint:unparam
	return nil, &c.AuthHouseholdID, &c.ID
}

func (*Change) getType() modelType {
	return modelChange
}

func (c *Change) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		c.AuthHouseholdID = *authHouseholdID
	}
}

func (*Change) update(_ context.Context, _ UpdateOpts) errs.Err {
	return nil
}

// ChangeCreate adds a change to the database.
func ChangeCreate(ctx context.Context, operation types.TableNotifyOperation, m Model) {
	ctx = logger.Trace(ctx)

	aa := GetAuthAccountID(ctx)

	_, ah, _ := m.getIDs()
	change := m.getChange(ctx)

	if change == "" || aa == uuid.Nil || ah == nil {
		return
	}

	a := Change{
		AuthAccountID:   aa,
		AuthHouseholdID: *ah,
		ID:              GenerateUUID(),
		Name:            change,
		Operation:       operation,
		TableName:       tableNames[m.getType()],
	}

	a.ID = GenerateUUID()

	err := db.Query(ctx, false, &a, `
INSERT INTO change (
	  auth_account_id
	, auth_household_id
	, id
	, name
	, operation
	, table_name
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :id
	, :name
	, :operation
	, :table_name
)
RETURNING *
`, &a)

	logger.Error(ctx, err) //nolint:errcheck
}

// Filter is used to filter changes after they are read.
func (ch Changes) Filter(permissions AuthHouseholdsPermissions) Changes {
	n := Changes{}

	for i := range ch {
		if ch[i].IsPermitted(permissions) {
			n = append(n, ch[i])
		}
	}

	return n
}

// Changes is multiple Change.
type Changes []Change

func (*Changes) getType() modelType {
	return modelChange
}
