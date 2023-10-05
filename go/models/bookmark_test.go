package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestBookmarkCreate(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]struct {
		err    error
		input  Bookmark
		keepID bool
	}{
		"missing link": {
			err: errs.ErrSenderBadRequest,
			input: Bookmark{
				AuthAccountID: &seed.AuthAccounts[0].ID,
			},
			keepID: false,
		},
		"missing name": {
			err: errs.ErrSenderBadRequest,
			input: Bookmark{
				AuthAccountID: &seed.AuthAccounts[0].ID,
				Link:          "test",
			},
			keepID: false,
		},
		"both icons": {
			err: errs.ErrSenderBadRequest,
			input: Bookmark{
				AuthAccountID: &seed.AuthAccounts[0].ID,
				IconLink:      "test",
				IconName:      "test",
				Link:          "test",
				Name:          "test",
			},
			keepID: false,
		},
		"account and household id": {
			err: errs.ErrSenderBadRequest,
			input: Bookmark{
				AuthAccountID:   &seed.AuthAccounts[0].ID,
				AuthHouseholdID: &seed.AuthHouseholds[0].ID,
				Link:            "test",
				Name:            "test",
			},
			keepID: false,
		},
		"good - no restore": {
			input: Bookmark{
				AuthAccountID: &seed.AuthAccounts[0].ID,
				Home:          true,
				IconLink:      "test",
				Link:          "test",
				Name:          "test",
				NewWindow:     true,
				Tags: types.Tags{
					"awesome",
				},
			},
			keepID: false,
		},
		"good - restore": {
			input: Bookmark{
				AuthAccountID: &seed.AuthAccounts[0].ID,
				Home:          true,
				IconLink:      "test",
				Link:          "test",
				Name:          "test",
				NewWindow:     true,
				ShortID:       "3",
				Tags: types.Tags{
					"awesome",
				},
			},
			keepID: true,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			got := tc.input

			assert.HasErr(t, got.create(ctx, CreateOpts{
				Restore: tc.keepID,
			}), tc.err)

			if tc.err == nil {
				tc.input.Created = got.Created
				tc.input.ID = got.ID
				tc.input.Updated = got.Updated

				if !tc.keepID {
					tc.input.ShortID = got.ShortID
				}

				assert.Equal(t, got, tc.input)
			}

			if tc.err == nil {
				Delete(ctx, &got, DeleteOpts{})
			}
		})
	}
}

func TestBookmarkUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	input := Bookmark{
		AuthHouseholdID: &seed.AuthHouseholds[0].ID,
		IconLink:        "test",
		Link:            "test",
		Name:            "test",
	}

	input.create(ctx, CreateOpts{})

	input.AuthAccountID = &seed.AuthAccounts[0].ID
	input.AuthHouseholdID = nil
	input.IconLink = ""
	input.IconName = "test2"
	input.Link = "test2"
	input.Name = "test2"
	input.NewWindow = true
	input.Tags = types.Tags{
		"awesome",
	}
	input.Home = true

	output := input
	assert.Equal(t, output.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}), nil)

	input.ID = output.ID
	input.ShortID = output.ShortID
	input.Updated = output.Updated

	assert.Equal(t, output, input)
}

func TestBookmarksInitHousehold(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	assert.Equal(t, BookmarksInitHousehold(ctx, ah.ID), nil)

	var bookmarks Bookmarks

	ReadAll(ctx, &bookmarks, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	})

	assert.Equal(t, len(bookmarks), 1)

	ah.Delete(ctx)
}

func TestBookmarksInitPersonal(t *testing.T) {
	logger.UseTestLogger(t)

	aa := AuthAccount{
		EmailAddress: "bookmarksinit@example.com",
	}
	aa.Create(ctx, false)

	assert.Equal(t, BookmarksInitPersonal(ctx, aa.ID), nil)

	var bookmarks Bookmarks

	ReadAll(ctx, &bookmarks, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &aa.ID,
		},
	})

	assert.Equal(t, len(bookmarks), 1)

	aa.Delete(ctx)
}
