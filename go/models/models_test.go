package models

import (
	"context"
	"os"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

var ctx context.Context

var seed *Data

var tz *time.Location

func TestMain(m *testing.M) {
	tz, _ = time.LoadLocation("US/Central")
	time.Local = tz
	ctx = context.Background()
	c := config.Default()
	c.Parse(ctx, "", "../../homechart_config.yaml")
	c.App.TestNotifier = true
	c.SMTP.FromAddress = c.SMTP.Username
	ctx = logger.SetDebug(ctx, c.App.Debug)

	if err := Setup(ctx, c, true, true); err != nil {
		os.Exit(1)
	}

	var err errs.Err

	seed, err = Seed(ctx, false)
	if err != nil {
		logger.Log(ctx, err)
		os.Exit(1)
	}

	NotificationsDelete(ctx)

	ctx = logger.SetDebug(ctx, true)
	r := m.Run()

	os.Exit(r)
}

func TestModel(t *testing.T) {
	logger.UseTestLogger(t)

	f := func(m Model) {}

	f(&Bookmark{})
	f(&BudgetAccount{})
	f(&BudgetCategory{})
	f(&BudgetRecurrence{})
	f(&BudgetPayee{})
	f(&BudgetTransaction{})
	f(&BudgetTransactionAccount{})
	f(&BudgetTransactionCategory{})
	f(&CalendarEvent{})
	f(&CookMealPlan{})
	f(&CookMealTime{})
	f(&CookRecipe{})
	f(&HealthItem{})
	f(&HealthLog{})
	f(&InventoryCollection{})
	f(&InventoryItem{})
	f(&NotesPage{})
	f(&NotesPageVersion{})
	f(&PlanProject{})
	f(&PlanTask{})
	f(&RewardCard{})
	f(&ShopCategory{})
	f(&ShopItem{})
	f(&ShopList{})

	assert.Equal(t, true, true)
}

func TestModels(t *testing.T) {
	logger.UseTestLogger(t)

	f := func(m Models) {}

	f(&Bookmarks{})
	f(&BudgetAccounts{})
	f(&BudgetCategories{})
	f(&BudgetRecurrences{})
	f(&BudgetPayees{})
	f(&CalendarEvents{})
	f(&CookMealPlans{})
	f(&CookMealTimes{})
	f(&CookRecipes{})
	f(&HealthItems{})
	f(&HealthLogs{})
	f(&InventoryCollections{})
	f(&InventoryItems{})
	f(&NotesPages{})
	f(&NotesPageVersions{})
	f(&PlanProjects{})
	f(&PlanTasks{})
	f(&RewardCards{})
	f(&ShopCategories{})
	f(&ShopItems{})
	f(&ShopLists{})

	assert.Equal(t, true, true)
}

func TestGetFilter(t *testing.T) {
	logger.UseTestLogger(t)

	aa := GenerateUUID()
	ah := GenerateUUID()
	id := GenerateUUID()

	p := PlanTask{
		AuthAccountID:   &aa,
		AuthHouseholdID: &ah,
		ID:              id,
	}

	tests := map[string]struct {
		err   error
		input PermissionsOpts
		want  filter
	}{
		"no opts": {
			input: PermissionsOpts{},
			want: filter{
				AuthAccountID: &aa,
				AuthHouseholdIDs: types.UUIDs{
					ah,
				},
				ID: &id,
			},
		},
		"permissions - account": {
			input: PermissionsOpts{
				AuthAccountID: &aa,
				AuthAccountPermissions: &Permissions{
					Plan: PermissionView,
				},
				AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
					{
						AuthHouseholdID: ah,
						Permissions: Permissions{
							Plan: PermissionNone,
						},
					},
				},
				Permission: PermissionView,
			},
			want: filter{
				AuthAccountID: &aa,
				ID:            &id,
			},
		},
		"permissions - household": {
			input: PermissionsOpts{
				AuthAccountID: &aa,
				AuthAccountPermissions: &Permissions{
					Plan: PermissionNone,
				},
				AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
					{
						AuthHouseholdID: ah,
						Permissions: Permissions{
							Plan: PermissionView,
						},
					},
				},
				Permission: PermissionView,
			},
			want: filter{
				AuthHouseholdIDs: types.UUIDs{
					ah,
				},
				ID: &id,
			},
		},
		"permissions - none": {
			err: errs.ErrClientForbidden,
			input: PermissionsOpts{
				AuthAccountID: &aa,
				AuthAccountPermissions: &Permissions{
					Plan: PermissionNone,
				},
				AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
					{
						AuthHouseholdID: ah,
						Permissions: Permissions{
							Plan: PermissionNone,
						},
					},
				},
				Permission: PermissionView,
			},
			want: filter{
				ID: &id,
			},
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := getFilter(ctx, &p, tc.input)

			assert.HasErr(t, err, tc.err)
			assert.Equal(t, got, tc.want)
		})
	}
}

