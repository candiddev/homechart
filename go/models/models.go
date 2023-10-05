// Package models contains database functions for CRUD models.
package models

import (
	"context"
	"database/sql"
	"embed"
	"fmt"
	"hash/crc32"
	"sort"
	"time"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/homechart/go/metrics"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
	"github.com/jmoiron/sqlx"
)

//go:embed migrations/*.sql
var migrations embed.FS

//go:embed triggers/*.sql
var triggers embed.FS

const (
	conditionAccountOnly        = "WHERE auth_account_id = :auth_account_id"
	conditionAccountOrHousehold = `
WHERE (
	(
		auth_account_id IS NOT NULL AND auth_account_id = :auth_account_id
	)
	OR (
		auth_household_id IS NOT NULL
		AND (
			auth_household_id = ANY(:auth_household_ids)
		)
	)
	OR auth_account_id IS NULL AND auth_household_id IS NULL
)`
	conditionAccountAndHouseholdNull = "WHERE (auth_account_id = :auth_account_id AND auth_household_id IS null) OR auth_account_id IS NULL AND auth_household_id IS NULL"
	conditionCookRecipe              = "WHERE (auth_household_id = ANY(:auth_household_ids) OR public)"
	conditionHealthItemDelete        = "USING auth_account " + conditionHealthItemPart + " AND health_item.auth_account_id = auth_account.id"
	conditionHealthItemPart          = `
WHERE (
	auth_account_id = :auth_account_id
	OR (
		auth_account.child
		AND auth_account.primary_auth_household_id = ANY(:auth_household_ids)
	)
)`
	conditionHealthItemRead  = "LEFT JOIN auth_account ON auth_account.id = health_item.auth_account_id" + conditionHealthItemPart
	conditionHealthLogDelete = "USING auth_account " + conditionHealthLogPart + " AND health_log.auth_account_id = auth_account.id"
	conditionHealthLogPart   = `
WHERE (
	auth_account_id = :auth_account_id
	OR (
		auth_account.child
		AND auth_account.primary_auth_household_id = ANY(:auth_household_ids)
	)
)`
	conditionHealthLogRead           = "LEFT JOIN auth_account ON auth_account.id = health_log.auth_account_id" + conditionHealthLogPart
	conditionHouseholdOnly           = "WHERE auth_household_id = ANY(:auth_household_ids)"
	conditionNotesPageVersionAccount = `
LEFT JOIN notes_page ON notes_page.id = notes_page_version.notes_page_id
WHERE notes_page.auth_account_id = :auth_account_id`
	conditionNotesPageVersionHousehold = `
LEFT JOIN notes_page ON notes_page.id = notes_page_version.notes_page_id
WHERE notes_page.auth_household_id = ANY(:auth_household_ids)`
	conditionNotesPageVersionRead = `
LEFT JOIN notes_page ON notes_page.id = notes_page_version.notes_page_id
WHERE (
	(
		notes_page.auth_account_id = :auth_account_id
		AND notes_page.auth_household_id IS NULL
	)
	OR (
		notes_page.auth_account_id IS NULL
		AND notes_page.auth_household_id = ANY(:auth_household_ids)
	)
)`
	conditionNotesPageVersionDelete = `
USING notes_page
WHERE (
	notes_page.auth_account_id = :auth_account_id
	OR notes_page.auth_household_id = ANY(:auth_household_ids)
)
AND notes_page_version.notes_page_id = notes_page.id`
	conditionPlanTaskRead = `
WHERE (
	(
		auth_household_id IS NULL
		AND auth_account_id IS NOT NULL
		AND auth_account_id = :auth_account_id
	)
	OR (
		auth_household_id IS NOT NULL
		AND (
			auth_household_id = ANY(:auth_household_ids)
		)
	)
	OR auth_account_id IS NULL AND auth_household_id IS NULL
)`
	conditionPlanTaskDelete = `
WHERE (
	(
		auth_account_id IS NOT NULL AND auth_account_id = :auth_account_id
	)
	OR (
		auth_household_id IS NOT NULL
		AND (
			auth_household_id = ANY(:auth_household_ids)
		)
	)
	OR (:admin AND auth_account_id IS NULL AND auth_household_id IS NULL)
)`
	conditionRewardCardAccount = `
WHERE auth_household_id = ANY(:auth_household_ids)
AND (
	:auth_account_id = ANY(senders)
	OR array_length(recipients, 1) IS NULL
	OR :auth_account_id = ANY(recipients)
)`
	//nolint: gosec
	conditionSecretsValueAccount = `
LEFT JOIN secrets_vault ON secrets_vault.id = secrets_value.secrets_vault_id
WHERE secrets_vault.auth_account_id = :auth_account_id`
	//nolint: gosec
	conditionSecretsValueHousehold = `
LEFT JOIN secrets_vault ON secrets_vault.id = secrets_value.secrets_vault_id
WHERE secrets_vault.auth_household_id = ANY(:auth_household_ids)`
	//nolint: gosec
	conditionSecretsValueRead = `
LEFT JOIN secrets_vault ON secrets_vault.id = secrets_value.secrets_vault_id
WHERE (
	(
		secrets_vault.auth_account_id = :auth_account_id
		AND secrets_vault.auth_household_id IS NULL
	)
	OR (
		secrets_vault.auth_account_id IS NULL
		AND secrets_vault.auth_household_id = ANY(:auth_household_ids)
	)
)`
	conditionSecretsValueDelete = `
USING secrets_vault
WHERE (
	secrets_vault.auth_account_id = :auth_account_id
	OR secrets_vault.auth_household_id = ANY(:auth_household_ids)
)
AND secrets_value.secrets_vault_id = secrets_vault.id`
	speechForbidden = "Sorry, you don't have access to that.  Try asking for something else."
)

