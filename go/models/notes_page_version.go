package models

import (
	"context"
	"fmt"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

// NotesPageVersion is a version of a NotesPage.
type NotesPageVersion struct {
	AuthAccountID   *uuid.UUID `db:"auth_account_id" json:"-"`
	AuthHouseholdID *uuid.UUID `db:"auth_household_id" json:"-"`
	Body            string     `db:"body" json:"body"`
	// Updated is technically the created field, but the existing merge and query code uses updated and it's hard to justify duplicating all that code for a semantic change.  Alternatively, having a created and updated field seems very redundant as they will always be equal.
	Updated     time.Time `db:"updated" format:"date-time" json:"updated"`
	CreatedBy   uuid.UUID `db:"created_by" format:"uuid" json:"createdBy"`
	ID          uuid.UUID `db:"id" format:"uuid" json:"id"`
	NotesPageID uuid.UUID `db:"notes_page_id" format:"uuid" json:"notesPageID"`
} // @Name NotesPageVersion

func (n *NotesPageVersion) SetID(id uuid.UUID) {
	n.ID = id
}

func (n *NotesPageVersion) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	n.ID = GenerateUUID()

	if n.Updated.IsZero() {
		n.Updated = GenerateTimestamp()
	}

	return logger.Log(ctx, db.Query(ctx, false, n, `
INSERT INTO notes_page_version (
	  body
	, created_by
	, id
	, updated
	, notes_page_id
) VALUES (
	  :body
	, :created_by
	, :id
	, :updated
	, :notes_page_id
)
RETURNING *
`, n))
}

func (n *NotesPageVersion) getChange(ctx context.Context) string {
	page := NotesPage{
		AuthAccountID:   n.AuthAccountID,
		AuthHouseholdID: n.AuthHouseholdID,
		ID:              n.NotesPageID,
	}

	if err := Read(ctx, &page, ReadOpts{}); err != nil {
		logger.Log(ctx, err) //nolint:errcheck

		return ""
	}

	return string(page.Name)
}

func (n *NotesPageVersion) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return n.AuthAccountID, n.AuthHouseholdID, &n.ID
}

func (*NotesPageVersion) getType() modelType {
	return modelNotesPageVersion
}

func (n *NotesPageVersion) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
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

func (*NotesPageVersion) update(_ context.Context, _ UpdateOpts) errs.Err {
	return nil
}

// NotesPageVersions is multiple NotesPageVersion.
type NotesPageVersions []NotesPageVersion

func (*NotesPageVersions) getType() modelType {
	return modelNotesPageVersion
}

// NotesPageVersionsDelete deletes all versions greater than the max.
func NotesPageVersionsDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
DELETE FROM notes_page_version
WHERE id NOT IN (
	SELECT id
	FROM (
		SELECT
			  id
			, ROW_NUMBER() OVER (
					PARTITION BY notes_page_id
					ORDER BY updated DESC
				)
		FROM notes_page_version
	) tmp
	WHERE row_number <= %d
);
`, c.App.KeepNotesPageVersions)

	logger.Log(ctx, db.Exec(ctx, query, nil)) //nolint:errcheck
}