func TestSetIDs(t *testing.T) {
	logger.UseTestLogger(t)

	aa := GenerateUUID()
	ah1 := seed.AuthHouseholds[0].ID
	id := GenerateUUID()

	ah2 := seed.AuthHouseholds[0]
	ah2.SubscriptionExpires = types.CivilDateToday().AddDays(-1)
	ah2.Create(ctx, false)

	p1 := PlanTask{
		AuthAccountID: &aa,
		ID:            id,
	}
	p2 := PlanTask{
		AuthHouseholdID: &ah1,
		ID:              id,
	}
	p3 := PlanTask{
		AuthHouseholdID: &ah2.ID,
		ID:              id,
	}
	p4 := PlanTask{
		ID: id,
	}

	tests := map[string]struct {
		err               error
		inputPermissions  PermissionsOpts
		inputTask         PlanTask
		wantAuthAccount   *uuid.UUID
		wantAuthHousehold *uuid.UUID
	}{
		"no opts": {
			inputPermissions: PermissionsOpts{},
			inputTask:        p1,
			wantAuthAccount:  &aa,
		},
		"permissions - household - expired": {
			err: errs.ErrClientPaymentRequired,
			inputPermissions: PermissionsOpts{
				AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
					{
						AuthHouseholdID: ah2.ID,
						Permissions:     Permissions{},
					},
				},
			},
			inputTask:         p3,
			wantAuthHousehold: &ah2.ID,
		},
		"permissions - account - allowed": {
			inputPermissions: PermissionsOpts{
				AuthAccountID:          &id,
				AuthAccountPermissions: &Permissions{},
			},
			inputTask:       p1,
			wantAuthAccount: &id,
		},
		"permissions - account - denied": {
			err: errs.ErrClientForbidden,
			inputPermissions: PermissionsOpts{
				AuthAccountID: &id,
				AuthAccountPermissions: &Permissions{
					Plan: PermissionNone,
				},
			},
			inputTask:       p1,
			wantAuthAccount: &aa,
		},
		"permissions - denied": {
			err: errs.ErrClientForbidden,
			inputPermissions: PermissionsOpts{
				AuthHouseholdsPermissions: &AuthHouseholdsPermissions{},
			},
			inputTask:         p2,
			wantAuthHousehold: &ah1,
		},
		"permissions - denied for household": {
			err: errs.ErrClientForbidden,
			inputPermissions: PermissionsOpts{
				AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
					{
						AuthHouseholdID: id,
						Permissions:     Permissions{},
					},
				},
			},
			inputTask:         p2,
			wantAuthHousehold: &ah1,
		},
		"admin - denied": {
			err: errs.ErrClientForbidden,
			inputPermissions: PermissionsOpts{
				AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
					{
						AuthHouseholdID: id,
						Permissions:     Permissions{},
					},
				},
			},
			inputTask: p4,
		},
		"admin - allowed": {
			inputPermissions: PermissionsOpts{
				Admin: true,
				AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
					{
						AuthHouseholdID: id,
						Permissions:     Permissions{},
					},
				},
			},
			inputTask: p4,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, setIDs(ctx, &tc.inputTask, tc.inputPermissions), tc.err)
			assert.Equal(t, tc.inputTask.AuthAccountID, tc.wantAuthAccount)
			assert.Equal(t, tc.inputTask.AuthHouseholdID, tc.wantAuthHousehold)
		})
	}
}