var c *config.Config //nolint:gochecknoglobals

var cloud bool //nolint:gochecknoglobals

var crc = crc32.MakeTable(crc32.IEEE) //nolint:gochecknoglobals

var db DB //nolint:gochecknoglobals

var acknowledgements = []string{ //nolint:gochecknoglobals
	"",
	"Alright",
	"Okay",
	"Got it",
	"Sure",
}

// DB provides an interface into a database provider.
type DB interface {
	BeginTx(ctx context.Context) (*sqlx.Tx, errs.Err)
	Conn(ctx context.Context) (*sql.Conn, error)
	Exec(ctx context.Context, query string, arg any) errs.Err
	Health() error
	Listen(ctx context.Context, f func(context.Context, *types.TableNotify))
	LockAcquire(ctx context.Context, lockID int, conn *sql.Conn) bool
	LockExists(ctx context.Context, lockID int, conn *sql.Conn) bool
	LockRelease(ctx context.Context, lockID int, conn *sql.Conn) bool
	Migrate(ctx context.Context, app string, triggers, migrations embed.FS) errs.Err
	Query(ctx context.Context, multi bool, dest any, query string, argument any, args ...any) errs.Err
}

// ID is a collection of model IDs.
type ID struct {
	ID      uuid.UUID `database:"id" format:"uuid" json:"id"`
	Updated time.Time `database:"updated" format:"date-time" json:"updated"`
} // @Name ID

// Model is a set of common methods for models.
type Model interface {
	SetID(id uuid.UUID)
	create(ctx context.Context, opts CreateOpts) errs.Err
	getChange(ctx context.Context) string
	getIDs() (authAccountID, authHouseholdID, id *uuid.UUID)
	getType() modelType
	setIDs(authAccountID, authHouseholdID *uuid.UUID)
	update(ctx context.Context, opts UpdateOpts) errs.Err
}

// Models is a set of common methods for models.
type Models interface {
	getType() modelType
}

type modelType int

