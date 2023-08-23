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

// Bookmark is a custom Bookmark used by the UI.
type Bookmark struct {
	AuthAccountID   *uuid.UUID        `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	AuthHouseholdID *uuid.UUID        `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	UpdatedBy       *uuid.NullUUID    `db:"updated_by" json:"updatedBy"`
	ID              uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Created         time.Time         `db:"created" format:"date-time" json:"created"`
	Updated         time.Time         `db:"updated" format:"date-time" json:"updated"`
	Tags            types.Tags        `db:"tags" json:"tags"`
	IconLink        types.StringLimit `db:"icon_link" json:"iconLink"`
	IconName        types.StringLimit `db:"icon_name" json:"iconName"`
	Link            types.StringLimit `db:"link" json:"link"`
	Name            types.StringLimit `db:"name" json:"name"`
	ShortID         types.Nanoid      `db:"short_id" json:"shortID"`
	Home            bool              `db:"home" json:"home"`
	NewWindow       bool              `db:"new_window" json:"newWindow"`
} // @Name Bookmark

func (b *Bookmark) SetID(id uuid.UUID) {
	b.ID = id
}

func (b *Bookmark) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	b.ID = GenerateUUID()

	if !opts.Restore || b.ShortID == "" {
		b.ShortID = types.NewNanoid()
	}

	return logger.Log(ctx, db.Query(ctx, false, b, `
INSERT INTO bookmark (
	  auth_account_id
	, auth_household_id
	, home
	, icon_link
	, icon_name
	, id
	, link
	, name
	, new_window
	, short_id
	, tags
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :home
	, :icon_link
	, :icon_name
	, :id
	, :link
	, :name
	, :new_window
	, :short_id
	, :tags
)
RETURNING *
`, b))
}

func (b *Bookmark) getChange(_ context.Context) string {
	if b.AuthHouseholdID != nil {
		return string(b.Name)
	}

	return ""
}

func (b *Bookmark) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return b.AuthAccountID, b.AuthHouseholdID, &b.ID
}

func (*Bookmark) getType() modelType {
	return modelBookmark
}

func (b *Bookmark) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
	switch {
	case b.AuthAccountID != nil && authAccountID != nil:
		b.AuthAccountID = authAccountID
		b.AuthHouseholdID = nil
	case b.AuthHouseholdID != nil && authHouseholdID != nil:
		b.AuthAccountID = nil
		b.AuthHouseholdID = authHouseholdID
	default:
		b.AuthAccountID = authAccountID
		b.AuthHouseholdID = authHouseholdID
	}
}

func (b *Bookmark) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
UPDATE bookmark
SET
	  auth_account_id = :auth_account_id
	, auth_household_id = :auth_household_id
	, icon_link = :icon_link
	, icon_name = :icon_name
	, home = :home
	, link = :link
	, name = :name
	, new_window = :new_window
	, tags = :tags
WHERE id = :id
AND (
	auth_account_id = '%s'
	OR auth_household_id = ANY('%s')
)
RETURNING *
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs())

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, b, query, b))
}

// Bookmarks is multiple Bookmark.
type Bookmarks []Bookmark

func (*Bookmarks) getType() modelType {
	return modelBookmark
}

// BookmarksInitHousehold adds default household bookmarks to the database.
func BookmarksInitHousehold(ctx context.Context, authHouseholdID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	bookmarks := Bookmarks{
		{
			AuthHouseholdID: &authHouseholdID,
			Home:            true,
			IconName:        "house",
			Link:            types.StringLimit("/settings/households/" + authHouseholdID.String()),
			Name:            "Household Settings",
		},
	}

	for i := range bookmarks {
		err := bookmarks[i].create(ctx, CreateOpts{})
		if err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}

// BookmarksInitPersonal adds default personal bookmarks to the database.
func BookmarksInitPersonal(ctx context.Context, authAccountID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	bookmarks := Bookmarks{
		{
			AuthAccountID: &authAccountID,
			Home:          true,
			IconName:      "person",
			Link:          "/settings/account",
			Name:          "Account Settings",
		},
	}

	for i := range bookmarks {
		err := bookmarks[i].create(ctx, CreateOpts{})
		if err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}
