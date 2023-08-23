package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestNotesPageCreate(t *testing.T) {
	logger.UseTestLogger(t)

	w := seed.NotesPages[3]
	w.AuthAccountID = &seed.AuthAccounts[0].ID
	w.AuthHouseholdID = nil
	w.Color = types.ColorBlue
	w.Icon = "add"
	w.ID = uuid.Nil
	w.Name = "create"

	assert.Equal(t, w.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, w.AuthHouseholdID, &seed.AuthHouseholds[0].ID)
	assert.Equal(t, w.AuthAccountID, nil)

	Delete(ctx, &w, DeleteOpts{})

	w.AuthAccountID = &seed.AuthAccounts[0].ID
	w.AuthHouseholdID = nil
	w.ID = uuid.UUID{}
	w.ParentID = nil
	w.create(ctx, CreateOpts{})

	// Should fail due to duplicate name
	w = seed.NotesPages[0]

	assert.HasErr(t, w.create(ctx, CreateOpts{}), errs.ErrClientConflictExists)

	// Should fail due to duplicate name
	w = seed.NotesPages[3]

	assert.HasErr(t, w.create(ctx, CreateOpts{}), errs.ErrClientConflictExists)

	// Existing short ID
	id := types.NewNanoid()
	w = seed.NotesPages[0]
	w.ID = uuid.UUID{}
	w.Name = "testing"
	w.ShortID = id

	assert.Equal(t, w.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, w.ShortID, id)

	Delete(ctx, &w, DeleteOpts{})
}

func TestNotesPageDelete(t *testing.T) {
	// Test trigger to AuthAccount.NotesPagesCollapsed
	logger.UseTestLogger((t))

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testnotespagedelete@example.com"
	aa.Create(ctx, true)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	aaah.create(ctx, CreateOpts{})

	w1 := NotesPage{
		AuthAccountID: &aa.ID,
		Name:          "collapsed1",
	}
	w1.create(ctx, CreateOpts{
		Restore: true,
	})

	w2 := NotesPage{
		AuthHouseholdID: &aaah.AuthHouseholdID,
		Name:            "collapsed2",
	}
	w2.create(ctx, CreateOpts{
		Restore: true,
	})

	w3 := NotesPage{
		AuthHouseholdID: &aaah.AuthHouseholdID,
		Name:            "collapsed3",
	}
	w3.create(ctx, CreateOpts{
		Restore: true,
	})

	aa.CollapsedNotesPages = types.SliceString{
		w1.ID.String(),
		w2.ID.String(),
	}

	aa.Update(ctx)

	Delete(ctx, &w1, DeleteOpts{})
	Delete(ctx, &w2, DeleteOpts{})

	assert.Equal(t, Delete(ctx, &w3, DeleteOpts{}), nil)

	aa.Read(ctx)

	assert.Equal(t, len(aa.CollapsedNotesPages), 0)

	aa.Delete(ctx)
}

func TestNotesPageUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	w := seed.NotesPages[0]
	w.ID = uuid.Nil
	w.Name = "update"
	w.create(ctx, CreateOpts{})

	now := GenerateTimestamp()
	w.Deleted = &now
	w.Tags = types.Tags{
		"t1",
		"t2",
	}
	w.Color = types.ColorBlue
	w.Icon = "add"
	w.Name = "update1"
	w.ParentID = &seed.NotesPages[2].ID

	assert.Equal(t, w.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}), nil)

	page := NotesPage{
		AuthAccountID:   w.AuthAccountID,
		AuthHouseholdID: w.AuthHouseholdID,
		ID:              w.ID,
	}

	Read(ctx, &page, ReadOpts{})

	assert.Equal(t, page, w)

	Delete(ctx, &w, DeleteOpts{})

	w1 := NotesPage{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		Name:          "a",
	}
	w1.create(ctx, CreateOpts{})

	w2 := NotesPage{
		Name:     "b",
		ParentID: &w1.ID,
	}
	w2.create(ctx, CreateOpts{})

	w3 := NotesPage{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		Name:          "c",
		ParentID:      &w2.ID,
	}
	w3.create(ctx, CreateOpts{})

	tests := []string{
		"household",
		"account",
	}

	for _, name := range tests {
		t.Run(name, func(t *testing.T) {
			if name == "household" {
				w1.AuthAccountID = nil
				w1.AuthHouseholdID = &seed.AuthHouseholds[0].ID
			} else {
				w1.AuthAccountID = &seed.AuthAccounts[0].ID
				w1.AuthHouseholdID = nil
			}

			w1.update(ctx, UpdateOpts{
				PermissionsOpts: PermissionsOpts{
					AuthAccountID: &seed.AuthAccounts[0].ID,
					AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
						{
							AuthHouseholdID: seed.AuthHouseholds[0].ID,
						},
					},
				},
			})

			w3.AuthAccountID = w1.AuthAccountID
			w3.AuthHouseholdID = w1.AuthHouseholdID

			assert.Equal(t, Read(ctx, &w3, ReadOpts{}), nil)
			assert.Equal(t, w3.AuthAccountID, w1.AuthAccountID)
			assert.Equal(t, w3.AuthHouseholdID, w1.AuthHouseholdID)
		})
	}

	Delete(ctx, &w1, DeleteOpts{})
}

func TestNotesPagesInit(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aa := AuthAccount{
		EmailAddress: "notespagesinit@example.com",
		Name:         "notespagesinit",
		Password:     "a",
	}
	aa.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: ah.ID,
	}
	aaah.create(ctx, CreateOpts{})

	assert.Equal(t, NotesPagesInit(ctx, aa.ID), nil)

	var pages NotesPages

	ReadAll(ctx, &pages, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &aa.ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	})

	assert.Equal(t, len(pages), 1)

	notesPageVersions := NotesPageVersions{}

	ReadAll(ctx, &notesPageVersions, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &aa.ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	})

	assert.Equal(t, len(notesPageVersions), 1)

	aa.Delete(ctx)
	ah.Delete(ctx)
}

func TestNotesPagesDelete(t *testing.T) {
	logger.UseTestLogger(t)

	w1 := seed.NotesPages[0]
	w1.ID = GenerateUUID()
	w1.Name = "TestNotesPagesDelete"
	w1.create(ctx, CreateOpts{})

	tn := GenerateTimestamp()
	w1.Deleted = &tn
	w1.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	})

	old := c.App.KeepDeletedDays
	c.App.KeepDeletedDays = -1

	NotesPagesDelete(ctx)

	assert.Equal[error](t, Read(ctx, &w1, ReadOpts{}), errs.ErrClientBadRequestMissing)

	c.App.KeepDeletedDays = old
}