const (
	modelAuthAccountAuthHousehold modelType = iota
	modelBookmark
	modelBudgetAccount
	modelBudgetCategory
	modelBudgetRecurrence
	modelBudgetPayee
	modelBudgetTransaction
	modelBudgetTransactionAccount
	modelBudgetTransactionCategory
	modelCalendarEvent
	modelCalendarICalendar
	modelChange
	modelCookMealPlan
	modelCookMealTime
	modelCookRecipe
	modelHealthItem
	modelHealthLog
	modelInventoryCollection
	modelInventoryItem
	modelNotesPage
	modelNotesPageVersion
	modelNotification
	modelPlanProject
	modelPlanTask
	modelRewardCard
	modelSecretsValue
	modelSecretsVault
	modelShopCategory
	modelShopItem
	modelShopList
)

var conditionsAccount = map[modelType]string{ //nolint:gochecknoglobals
	modelBookmark:          conditionAccountOnly,
	modelCalendarEvent:     conditionAccountOnly,
	modelCalendarICalendar: conditionAccountOnly,
	modelHealthItem:        conditionHealthItemRead,
	modelHealthLog:         conditionHealthLogRead,
	modelNotesPage:         conditionAccountOnly,
	modelNotesPageVersion:  conditionNotesPageVersionAccount,
	modelPlanProject:       conditionAccountOnly,
	modelPlanTask:          conditionAccountAndHouseholdNull,
	modelRewardCard:        conditionRewardCardAccount,
	modelSecretsValue:      conditionSecretsValueAccount,
	modelSecretsVault:      conditionAccountOnly,
	modelShopItem:          conditionAccountOnly,
	modelShopList:          conditionAccountOnly,
}

var conditionsAll = map[modelType]string{ //nolint:gochecknoglobals
	modelAuthAccountAuthHousehold:  conditionAccountOrHousehold,
	modelBookmark:                  conditionAccountOrHousehold,
	modelBudgetAccount:             conditionHouseholdOnly,
	modelBudgetCategory:            conditionHouseholdOnly,
	modelBudgetRecurrence:          conditionHouseholdOnly,
	modelBudgetPayee:               conditionHouseholdOnly,
	modelBudgetTransaction:         conditionHouseholdOnly,
	modelBudgetTransactionAccount:  conditionHouseholdOnly,
	modelBudgetTransactionCategory: conditionHouseholdOnly,
	modelCalendarEvent:             conditionAccountOrHousehold,
	modelCalendarICalendar:         conditionAccountOrHousehold,
	modelChange:                    conditionHouseholdOnly,
	modelCookMealPlan:              conditionHouseholdOnly,
	modelCookMealTime:              conditionHouseholdOnly,
	modelCookRecipe:                conditionHouseholdOnly,
	modelHealthItem:                conditionHealthItemRead,
	modelHealthLog:                 conditionHealthLogRead,
	modelInventoryCollection:       conditionHouseholdOnly,
	modelInventoryItem:             conditionHouseholdOnly,
	modelNotesPage:                 conditionAccountOrHousehold,
	modelNotesPageVersion:          conditionNotesPageVersionRead,
	modelPlanProject:               conditionAccountOrHousehold,
	modelPlanTask:                  conditionPlanTaskRead,
	modelRewardCard:                conditionRewardCardAccount,
	modelSecretsValue:              conditionSecretsValueRead,
	modelSecretsVault:              conditionAccountOrHousehold,
	modelShopCategory:              conditionHouseholdOnly,
	modelShopItem:                  conditionAccountOrHousehold,
	modelShopList:                  conditionAccountOrHousehold,
}

var conditionsDelete = map[modelType]string{ //nolint:gochecknoglobals
	modelHealthItem:       conditionHealthItemDelete,
	modelHealthLog:        conditionHealthLogDelete,
	modelNotesPageVersion: conditionNotesPageVersionDelete,
	modelPlanTask:         conditionPlanTaskDelete,
	modelSecretsValue:     conditionSecretsValueDelete,
}

