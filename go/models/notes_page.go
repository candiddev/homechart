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

// NotesPage defines note fields.
type NotesPage struct {
	Deleted         *time.Time        `db:"deleted" format:"date-time" json:"deleted"`
	AuthAccountID   *uuid.UUID        `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	AuthHouseholdID *uuid.UUID        `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	ParentID        *uuid.UUID        `db:"parent_id" format:"uuid" json:"parentID"`
	ID              uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Color           types.Color       `db:"color" json:"color"`
	Icon            types.StringLimit `db:"icon" json:"icon"`
	Name            types.StringLimit `db:"name" json:"name"`
	Created         time.Time         `db:"created" format:"date-time" json:"created"`
	Updated         time.Time         `db:"updated" format:"date-time" json:"updated"`
	ShortID         types.Nanoid      `db:"short_id" json:"shortID"`
	Tags            types.Tags        `db:"tags" json:"tags"`
} // @Name NotesPage

func (n *NotesPage) SetID(id uuid.UUID) {
	n.ID = id
}

func (n *NotesPage) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	n.ID = GenerateUUID()

	if !opts.Restore || n.ShortID == "" {
		n.ShortID = types.NewNanoid()
	}

	return logger.Error(ctx, db.Query(ctx, false, n, `
INSERT INTO notes_page (
	  auth_account_id
	, auth_household_id
	, color
	, icon
	, id
	, name
	, parent_id
	, short_id
	, tags
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :color
	, :icon
	, :id
	, :name
	, :parent_id
	, :short_id
	, :tags
)
RETURNING *
`, n))
}

func (n *NotesPage) getChange(_ context.Context) string {
	if n.AuthHouseholdID != nil {
		return string(n.Name)
	}

	return ""
}

func (n *NotesPage) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return n.AuthAccountID, n.AuthHouseholdID, &n.ID
}

func (*NotesPage) getType() modelType {
	return modelNotesPage
}

func (n *NotesPage) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
	switch {
	case n.AuthAccountID != nil && authAccountID != nil:
		n.AuthAccountID = authAccountID
	case n.AuthHouseholdID != nil && authHouseholdID != nil:
		n.AuthHouseholdID = authHouseholdID
	default:
		n.AuthAccountID = authAccountID
		n.AuthHouseholdID = authHouseholdID
	}
}

func (n *NotesPage) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
UPDATE notes_page
SET
	  auth_account_id = :auth_account_id
	, auth_household_id = :auth_household_id
	, color = :color
	, deleted = :deleted
	, icon = :icon
	, name = :name
	, parent_id = :parent_id
	, tags = :tags
WHERE id = :id
AND (
	auth_account_id = '%s'
	OR auth_household_id = ANY('%s')
)
RETURNING *
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs())

	// Update database
	return logger.Error(ctx, db.Query(ctx, false, n, query, n))
}

// NotesPages is multiple NotesPage.
type NotesPages []NotesPage

func (*NotesPages) getType() modelType {
	return modelNotesPage
}

// NotesPagesInit adds a default page to a database for an AuthHousehold.
func NotesPagesInit(ctx context.Context, authAccountID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	page := NotesPage{
		AuthAccountID: &authAccountID,
		Name:          "Welcome to Homechart!",
		Tags: types.Tags{
			"homechart",
		},
	}

	err := page.create(ctx, CreateOpts{})
	if err != nil {
		return logger.Error(ctx, err)
	}

	version := NotesPageVersion{
		Body: `# Using Notes
Use notes to create your personal or household knowledgebase.

## Getting Started
Here are some ideas to get you started:

- What kind of filter the furnace uses
- When the warranties expire
- What's the schedule for the party`,
		CreatedBy:   authAccountID,
		NotesPageID: page.ID,
	}

	return logger.Error(ctx, version.create(ctx, CreateOpts{}))
}

// NotesPagesDelete deletes all pages that were marked for deletion.
func NotesPagesDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf("DELETE FROM notes_page WHERE deleted > '0001-01-01' AND deleted < now() - interval '%d day'", c.App.KeepDeletedDays)

	logger.Error(ctx, db.Exec(ctx, query, nil)) //nolint:errcheck
}
