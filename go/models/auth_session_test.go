package models

import (
	"testing"
	"time"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestAuthSessionsDelete(t *testing.T) {
	logger.UseTestLogger(t)

	expires := GenerateTimestamp().Add(-48 * time.Hour)

	a := AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
		Expires:       expires,
	}

	assert.Equal(t, a.Create(ctx, false), nil)

	AuthSessionsDelete(ctx)

	output := AuthSession{
		ID: a.ID,
	}

	assert.Equal[error](t, output.Read(ctx, false), errs.ErrClientBadRequestMissing)
}

func TestAuthSessionsReadAll(t *testing.T) {
	logger.UseTestLogger(t)

	got, err := AuthSessionsReadAll(ctx, seed.AuthAccounts[0].ID)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(got), 2)
	assert.Equal(t, got[0].Key, uuid.Nil)
}

func TestAuthSessionCreate(t *testing.T) {
	logger.UseTestLogger(t)

	a := AuthSession{
		Admin:         true,
		AuthAccountID: seed.AuthAccounts[0].ID,
		Expires:       seed.AuthSessions[0].Expires,
		Name:          "Linux",
		PermissionsAccount: Permissions{
			Auth: PermissionNone,
		},
		PermissionsHouseholds: AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
				Permissions: Permissions{
					Auth: PermissionNone,
				},
			},
		},
		UserAgent: types.UserAgentSafari,
		WebPush: &notify.WebPushClient{
			Endpoint: "1",
		},
	}

	assert.Equal(t, a.Create(ctx, false), nil)
	assert.Equal(t, a.WebPush.Endpoint, "1")
	assert.Equal(t, a.PermissionsHouseholds[0].Permissions.Auth, PermissionNone)
	assert.Equal(t, a.UserAgent, types.UserAgentSafari)

	a.Delete(ctx)

	id := GenerateUUID()
	output := AuthSession{
		AuthAccountID: id,
	}

	assert.Equal[error](t, output.Create(ctx, false), errs.ErrClientBadRequestProperty)

	// Keep tokens
	id = GenerateUUID()
	key := GenerateUUID()

	a = AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
		Expires:       seed.AuthSessions[0].Expires,
		ID:            id,
		Key:           key,
	}
	a.Create(ctx, true)

	assert.Equal(t, a.ID, id)
	assert.Equal(t, a.Key, key)
}

func TestAuthSessionDelete(t *testing.T) {
	logger.UseTestLogger(t)

	a := AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
	}
	a.Create(ctx, false)

	assert.Equal(t, a.Delete(ctx), nil)
}

func TestAuthSessionDeleteAll(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[2]
	aa.EmailAddress = "deleteall@example.com"
	aa.Create(ctx, false)

	a1 := AuthSession{
		AuthAccountID: aa.ID,
	}
	a1.Create(ctx, false)
	a2 := a1
	a2.Create(ctx, false)

	assert.Equal(t, a1.DeleteAll(ctx), nil)
	assert.Equal[error](t, a1.Read(ctx, false), errs.ErrClientBadRequestMissing)

	aa.Delete(ctx)
}

func TestAuthSessionRead(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testauthsessionexpire@example.com"
	aa.Create(ctx, false)

	ah := AuthHousehold{}
	ah.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		EmailAddress:    seed.AuthAccounts[0].EmailAddress.String(),
		AuthHouseholdID: ah.ID,
	}
	aaah.InviteCreate(ctx)

	as := AuthSession{
		AuthAccountID: aa.ID,
		Expires:       time.Now().Add(-100 * time.Minute),
	}
	as.Create(ctx, false)

	tests := map[string]struct {
		err          error
		inputIDOnly  bool
		inputSession AuthSession
		want         AuthSession
	}{
		"id": {
			inputSession: AuthSession{
				ID:  seed.AuthSessions[0].ID,
				Key: seed.AuthSessions[0].Key,
			},
			want: seed.AuthSessions[0],
		},
		"expired": {
			err: errs.ErrClientBadRequestMissing,
			inputSession: AuthSession{
				ID:  as.ID,
				Key: as.Key,
			},
		},
		"invalid key": {
			err: errs.ErrClientBadRequestMissing,
			inputSession: AuthSession{
				ID:  as.ID,
				Key: seed.AuthSessions[0].Key,
			},
		},
		"missing key": {
			err: errs.ErrClientBadRequestMissing,
			inputSession: AuthSession{
				ID: seed.AuthSessions[0].ID,
			},
		},
		"missing key Ok": {
			inputIDOnly: true,
			inputSession: AuthSession{
				ID: seed.AuthSessions[0].ID,
			},
			want: seed.AuthSessions[0],
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			got := tc.inputSession

			if tc.err != nil {
				got = AuthSession{}
			}

			assert.HasErr(t, got.Read(ctx, tc.inputIDOnly), tc.err)

			tc.want.PermissionsHouseholds = got.PermissionsHouseholds

			assert.Equal(t, got, tc.want)

			if tc.err == nil {
				got = AuthSession{}

				cache := Cache{
					ID:        &tc.want.ID,
					TableName: "auth_session",
					Value:     &got,
				}
				cache.Get(ctx)

				assert.Equal(t, got, tc.want)
				assert.Equal(t, len(got.PermissionsHouseholds), 3)
				assert.Equal(t, got.PermissionsHouseholds.Get(&seed.AuthHouseholds[1].ID), &seed.AuthAccountAuthHouseholds[5].Permissions)
			}
		})
	}

	Delete(ctx, &aaah, DeleteOpts{})
	ah.Delete(ctx)
	aa.Delete(ctx)
}

func TestAuthSessionRenew(t *testing.T) {
	logger.UseTestLogger(t)

	a := AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
		Expires:       GenerateTimestamp(),
	}
	a.Create(ctx, false)

	expires := GenerateTimestamp().Add(300 * time.Second)
	a.Expires = expires

	assert.Equal(t, a.Renew(ctx), nil)

	output := AuthSession{
		ID:  a.ID,
		Key: a.Key,
	}
	output.Read(ctx, false)

	assert.Equal(t, output.Expires, a.Expires)

	a.Delete(ctx)
}

func TestAuthSessionUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	a := AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
		Expires:       GenerateTimestamp().Add(10 * time.Hour),
	}
	a.Create(ctx, false)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	a.WebPush = &notify.WebPushClient{
		Endpoint: "1",
	}
	a.ISO639Code = "en"
	a.PermissionsAccount = Permissions{
		Auth: PermissionNone,
	}
	a.PermissionsHouseholds = AuthHouseholdsPermissions{
		{
			AuthHouseholdID: ah.ID,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Permissions: Permissions{
				Auth: PermissionNone,
			},
		},
	}

	assert.Equal(t, a.Update(ctx), nil)

	output := AuthSession{
		ID:  a.ID,
		Key: a.Key,
	}
	output.Read(ctx, false)

	a.PermissionsHouseholds = AuthHouseholdsPermissions{
		output.PermissionsHouseholds[0],
		a.PermissionsHouseholds[0],
	}
	a.PrimaryAuthHouseholdID = output.PrimaryAuthHouseholdID

	assert.Equal(t, output, a)

	a.Delete(ctx)
	ah.Delete(ctx)
}