var conditionsHousehold = map[modelType]string{ //nolint:gochecknoglobals
	modelAuthAccountAuthHousehold: conditionHouseholdOnly,
	modelBookmark:                 conditionHouseholdOnly,
	modelBudgetAccount:            conditionHouseholdOnly,
	modelBudgetCategory:           conditionHouseholdOnly,
	modelBudgetRecurrence:         conditionHouseholdOnly,
	modelBudgetPayee:              conditionHouseholdOnly,
	modelCalendarEvent:            conditionHouseholdOnly,
	modelCalendarICalendar:        conditionHouseholdOnly,
	modelChange:                   conditionHouseholdOnly,
	modelCookMealPlan:             conditionHouseholdOnly,
	modelCookMealTime:             conditionHouseholdOnly,
	modelCookRecipe:               conditionHouseholdOnly,
	modelInventoryCollection:      conditionHouseholdOnly,
	modelInventoryItem:            conditionHouseholdOnly,
	modelNotesPage:                conditionHouseholdOnly,
	modelNotesPageVersion:         conditionNotesPageVersionHousehold,
	modelPlanProject:              conditionHouseholdOnly,
	modelPlanTask:                 conditionHouseholdOnly,
	modelSecretsValue:             conditionSecretsValueHousehold,
	modelSecretsVault:             conditionHouseholdOnly,
	modelShopCategory:             conditionHouseholdOnly,
	modelShopItem:                 conditionHouseholdOnly,
	modelShopList:                 conditionHouseholdOnly,
}

var conditionsRead = map[modelType]string{ //nolint:gochecknoglobals
	modelCookRecipe:       conditionCookRecipe,
	modelHealthItem:       conditionHealthItemRead,
	modelHealthLog:        conditionHealthLogRead,
	modelNotesPageVersion: conditionNotesPageVersionRead,
	modelNotification:     "WHERE id IS NOT NULL",
	modelRewardCard:       conditionHouseholdOnly,
	modelSecretsValue:     conditionSecretsValueRead,
}

var permissions = map[modelType]PermissionComponent{ //nolint:gochecknoglobals
	modelAuthAccountAuthHousehold:  PermissionComponentAuth,
	modelBookmark:                  PermissionComponentAuth,
	modelBudgetAccount:             PermissionComponentBudget,
	modelBudgetCategory:            PermissionComponentBudget,
	modelBudgetRecurrence:          PermissionComponentBudget,
	modelBudgetPayee:               PermissionComponentBudget,
	modelBudgetTransaction:         PermissionComponentBudget,
	modelBudgetTransactionAccount:  PermissionComponentBudget,
	modelBudgetTransactionCategory: PermissionComponentBudget,
	modelCalendarEvent:             PermissionComponentCalendar,
	modelCalendarICalendar:         PermissionComponentCalendar,
	modelChange:                    PermissionComponentAuth,
	modelCookMealPlan:              PermissionComponentCook,
	modelCookMealTime:              PermissionComponentCook,
	modelCookRecipe:                PermissionComponentCook,
	modelHealthItem:                PermissionComponentHealth,
	modelHealthLog:                 PermissionComponentHealth,
	modelInventoryCollection:       PermissionComponentInventory,
	modelInventoryItem:             PermissionComponentInventory,
	modelNotesPage:                 PermissionComponentNotes,
	modelNotesPageVersion:          PermissionComponentNotes,
	modelNotification:              PermissionComponentAuth,
	modelPlanProject:               PermissionComponentPlan,
	modelPlanTask:                  PermissionComponentPlan,
	modelRewardCard:                PermissionComponentReward,
	modelSecretsValue:              PermissionComponentSecrets,
	modelSecretsVault:              PermissionComponentSecrets,
	modelShopCategory:              PermissionComponentShop,
	modelShopItem:                  PermissionComponentShop,
	modelShopList:                  PermissionComponentShop,
}