func TestCreate(t *testing.T) {
	logger.UseTestLogger(t)

	ctx = SetAuthAccountID(ctx, seed.AuthAccounts[0].ID)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	m := seed.CookMealTimes[0]
	m.AuthHouseholdID = ah.ID
	m.Name = "something"

	ch := Changes{}

	ReadAll(ctx, &ch, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	})

	tests := map[string]struct {
		err   error
		input Permission
	}{
		"forbidden": {
			err:   errs.ErrClientForbidden,
			input: PermissionView,
		},
		"good": {
			input: PermissionEdit,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, Create(ctx, &m, CreateOpts{
				PermissionsOpts: PermissionsOpts{
					AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
						{
							AuthHouseholdID: ah.ID,
							Permissions: Permissions{
								Cook: tc.input,
							},
						},
					},
				},
			}), tc.err)

			if tc.err == nil {
				m.Updated = time.Time{}

				assert.Equal(t, Read(ctx, &m, ReadOpts{}), nil)
				assert.Equal(t, m.AuthHouseholdID, ah.ID)

				ReadAll(ctx, &ch, ReadAllOpts{
					PermissionsOpts: PermissionsOpts{
						AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
							{
								AuthHouseholdID: ah.ID,
							},
						},
					},
				})

				assert.Equal(t, len(ch), 1)

				Delete(ctx, &m, DeleteOpts{})
			}
		})
	}

	ah.Delete(ctx)
}

func TestDelete(t *testing.T) {
	logger.UseTestLogger(t)

	ctx = SetAuthAccountID(ctx, seed.AuthAccounts[0].ID)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	m := seed.CookMealTimes[0]
	m.AuthHouseholdID = ah.ID
	m.Name = "something"
	Create(ctx, &m, CreateOpts{})
	m.AuthHouseholdID = seed.AuthHouseholds[1].ID

	ch := Changes{}

	p := PlanTask{
		AuthAccountID:   nil,
		AuthHouseholdID: nil,
		Name:            "Admin",
	}
	p.create(ctx, CreateOpts{
		PermissionsOpts: PermissionsOpts{
			Admin: true,
		},
	})

	tests := map[string]struct {
		admin      bool
		err        error
		model      Model
		permission Permission
	}{
		"forbidden": {
			err:        errs.ErrClientForbidden,
			admin:      false,
			model:      &m,
			permission: PermissionView,
		},
		"good": {
			admin:      false,
			model:      &m,
			permission: PermissionEdit,
		},
		"not admin": {
			admin:      false,
			err:        errs.ErrClientBadRequestMissing,
			model:      &p,
			permission: PermissionEdit,
		},
		"admin": {
			admin:      true,
			model:      &p,
			permission: PermissionEdit,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, Delete(ctx, tc.model, DeleteOpts{
				PermissionsOpts: PermissionsOpts{
					Admin: tc.admin,
					AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
						{
							AuthHouseholdID: ah.ID,
							Permissions: Permissions{
								Cook: tc.permission,
							},
						},
					},
				},
			}), tc.err)

			if tc.err == nil && name != "admin" {
				ReadAll(ctx, &ch, ReadAllOpts{
					PermissionsOpts: PermissionsOpts{
						AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
							{
								AuthHouseholdID: ah.ID,
							},
						},
					},
				})

				assert.Equal(t, len(ch), 2)
			}
		})
	}

	ah.Delete(ctx)
}

func TestRead(t *testing.T) {
	logger.UseTestLogger(t)

	m := seed.CookMealTimes[0]
	m.Name = "something"
	Create(ctx, &m, CreateOpts{})
	m.AuthHouseholdID = seed.AuthHouseholds[1].ID

	tests := map[string]struct {
		err   error
		input Permission
	}{
		"forbidden": {
			err:   errs.ErrClientForbidden,
			input: PermissionView,
		},
		"good": {
			input: PermissionEdit,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, Read(ctx, &m, ReadOpts{
				PermissionsOpts: PermissionsOpts{
					AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
						{
							AuthHouseholdID: seed.AuthHouseholds[0].ID,
							Permissions: Permissions{
								Cook: tc.input,
							},
						},
					},
				},
			}), tc.err)

			if tc.err == nil {
				assert.Equal(t, Delete(ctx, &m, DeleteOpts{}), nil)
			}
		})
	}
}

