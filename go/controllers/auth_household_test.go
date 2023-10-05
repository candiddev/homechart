package controllers

import (
	"fmt"
	"net/http"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestAuthHouseholdCreate(t *testing.T) {
	logger.UseTestLogger(t)

	child := seed.AuthSessions[0]
	child.AuthAccountID = seed.AuthAccounts[2].ID
	child.Create(ctx, false)

	tests := map[string]struct {
		cloud   bool
		err     string
		session models.AuthSession
		want    types.CivilDate
	}{
		"child": {
			err:     errs.ErrSenderForbidden.Message(),
			session: child,
		},
		"not cloud": {
			session: seed.AuthSessions[0],
			want:    types.CivilDateToday().AddDays(h.Config.App.TrialDays),
		},
		"cloud": {
			cloud:   true,
			session: seed.AuthSessions[0],
			want:    types.CivilDateToday().AddDays(h.Config.App.TrialDays),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			h.Info.Cloud = tc.cloud

			var ah models.AuthHouseholds

			r := request{
				data: models.AuthHousehold{
					SubscriptionReferrerCode: "testing",
				},
				method:       "POST",
				responseType: &ah,
				session:      tc.session,
				uri:          "/auth/households",
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				assert.Equal(t, ah[0].SubscriptionExpires, tc.want)
				assert.Equal(t, ah[0].SubscriptionReferrerCode, types.StringLimit("testing"))
				assert.Equal(t, ah[0].Delete(ctx), nil)
			}
		})
	}

	h.Info.Cloud = true
}

func TestAuthHouseholdDelete(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	a1 := seed.AuthAccounts[0]
	a1.EmailAddress = "testdeleteauth1@example.com"
	a1.Create(ctx, false)

	aaah1 := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a1.ID,
		AuthHouseholdID: ah.ID,
	}
	models.Create(ctx, &aaah1, models.CreateOpts{})

	a2 := seed.AuthAccounts[0]
	a2.EmailAddress = "testdeleteauth2@example.com"
	a2.Create(ctx, false)

	aaah2 := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a2.ID,
		AuthHouseholdID: ah.ID,
	}
	models.Create(ctx, &aaah2, models.CreateOpts{})

	s1 := models.AuthSession{
		AuthAccountID: a1.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	s1.Create(ctx, false)

	s2 := models.AuthSession{
		AuthAccountID: a2.ID,
		Expires:       seed.AuthSessions[0].Expires,
		PermissionsHouseholds: models.AuthHouseholdsPermissions{
			{
				AuthHouseholdID: ah.ID,
				Permissions: models.Permissions{
					Auth: models.PermissionView,
				},
			},
		},
	}
	s2.Create(ctx, false)

	tests := map[string]struct {
		err     string
		session models.AuthSession
	}{
		"bad - wrong account": {
			err:     errs.ErrSenderForbidden.Message(),
			session: seed.AuthSessions[1],
		},
		"bad - no permissions": {
			err:     errs.ErrSenderForbidden.Message(),
			session: s2,
		},
		"good": {
			session: s1,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r := request{
				method:  "DELETE",
				session: tc.session,
				uri:     "/auth/households/" + ah.ID.String(),
			}

			assert.Equal(t, r.do().Error(), tc.err)
		})
	}

	ah.Updated = time.Time{}

	assert.Equal[error](t, ah.Read(ctx), errs.ErrSenderNotFound)

	a1.Delete(ctx)
	a2.Delete(ctx)
}

func TestAuthHouseholdExport(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]struct {
		session models.AuthSession
		want    int
	}{
		"not household admin": {
			session: seed.AuthSessions[1],
			want:    errs.ErrSenderForbidden.Status(),
		},
		"household admin": {
			session: seed.AuthSessions[0],
			want:    http.StatusOK,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("%s/api/v1/auth/households/%s/export", ts.URL, seed.AuthHouseholds[0].ID), nil)

			r.Header.Add("x-homechart-id", tc.session.ID.String())
			r.Header.Add("x-homechart-key", tc.session.Key.String())

			client := &http.Client{}
			res, _ := client.Do(r)

			assert.Equal(t, res.StatusCode, tc.want)
		})
	}
}