var tableNames = map[modelType]string{ //nolint:gochecknoglobals
	modelAuthAccountAuthHousehold:  "auth_account_auth_household",
	modelBookmark:                  "bookmark",
	modelBudgetAccount:             "budget_account",
	modelBudgetCategory:            "budget_category",
	modelBudgetRecurrence:          "budget_recurrence",
	modelBudgetPayee:               "budget_payee",
	modelBudgetTransaction:         "budget_transaction",
	modelBudgetTransactionAccount:  "budget_transaction_account",
	modelBudgetTransactionCategory: "budget_transaction_category",
	modelCalendarEvent:             "calendar_event",
	modelCalendarICalendar:         "calendar_icalendar",
	modelChange:                    "change",
	modelCookMealPlan:              "cook_meal_plan",
	modelCookMealTime:              "cook_meal_time",
	modelCookRecipe:                "cook_recipe",
	modelHealthItem:                "health_item",
	modelHealthLog:                 "health_log",
	modelInventoryCollection:       "inventory_collection",
	modelInventoryItem:             "inventory_item",
	modelNotesPage:                 "notes_page",
	modelNotesPageVersion:          "notes_page_version",
	modelNotification:              "notification",
	modelPlanProject:               "plan_project",
	modelPlanTask:                  "plan_task",
	modelRewardCard:                "reward_card",
	modelSecretsValue:              "secrets_value",
	modelSecretsVault:              "secrets_vault",
	modelShopCategory:              "shop_category",
	modelShopItem:                  "shop_item",
	modelShopList:                  "shop_list",
}

// PermissionsOpts are fields used to check permissions.
type PermissionsOpts struct {
	Admin                     bool `db:"admin"`
	AuthAccountID             *uuid.UUID
	AuthAccountPermissions    *Permissions
	AuthHouseholdsPermissions *AuthHouseholdsPermissions
	Permission                Permission
	PrimaryAuthHouseholdID    *uuid.UUID
}

type filter struct {
	Admin            bool        `db:"admin"`
	AuthAccountID    *uuid.UUID  `db:"auth_account_id"`
	AuthHouseholdIDs types.UUIDs `db:"auth_household_ids"`
	ID               *uuid.UUID  `db:"id"`
}

func getFilter(ctx context.Context, m Model, opts PermissionsOpts) (filter, errs.Err) {
	var aa *uuid.UUID

	var ah *uuid.UUID

	f := filter{
		Admin: opts.Admin,
	}

	aa, ah, f.ID = m.getIDs()

	if !opts.Admin && opts.AuthAccountPermissions != nil || opts.AuthHouseholdsPermissions != nil {
		p := permissions[m.getType()]

		if opts.AuthHouseholdsPermissions != nil {
			for i := range *opts.AuthHouseholdsPermissions {
				if (*opts.AuthHouseholdsPermissions)[i].Permissions.IsPermitted(p, opts.Permission, false) {
					f.AuthHouseholdIDs = append(f.AuthHouseholdIDs, (*opts.AuthHouseholdsPermissions)[i].AuthHouseholdID)
				}
			}
		}

		if opts.AuthAccountPermissions != nil && opts.AuthAccountPermissions.IsPermitted(p, opts.Permission, true) {
			f.AuthAccountID = opts.AuthAccountID
		}
	} else {
		f.AuthAccountID = aa

		if ah != nil {
			f.AuthHouseholdIDs = types.UUIDs{
				*ah,
			}
		}
	}

	var err errs.Err

	if f.AuthAccountID == nil && len(f.AuthHouseholdIDs) == 0 && !opts.Admin {
		err = errs.ErrSenderForbidden
	}

	return f, logger.Error(ctx, err)
}

