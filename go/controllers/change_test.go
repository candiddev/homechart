package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

func TestChangeRead(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testchangeread@example.com"
	aa.Create(ctx, false)

	aaah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: ah.ID,
	}
	models.Create(ctx, &aaah, models.CreateOpts{})

	ctx = models.SetAuthAccountID(ctx, aa.ID)

	as := seed.AuthSessions[0]
	as.AuthAccountID = aa.ID
	as.Create(ctx, false)

	bp := seed.BudgetPayees[0]
	bp.AuthHouseholdID = ah.ID
	models.Create(ctx, &bp, models.CreateOpts{})

	ch := models.Changes{}

	models.ReadAll(ctx, &ch, models.ReadAllOpts{
		PermissionsOpts: models.PermissionsOpts{
			AuthAccountID:          &aa.ID,
			AuthAccountPermissions: &models.Permissions{},
			AuthHouseholdsPermissions: &models.AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	})

	tests := map[string]struct {
		err  string
		uri  string
		want models.Change
	}{
		"invalid id": {
			err: errs.ErrSenderBadRequest.Message(),
			uri: "/changes/safdsafsadf",
		},
		"good": {
			uri:  "/changes/" + ch[0].ID.String(),
			want: ch[0],
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var o models.Changes

			r := request{
				method:       "GET",
				responseType: &o,
				session:      as,
				uri:          tc.uri,
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				o[0].AuthHouseholdID = ah.ID

				assert.Equal(t, o[0], tc.want)
			}
		})
	}

	aa.Delete(ctx)
	ah.Delete(ctx)
}

func TestChangesRead(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testchangesread@example.com"
	aa.Create(ctx, false)

	aaah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: ah.ID,
	}
	models.Create(ctx, &aaah, models.CreateOpts{})

	ctx = models.SetAuthAccountID(ctx, aa.ID)

	as1 := seed.AuthSessions[0]
	as1.AuthAccountID = aa.ID
	as1.Create(ctx, false)

	as2 := seed.AuthSessions[0]
	as2.AuthAccountID = aa.ID
	as2.PermissionsHouseholds = models.AuthHouseholdsPermissions{
		{
			AuthHouseholdID: ah.ID,
			Permissions: models.Permissions{
				Budget: models.PermissionNone,
			},
		},
	}
	as2.Create(ctx, false)

	bp := seed.BudgetPayees[0]
	bp.AuthHouseholdID = ah.ID
	models.Create(ctx, &bp, models.CreateOpts{})

	tests := map[string]struct {
		session models.AuthSession
		updated time.Time
		want    int
	}{
		"read": {
			session: as1,
			updated: time.Time{},
			want:    1,
		},
		"new": {
			session: as1,
			updated: models.GenerateTimestamp(),
			want:    0,
		},
		"restricted": {
			session: as2,
			updated: models.GenerateTimestamp(),
			want:    0,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			c := models.Changes{}

			r := request{
				method:       "GET",
				responseType: &c,
				session:      tc.session,
				updated:      tc.updated,
				uri:          "/changes",
			}

			msg := r.do()

			noError(t, msg)
			assert.Equal(t, len(c), tc.want)

			want := 0

			if name == "new" || name == "restricted" {
				want = 1
			}

			assert.Equal(t, len(msg.DataIDs), want)
		})
	}

	aa.Delete(ctx)
	ah.Delete(ctx)
}