func TestAuthHouseholdImport(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]struct {
		cloud       bool
		err         string
		householdID uuid.UUID
		session     models.AuthSession
	}{
		"not household admin": {
			err:         errs.ErrSenderForbidden.Message(),
			householdID: seed.AuthHouseholds[1].ID,
			session:     seed.AuthSessions[1],
		},
		"household admin": {
			err:         errs.ErrReceiver.Message(),
			householdID: seed.AuthHouseholds[0].ID,
			session:     seed.AuthSessions[0],
		},
		"hosted": {
			cloud:       true,
			err:         errs.ErrSenderForbidden.Message(),
			householdID: seed.AuthHouseholds[0].ID,
			session:     seed.AuthSessions[0],
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			h.Info.Cloud = tc.cloud

			assert.Equal(t, request{
				method:  "POST",
				session: tc.session,
				uri:     fmt.Sprintf("/auth/households/%s/import", tc.householdID),
			}.do().Error(), tc.err)
		})
	}

	h.Info.Cloud = true
}

func TestAuthHouseholdInviteAccept(t *testing.T) {
	logger.UseTestLogger(t)

	a := seed.AuthAccounts[0]
	a.EmailAddress = "inviteaccept@example.com"
	a.Create(ctx, false)

	as := seed.AuthSessions[0]
	as.AuthAccountID = a.ID
	as.Create(ctx, false)

	aaah := models.AuthAccountAuthHousehold{
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		EmailAddress:    a.EmailAddress.String(),
	}
	aaah.InviteCreate(ctx)

	noError(t, request{
		method:  "GET",
		session: as,
		uri:     fmt.Sprintf("/auth/households/%s/invites/%s", seed.AuthHouseholds[0].ID, aaah.InviteToken),
	}.do())

	notWant := aaah.InviteToken
	aaah.AuthAccountID = &a.ID

	assert.Equal(t, models.Read(ctx, &aaah, models.ReadOpts{}), nil)

	assert.Equal(t, aaah.InviteToken != notWant, true)

	a.Delete(ctx)
}

func TestAuthHouseholdInviteCreate(t *testing.T) {
	logger.UseTestLogger(t)

	tests := map[string]struct {
		aaah    models.AuthAccountAuthHousehold
		err     string
		session models.AuthSession
		want    int
	}{
		"no permissions": {
			err:     errs.ErrSenderForbidden.Message(),
			session: seed.AuthSessions[1],
		},
		"no body": {
			err:     errs.ErrSenderBadRequest.Message(),
			session: seed.AuthSessions[0],
		},
		"child": {
			aaah: models.AuthAccountAuthHousehold{
				Child: true,
				Name:  "Jack",
			},
			session: seed.AuthSessions[0],
			want:    4,
		},
		"invite": {
			session: seed.AuthSessions[0],
			aaah: models.AuthAccountAuthHousehold{
				EmailAddress: "jenna@example.com",
				Name:         "Jenna",
			},
			want: 4,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, request{
				data:    tc.aaah,
				method:  "POST",
				session: tc.session,
				uri:     fmt.Sprintf("/auth/households/%s/invites", seed.AuthHouseholds[0].ID),
			}.do().Error(), tc.err)

			if tc.err == "" {
				aaah := models.AuthAccountAuthHouseholds{}

				models.ReadAll(ctx, &aaah, models.ReadAllOpts{
					PermissionsOpts: models.PermissionsOpts{
						AuthHouseholdsPermissions: &models.AuthHouseholdsPermissions{
							{
								AuthHouseholdID: seed.AuthHouseholds[0].ID,
							},
						},
					},
				})

				assert.Equal(t, len(aaah), tc.want)

				if aaah[tc.want-1].AuthAccountID != nil {
					a := models.AuthAccount{
						ID: *aaah[tc.want-1].AuthAccountID,
					}
					a.Delete(ctx)
				} else {
					models.Delete(ctx, &aaah[tc.want-1], models.DeleteOpts{})
				}
			}
		})
	}
}