func setIDs(ctx context.Context, m Model, opts PermissionsOpts) errs.Err {
	aaOld, ahOld, _ := m.getIDs()

	aaNew, ahNew, _ := m.getIDs()
	if (ahNew == nil || *ahNew == uuid.Nil) && m.getType() != modelPlanTask { // PlanTask can have a nil AuthAccountID and AuthHouseholdID for global templates
		ahNew = opts.PrimaryAuthHouseholdID
	}

	if (ahOld != nil && *ahOld == uuid.Nil) && m.getType() != modelPlanTask { // PlanTask can have a nil AuthAccountID and AuthHouseholdID for global templates
		ahOld = nil
	}

	if ahOld != nil && opts.AuthHouseholdsPermissions != nil {
		ah := AuthHousehold{
			ID: *ahOld,
		}
		if err := ah.Read(ctx); err != nil {
			return logger.Error(ctx, err)
		}

		if ah.IsExpired() {
			return logger.Error(ctx, errs.ErrSenderPaymentRequired)
		}

		if !opts.AuthHouseholdsPermissions.IsPermitted(ahOld, permissions[m.getType()], PermissionEdit) {
			ahNew = nil
		}
	} else if aaOld != nil {
		if opts.AuthAccountPermissions != nil && !opts.AuthAccountPermissions.IsPermitted(permissions[m.getType()], PermissionEdit, true) {
			aaNew = nil
		} else if opts.AuthAccountID != nil && opts.AuthAccountID != aaOld {
			aaNew = opts.AuthAccountID
		}
	}

	if !opts.Admin && aaNew == nil && ahNew == nil && m.getType() != modelNotesPageVersion && m.getType() != modelSecretsValue {
		return logger.Error(ctx, errs.ErrSenderForbidden)
	} else if aaNew != aaOld || ahNew != ahOld {
		m.setIDs(aaNew, ahNew)
	}

	return logger.Error(ctx, nil)
}

// CreateOpts are used to create models.
type CreateOpts struct {
	PermissionsOpts
	Restore bool
}

// Create adds a record to the database.
func Create(ctx context.Context, m Model, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if err := setIDs(ctx, m, opts.PermissionsOpts); err != nil {
		return logger.Error(ctx, err)
	}

	err := m.create(ctx, opts)
	if err != nil {
		return logger.Error(ctx, err)
	}

	if m.getChange(ctx) != "" {
		ChangeCreate(ctx, types.TableNotifyOperationCreate, m)
	}

	return logger.Error(ctx, nil)
}

// DeleteOpts is used to delete models.
type DeleteOpts struct {
	PermissionsOpts
}

// Delete removes a record from a database.
func Delete(ctx context.Context, m Model, opts DeleteOpts) errs.Err {
	ctx = logger.Trace(ctx)

	f, err := getFilter(ctx, m, opts.PermissionsOpts)
	if err != nil {
		return logger.Error(ctx, err)
	}

	var condition string

	var ok bool

	t := m.getType()

	if condition, ok = conditionsDelete[t]; !ok {
		if condition, ok = conditionsRead[t]; !ok {
			if condition, ok = conditionsAll[t]; !ok {
				return logger.Error(ctx, errs.ErrReceiver.Wrap(fmt.Errorf("couldn't lookup conditions for table %d", t)))
			}
		}
	}

	// Delete record
	query := fmt.Sprintf(`
DELETE FROM %[1]s
%[2]s AND %[1]s.id = :id
RETURNING %[1]s.*
`, tableNames[t], condition)

	err = db.Query(ctx, false, m, query, f)
	if err != nil {
		return logger.Error(ctx, err)
	}

	if m.getChange(ctx) != "" {
		ChangeCreate(ctx, types.TableNotifyOperationDelete, m)
	}

	return logger.Error(ctx, err)
}

