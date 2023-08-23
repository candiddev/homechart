package models

import (
	"testing"
	"time"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

func TestNotesPageVersionCreate(t *testing.T) {
	logger.UseTestLogger(t)

	w := NotesPageVersion{
		Body:        "Test",
		CreatedBy:   GenerateUUID(),
		NotesPageID: seed.NotesPages[0].ID,
	}

	assert.Equal(t, w.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, w.Updated.IsZero(), false)

	w.AuthAccountID = &seed.AuthAccounts[0].ID

	Delete(ctx, &w, DeleteOpts{})
}

func TestNotesPageVersionDelete(t *testing.T) {
	logger.UseTestLogger(t)

	w := NotesPageVersion{
		Body:        "Test",
		CreatedBy:   GenerateUUID(),
		NotesPageID: seed.NotesPages[0].ID,
	}

	w.create(ctx, CreateOpts{})

	opts := DeleteOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountPermissions: &Permissions{},
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}

	// Should fail
	assert.Equal[error](t, Delete(ctx, &w, opts), errs.ErrClientBadRequestMissing)

	// Should success
	opts.PermissionsOpts.AuthAccountID = &seed.AuthAccounts[0].ID

	assert.Equal(t, Delete(ctx, &w, opts), nil)
}

func TestNotesPageVersionRead(t *testing.T) {
	logger.UseTestLogger(t)

	w := NotesPageVersion{
		Body:        "Test",
		CreatedBy:   GenerateUUID(),
		NotesPageID: seed.NotesPages[0].ID,
	}

	w.create(ctx, CreateOpts{})

	wr := NotesPageVersion{
		AuthAccountID: &seed.AuthAccounts[1].ID,
		ID:            w.ID,
	}

	// Should fail
	assert.Equal[error](t, Read(ctx, &wr, ReadOpts{}), errs.ErrClientBadRequestMissing)

	// Should success
	wr.AuthAccountID = &seed.AuthAccounts[0].ID
	w.AuthAccountID = &seed.AuthAccounts[0].ID

	assert.Equal(t, Read(ctx, &wr, ReadOpts{}), nil)
	assert.Equal(t, wr, w)

	wr.AuthAccountID = &seed.AuthAccounts[0].ID

	Delete(ctx, &wr, DeleteOpts{})
}

func TestNotesPageVersionsDelete(t *testing.T) {
	logger.UseTestLogger(t)

	old := c.App.KeepNotesPageVersions
	c.App.KeepNotesPageVersions = 2

	for i := 1; i <= 10; i++ {
		w := seed.NotesPageVersions[0]
		w.Updated = GenerateTimestamp().Add(-50 * time.Hour)
		w.create(ctx, CreateOpts{})
	}

	notesPageVersions := NotesPageVersions{}
	ReadAll(ctx, &notesPageVersions, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
		},
	})

	assert.Equal(t, len(notesPageVersions), 14)

	NotesPageVersionsDelete(ctx)

	notesPageVersions = NotesPageVersions{}
	ReadAll(ctx, &notesPageVersions, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
		},
	})

	assert.Equal(t, len(notesPageVersions), 4)
	assert.Equal(t, notesPageVersions[1], seed.NotesPageVersions[1])
	assert.Equal(t, notesPageVersions[2], seed.NotesPageVersions[2])

	c.App.KeepNotesPageVersions = old
}