func TestAuthHouseholdInviteDelete(t *testing.T) {
	logger.UseTestLogger(t)

	aaah := models.AuthAccountAuthHousehold{
		AuthHouseholdID: seed.AuthHouseholds[1].ID,
		EmailAddress:    "test@example.com",
	}
	aaah.InviteCreate(ctx)

	noError(t, request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     fmt.Sprintf("/auth/households/%s/invites/%s", seed.AuthHouseholds[0].ID, aaah.InviteToken),
	}.do())

	assert.Equal[error](t, models.Read(ctx, &aaah, models.ReadOpts{}), errs.ErrSenderNotFound)
}

func TestAuthHouseholdRead(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Read(ctx)
	ah.SubscriptionReferrerCode = ""
	ah.Preferences.HideComponents = types.SliceString{}

	r := request{
		method:  "GET",
		session: seed.AuthSessions[0],
		uri:     "/auth/households/" + seed.AuthHouseholds[0].ID.String(),
	}

	var a models.AuthHouseholds

	r.responseType = &a

	noError(t, r.do())

	a[0].SelfHostedID = ah.SelfHostedID

	assert.Equal(t, a[0], ah)
}

func TestAuthHouseholdUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	a := seed.AuthAccounts[0]
	a.EmailAddress = "testupdate@example.com"
	a.Create(ctx, false)

	aaah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a.ID,
		AuthHouseholdID: ah.ID,
	}
	models.Create(ctx, &aaah, models.CreateOpts{})

	ah.Read(ctx)

	s := models.AuthSession{
		AuthAccountID: a.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	s.Create(ctx, false)

	sa := models.AuthSession{
		Admin:         true,
		AuthAccountID: a.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	sa.Create(ctx, false)

	ahPref := ah
	ahPref.Preferences.Currency = types.CurrencyCAD

	ahSub := ahPref
	ahSub.SubscriptionExpires = ah.SubscriptionExpires.AddDays(100)

	ahSubAdmin := ahSub
	ahSubAdmin.Preferences = models.AuthHouseholdPreferences{
		ColorBudgetRecurrenceEvents: types.ColorYellow,
		Currency:                    types.CurrencyCAD,
	}

	tests := []struct { // This test needs to be ordered
		household models.AuthHousehold
		name      string
		session   models.AuthSession
	}{
		{
			name:      "preferences",
			household: ahPref,
			session:   s,
		},
		{
			name:      "non-admin",
			household: ahSub,
			session:   s,
		},
		{
			name:      "admin",
			household: ahSubAdmin,
			session:   sa,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var an models.AuthHouseholds

			r := request{
				data:         ah,
				method:       "PUT",
				responseType: &an,
				session:      tc.session,
				uri:          "/auth/households/" + ah.ID.String(),
			}

			noError(t, r.do())

			if len(an) > 0 {
				if tc.name == "non-admin" {
					assert.Equal(t, an[0].SubscriptionExpires != ahSub.SubscriptionExpires, true)
				} else {
					a1 := models.AuthHousehold{
						ID: an[0].ID,
					}
					a1.Read(ctx)

					a1.Preferences = tc.household.Preferences
					a1.Updated = tc.household.Updated
					a1.SelfHostedID = tc.household.SelfHostedID

					assert.Equal(t, a1, tc.household)
				}
			}
		})
	}

	a.Delete(ctx)
	ah.Delete(ctx)
}