func TestReadAll(t *testing.T) {
	logger.UseTestLogger(t)

	aaHash, _, _ := ReadAll(ctx, &ShopItems{}, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID:          &seed.AuthAccounts[0].ID,
			AuthAccountPermissions: &Permissions{},
		},
	})
	ahHash, _, _ := ReadAll(ctx, &ShopItems{}, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
					Permissions:     Permissions{},
				},
			},
		},
	})

	tests := map[string]struct {
		err                 error
		hash                string
		permissionAccount   Permission
		permissionHousehold Permission
		updated             time.Time
		wantLen             int
		wantHash            string
		wantIDs             int
	}{
		"no access": {
			err:                 errs.ErrClientForbidden,
			hash:                "",
			permissionAccount:   PermissionNone,
			permissionHousehold: PermissionNone,
			updated:             time.Time{},
		},
		"account only": {
			hash:                "",
			permissionAccount:   PermissionView,
			permissionHousehold: PermissionNone,
			updated:             time.Time{},
			wantLen:             2,
			wantHash:            aaHash,
			wantIDs:             0,
		},
		"household only": {
			hash:                "",
			permissionAccount:   PermissionNone,
			permissionHousehold: PermissionView,
			updated:             time.Time{},
			wantLen:             6,
			wantHash:            ahHash,
			wantIDs:             0,
		},
		"no content": {
			err:                 errs.ErrClientNoContent,
			hash:                ahHash,
			permissionAccount:   PermissionNone,
			permissionHousehold: PermissionView,
			updated:             time.Time{},
		},
		"updated": {
			hash:                "",
			permissionAccount:   PermissionNone,
			permissionHousehold: PermissionView,
			updated:             seed.ShopItems[0].Updated,
			wantLen:             5,
			wantHash:            ahHash,
			wantIDs:             6,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var s ShopItems

			hash, ids, err := ReadAll(ctx, &s, ReadAllOpts{
				PermissionsOpts: PermissionsOpts{
					AuthAccountID: &seed.AuthAccounts[0].ID,
					AuthAccountPermissions: &Permissions{
						Shop: tc.permissionAccount,
					},
					AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
						{
							AuthHouseholdID: seed.AuthHouseholds[0].ID,
							Permissions: Permissions{
								Shop: tc.permissionHousehold,
							},
						},
					},
				},
				Hash:    tc.hash,
				Updated: tc.updated,
			})

			assert.HasErr(t, err, tc.err)

			if err == nil {
				assert.Equal(t, len(s), tc.wantLen)
				assert.Equal(t, hash, tc.wantHash)
				assert.Equal(t, len(ids), tc.wantIDs)
			}
		})
	}
}

func TestUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	ctx = SetAuthAccountID(ctx, seed.AuthAccounts[0].ID)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	m := seed.CookMealTimes[0]
	m.AuthHouseholdID = ah.ID
	m.Name = "something"
	Create(ctx, &m, CreateOpts{})
	m.Name = "something new"

	ch := Changes{}

	ReadAll(ctx, &ch, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	})

	tests := map[string]struct {
		err   error
		input Permission
	}{
		"forbidden": {
			err:   errs.ErrClientForbidden,
			input: PermissionView,
		},
		"good": {
			input: PermissionEdit,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, Update(ctx, &m, UpdateOpts{
				PermissionsOpts: PermissionsOpts{
					AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
						{
							AuthHouseholdID: ah.ID,
							Permissions: Permissions{

								Cook: tc.input,
							},
						},
					},
				},
			}), tc.err)

			if tc.err == nil {
				m.Updated = time.Time{}

				assert.Equal(t, Read(ctx, &m, ReadOpts{}), nil)
				assert.Equal(t, m.AuthHouseholdID, ah.ID)

				ReadAll(ctx, &ch, ReadAllOpts{
					PermissionsOpts: PermissionsOpts{
						AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
							{
								AuthHouseholdID: ah.ID,
							},
						},
					},
				})

				assert.Equal(t, len(ch), 2)

				Delete(ctx, &m, DeleteOpts{})
			}
		})
	}
}