// InitAccount initializes default objects for an account.
func InitAccount(ctx context.Context, authAccountID uuid.UUID) errs.Err {
	if err := BookmarksInitPersonal(ctx, authAccountID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := HealthItemsInit(ctx, authAccountID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := PlanTasksInit(ctx, authAccountID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := NotesPagesInit(ctx, authAccountID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := ShopListsInitPersonal(ctx, authAccountID); err != nil {
		return logger.Error(ctx, err)
	}

	return logger.Error(ctx, nil)
}

// InitHousehold initializes default objects for a household.
func InitHousehold(ctx context.Context, authHouseholdID, authAccountID uuid.UUID) errs.Err {
	if err := BookmarksInitHousehold(ctx, authHouseholdID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := BudgetAccountsInit(ctx, authHouseholdID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := BudgetCategoriesInit(ctx, authHouseholdID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := CookMealTimesInit(ctx, authHouseholdID, authAccountID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := InventoryCollectionsInit(ctx, authHouseholdID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := RewardCardsInit(ctx, authHouseholdID, authAccountID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := ShopCategoriesInit(ctx, authHouseholdID, authAccountID); err != nil {
		return logger.Error(ctx, err)
	}

	if err := ShopListsInitHousehold(ctx, authHouseholdID); err != nil {
		return logger.Error(ctx, err)
	}

	return logger.Error(ctx, nil)
}

// ReadOpts are used to read models.
type ReadOpts struct {
	PermissionsOpts
}

// Read queries a database for a record.
func Read(ctx context.Context, m Model, opts ReadOpts) errs.Err {
	ctx = logger.Trace(ctx)

	f, err := getFilter(ctx, m, opts.PermissionsOpts)
	if err != nil {
		return logger.Error(ctx, err)
	}

	t := m.getType()

	var condition string

	var ok bool

	if condition, ok = conditionsRead[t]; !ok {
		if condition, ok = conditionsAll[t]; !ok {
			return logger.Error(ctx, errs.ErrReceiver.Wrap(fmt.Errorf("couldn't lookup conditions for table %d", t)))
		}
	}

	query := fmt.Sprintf(`
SELECT %[1]s.*
FROM %[1]s
%[2]s AND %[1]s.id = :id
`, tableNames[t], condition)

	// TODO: cache this?

	return logger.Error(ctx, db.Query(ctx, false, m, query, f))
}

// ReadAllOpts are used to read all models.
type ReadAllOpts struct {
	PermissionsOpts
	Hash    string
	Updated time.Time
}

// ReadAll queries a database for all records, optionally with an updated filter.
func ReadAll(ctx context.Context, m Models, opts ReadAllOpts) (newHash string, ids []ID, err errs.Err) { //nolint:gocognit
	ctx = logger.Trace(ctx)

	var aai *uuid.UUID

	var ahi types.UUIDs

	if opts.AuthAccountID != nil && opts.AuthAccountPermissions == nil || (opts.AuthAccountPermissions != nil && opts.AuthAccountPermissions.IsPermitted(permissions[m.getType()], PermissionView, true)) {
		aai = opts.AuthAccountID
	}

	if opts.AuthHouseholdsPermissions != nil && len(*opts.AuthHouseholdsPermissions) > 0 {
		for i := range *opts.AuthHouseholdsPermissions {
			if (*opts.AuthHouseholdsPermissions)[i].Permissions.IsPermitted(permissions[m.getType()], PermissionView, false) {
				ahi = append(ahi, (*opts.AuthHouseholdsPermissions)[i].AuthHouseholdID)
			}
		}
	}

	if aai == nil && len(ahi) == 0 {
		return "", nil, logger.Error(ctx, errs.ErrSenderForbidden)
	}

	t := m.getType()
	table := tableNames[t]

	filter := map[string]any{
		"auth_account_id":    aai,
		"auth_household_ids": ahi,
		"updated":            opts.Updated,
	}

	ids = []ID{}
	query := fmt.Sprintf(`
SELECT
	  %[1]s.id
	, %[1]s.updated
FROM %[1]s
`, table)

	// Do AuthAccountID first, if specified
	if condition, ok := conditionsAccount[t]; ok && aai != nil {
		cache := Cache{
			AuthAccountID: aai,
			TableName:     table,
			Value:         &ids,
		}

		if err := cache.Get(ctx); err != nil {
			aQuery := query + condition
			if err := db.Query(ctx, true, &ids, aQuery, filter); err != nil {
				return newHash, ids, logger.Error(ctx, err)
			}

			err := cache.Set(ctx)
			logger.Error(ctx, err) //nolint:errcheck
		}
	}

	// Loop through households
	if condition, ok := conditionsHousehold[t]; ok && len(ahi) > 0 {
		for i := range ahi {
			ahIDs := []ID{}

			cache := Cache{
				AuthHouseholdID: &ahi[i],
				TableName:       table,
				Value:           &ahIDs,
			}

			if err := cache.Get(ctx); err != nil {
				filter["auth_household_ids"] = types.UUIDs{
					ahi[i],
				}

				aQuery := query + condition

				if err := db.Query(ctx, true, &ahIDs, aQuery, filter); err != nil {
					return newHash, ids, logger.Error(ctx, err)
				}

				err := cache.Set(ctx)
				logger.Error(ctx, err) //nolint:errcheck
			}

			ids = append(ids, ahIDs...)
		}
	}

	filter["auth_household_ids"] = ahi

	sort.SliceStable(ids, func(i, j int) bool {
		return ids[i].Updated.After(ids[j].Updated)
	})

	newHash = GetCRC(ids)
	if newHash == opts.Hash {
		return newHash, ids, logger.Error(ctx, errs.ErrSenderNoContent)
	}

	if len(ids) > 0 && ids[0].Updated.Equal(opts.Updated) {
		return newHash, ids, logger.Error(ctx, err)
	} else if opts.Updated.IsZero() {
		ids = nil
	}

	// Read everything
	query = fmt.Sprintf(`
SELECT %[1]s.*
FROM %[1]s
%[2]s
`, table, conditionsAll[t])

	// Get records
	if !opts.Updated.IsZero() {
		query += fmt.Sprintf(" AND %s.updated > :updated ", table)
	}

	query += "ORDER BY created ASC"

	return newHash, ids, logger.Error(ctx, db.Query(ctx, true, m, query, filter))
}

// Setup adds a cache and DB.
func Setup(ctx context.Context, cfg *config.Config, cloudEnabled, clearDatabase bool) errs.Err {
	c = cfg

	metrics.Setup()

	if err := cfg.PostgreSQL.Setup(ctx); err != nil {
		return logger.Error(ctx, err)
	}

	if clearDatabase {
		c.PostgreSQL.Exec(ctx, "DROP OWNED BY current_user", nil) //nolint: errcheck
	}

	if err := cfg.PostgreSQL.Migrate(ctx, "homechart", triggers, migrations); err != nil {
		return logger.Error(ctx, err)
	}

	db = &cfg.PostgreSQL
	cloud = cloudEnabled

	if cfg.SMTP.FromAddress != "" {
		if err := cfg.SMTP.Setup(ctx, "Homechart", cfg.App.BaseURL, "https://homechart.app/homechart.png", "/settings/notifications"); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}

// UpdateOpts are options used for updating.
type UpdateOpts struct {
	PermissionsOpts
}

// Update uses UpdateOpts to modify a model.
func Update(ctx context.Context, m Model, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if err := setIDs(ctx, m, opts.PermissionsOpts); err != nil {
		return logger.Error(ctx, err)
	}

	err := m.update(ctx, opts)
	if err != nil {
		return logger.Error(ctx, err)
	}

	if m.getChange(ctx) != "" {
		ChangeCreate(ctx, types.TableNotifyOperationUpdate, m)
	}

	return logger.Error(ctx, nil)
}