func TestAuthHouseholdsRead(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.AuthSessions[0]
	s.Admin = true
	s.Create(ctx, false)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "nohousehold@example.com"
	aa.Create(ctx, false)

	sa := seed.AuthSessions[0]
	sa.AuthAccountID = aa.ID
	sa.Create(ctx, false)

	tests := map[string]struct {
		session models.AuthSession
		query   string
		want    int
	}{
		"non-admin": {
			query:   "asdfasdfasdfsadf",
			session: seed.AuthSessions[1],
			want:    1,
		},
		"non-admin no household": {
			session: sa,
		},
		"admin": {
			session: s,
			want:    2,
		},
		"admin - condition": {
			query:   "filter=" + seed.AuthHouseholds[0].ID.String(),
			session: s,
			want:    1,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var a models.AuthHouseholds

			r := request{
				method:       "GET",
				responseType: &a,
				session:      tc.session,
				uri:          fmt.Sprintf("/auth/households?%s", tc.query),
			}

			res := r.do()

			noError(t, r.do())
			assert.Equal(t, len(a), tc.want)

			if tc.query == "" && name == "admin" {
				assert.Equal(t, res.DataTotal, 2)
			}
		})
	}

	s.Delete(ctx)
}

func TestAuthHouseholdMemberRemove(t *testing.T) {
	logger.UseTestLogger(t)

	a1 := seed.AuthAccounts[0]
	a1.EmailAddress = "testupdatemember@example.com"
	a1.Create(ctx, false)

	aaah1 := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a1.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	models.Create(ctx, &aaah1, models.CreateOpts{})

	a2 := seed.AuthAccounts[0]
	a2.EmailAddress = "selfremove@example.com"
	a2.Create(ctx, false)

	aaah2 := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a2.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		Permissions: models.Permissions{
			Auth: models.PermissionView,
		},
	}
	models.Create(ctx, &aaah2, models.CreateOpts{})

	as := seed.AuthSessions[0]
	as.AuthAccountID = a2.ID
	as.Create(ctx, false)

	tests := map[string]struct {
		err       string
		session   models.AuthSession
		sessionID uuid.UUID
	}{
		"no permissions": {
			err:       errs.ErrSenderForbidden.Message(),
			session:   seed.AuthSessions[1],
			sessionID: seed.AuthAccounts[0].ID,
		},
		"self": {
			session:   as,
			sessionID: a2.ID,
		},
		"wrong household": {
			session:   seed.AuthSessions[0],
			sessionID: seed.AuthAccounts[3].ID,
		},
		"good": {
			session:   seed.AuthSessions[0],
			sessionID: a1.ID,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, request{
				method:  "DELETE",
				session: tc.session,
				uri:     fmt.Sprintf("/auth/households/%s/members/%s", seed.AuthHouseholds[0].ID, tc.sessionID),
			}.do().Error(), tc.err)
		})
	}

	a1.Delete(ctx)
	a2.Delete(ctx)
}

func TestAuthHouseholdMemberUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	a := seed.AuthAccounts[0]
	a.EmailAddress = "testupdatemember@example.com"
	a.Create(ctx, false)

	aaah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	models.Create(ctx, &aaah, models.CreateOpts{})

	tests := map[string]struct {
		aaah      models.AuthAccountAuthHousehold
		accountID uuid.UUID
		err       string
		session   models.AuthSession
	}{
		"wrong household - permissions": {
			aaah: models.AuthAccountAuthHousehold{
				Color: types.ColorBrown,
			},
			accountID: seed.AuthAccounts[3].ID,
			session:   seed.AuthSessions[0],
		},
		"self - restricted": {
			err: errs.ErrSenderForbidden.Message(),
			aaah: models.AuthAccountAuthHousehold{
				Color: types.ColorBrown,
			},
			accountID: seed.AuthAccounts[1].ID,
			session:   seed.AuthSessions[1],
		},
		"update": {
			aaah: models.AuthAccountAuthHousehold{
				Color: types.ColorBrown,
			},
			accountID: a.ID,
			session:   seed.AuthSessions[0],
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r := request{
				data:    tc.aaah,
				method:  "PUT",
				session: tc.session,
				uri:     "/auth/households/" + seed.AuthHouseholds[0].ID.String() + "/members/" + tc.accountID.String(),
			}
			res := r.do()

			assert.Equal(t, res.Error(), tc.err)

			if res.Status == 200 {
				models.Read(ctx, &aaah, models.ReadOpts{})

				assert.Equal(t, aaah.Color, types.ColorBrown)
			}
		})
	}

	a.Delete(ctx)
}
