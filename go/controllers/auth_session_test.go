package controllers

import (
	"fmt"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestAuthSessionCreate(t *testing.T) {
	logger.UseTestLogger(t)

	a := models.AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
		Admin:         true,
		Name:          "testing",
	}

	ac := seed.AuthSessions[0]
	ac.AuthAccountID = seed.AuthAccounts[2].ID
	ac.Admin = false
	ac.Create(ctx, false)

	tests := map[string]struct {
		accountID      uuid.UUID
		err            string
		sessionInput   models.AuthSession
		sessionRequest models.AuthSession
	}{
		"create regular": {
			accountID:      seed.AuthAccounts[0].ID,
			sessionInput:   a,
			sessionRequest: seed.AuthSessions[0],
		},
		"child creating parent": {
			err:            errs.ErrClientForbidden.Message(),
			sessionInput:   a,
			sessionRequest: ac,
		},
		"parent creating child": {
			accountID:      seed.AuthAccounts[2].ID,
			sessionInput:   ac,
			sessionRequest: seed.AuthSessions[0],
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var output models.AuthSessions

			r := request{
				data:         tc.sessionInput,
				method:       "POST",
				responseType: &output,
				session:      tc.sessionRequest,
				uri:          "/auth/sessions",
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				assert.Equal(t, output[0].AuthAccountID, tc.accountID)
				assert.Equal(t, output[0].Admin, false)

				output[0].Delete(ctx)
			}
		})
	}

	ac.Delete(ctx)
}

func TestAuthSessionDelete(t *testing.T) {
	logger.UseTestLogger(t)

	a := seed.AuthSessions[0]
	a.Create(ctx, false)

	r := request{
		method:  "DELETE",
		session: a,
		uri:     "/auth/sessions/" + a.ID.String(),
	}

	noError(t, r.do())
}

func TestAuthSessionDeleteAll(t *testing.T) {
	logger.UseTestLogger(t)

	a1 := seed.AuthSessions[0]
	a1.Admin = true
	a1.Create(ctx, false)

	a2 := seed.AuthSessions[1]
	a2.Create(ctx, false)

	tests := map[string]struct {
		session models.AuthSession
		uri     string
	}{
		"delete all - admin": {
			session: a1,
			uri:     fmt.Sprintf(`/auth/accounts/%s/sessions`, a1.AuthAccountID),
		},
		"delete all": {
			session: a2,
			uri:     "/auth/sessions",
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r := request{
				method:  "DELETE",
				session: tc.session,
				uri:     tc.uri,
			}

			noError(t, r.do())

			assert.Equal[error](t, tc.session.Read(ctx, false), errs.ErrClientBadRequestMissing)
		})
	}

	seed.AuthSessions[0].Create(ctx, false)
	seed.AuthSessions[1].Create(ctx, false)
	seed.AuthSessions[2].Create(ctx, false)
}

func TestAuthSessionUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	a := seed.AuthSessions[0]
	a.Expires = models.GenerateTimestamp().Add(10 * time.Hour)
	a.PermissionsAccount.Auth = 2
	a.PermissionsHouseholds = models.AuthHouseholdsPermissions{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Permissions: models.Permissions{
				Shop: models.PermissionView,
			},
		},
	}
	a.Create(ctx, false)

	aBad := a
	aBad.PermissionsAccount.Auth = 0

	aGood := a
	aGood.PermissionsHouseholds = models.AuthHouseholdsPermissions{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Permissions: models.Permissions{
				Shop: models.PermissionNone,
			},
		},
	}

	tests := map[string]struct {
		err     string
		session models.AuthSession
		want    models.AuthHouseholdsPermissions
	}{
		"invalid permissions": {
			err:     errs.ErrClientForbidden.Message(),
			session: aBad,
		},
		"valid permissions": {
			session: aGood,
			want:    aGood.PermissionsHouseholds,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var n models.AuthSessions

			r := request{
				data:         tc.session,
				method:       "PUT",
				responseType: &n,
				session:      a,
				uri:          "/auth/sessions/" + a.ID.String(),
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				assert.Equal(t, n[0].PermissionsHouseholds, tc.want)
			}
		})
	}

	a.Delete(ctx)
}

func TestAuthSessionsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var output models.AuthSessions

	r := request{
		method:       "GET",
		responseType: &output,
		session:      seed.AuthSessions[0],
		uri:          "/auth/sessions",
	}

	noError(t, r.do())
	assert.Equal(t, len(output), 2)
	assert.Equal(t, output[0].Key, uuid.Nil)
}
