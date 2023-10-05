package controllers

import (
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestCheckSession(t *testing.T) {
	logger.UseTestLogger(t)

	key := models.GenerateUUID()

	badToken := models.AuthSession{
		ID:  models.GenerateUUID(),
		Key: key,
	}

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	expires := models.GenerateTimestamp().Add(1 * time.Hour)
	s := models.AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
		Expires:       expires,
	}
	s.Create(ctx, false)

	expired := models.AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
		Expires:       expires.Add(-5 * time.Hour),
	}
	expired.Create(ctx, false)

	permissions := models.AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
		Expires:       expires,
		PermissionsHouseholds: models.AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
				Permissions: models.Permissions{
					Cook: models.PermissionNone,
				},
			},
		},
	}
	permissions.Create(ctx, false)

	a := seed.AuthSessions[0]
	a.Admin = true
	a.Create(ctx, false)

	tests1 := map[string]struct {
		err     string
		session models.AuthSession
		uri     string
	}{
		"no auth": {
			err:     errs.ErrSenderNotFound.Message(),
			session: models.AuthSession{},
			uri:     "/auth/accounts/" + s.AuthAccountID.String(),
		},
		"bad token": {
			err:     errs.ErrSenderNotFound.Message(),
			session: badToken,
			uri:     "/auth/accounts/" + s.AuthAccountID.String(),
		},
		"expired token": {
			err:     errs.ErrSenderNotFound.Message(),
			session: expired,
			uri:     "/auth/accounts/" + s.AuthAccountID.String(),
		},
		"wrong token - account": {
			err:     errs.ErrSenderForbidden.Message(),
			session: s,
			uri:     "/auth/accounts/" + seed.AuthAccounts[1].ID.String(),
		},
		"wrong token - household": {
			err:     errs.ErrSenderForbidden.Message(),
			session: s,
			uri:     "/auth/households/" + ah.ID.String(),
		},
		"admin": {
			session: a,
			uri:     "/auth/households/" + seed.AuthHouseholds[0].ID.String(),
		},
	}

	for name, tc := range tests1 {
		t.Run(name, func(t *testing.T) {
			r := request{
				method: "GET",
				uri:    tc.uri,
			}

			r.session = tc.session

			assert.Equal(t, r.do().Error(), tc.err)
		})
	}

	ah.Delete(ctx)
	a.Delete(ctx)
	s.Delete(ctx)

	// Test subscription expired
	expire := seed.AuthHouseholds[1].SubscriptionExpires
	seed.AuthHouseholds[1].SubscriptionExpires = expire.AddDays(-100)
	seed.AuthHouseholds[1].UpdateSubscription(ctx)

	tests2 := map[string]struct {
		err   string
		input any
		uri   string
	}{
		"expired - payments": {
			input: paymentsBilling{
				AuthHouseholdID: seed.AuthHouseholds[1].ID,
			},
			uri: "/payments",
		},
		"expired": {
			err:   errs.ErrSenderPaymentRequired.Message(),
			input: seed.CalendarEvents[6],
			uri:   "/calendar/events",
		},
	}

	for name, tc := range tests2 {
		t.Run(name, func(t *testing.T) {
			r := request{
				data:    tc.input,
				method:  "POST",
				session: seed.AuthSessions[3],
				uri:     tc.uri,
			}

			assert.Equal(t, r.do().Error(), tc.err)
		})
	}

	seed.AuthHouseholds[1].SubscriptionExpires = expire
	seed.AuthHouseholds[1].Update(ctx)

	// Test OAuth
	proxyHit := false

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		proxyHit = true

		_, id, key := parseOAuthHeader(ctx, r)

		as := models.AuthSession{
			ID:  id,
			Key: key,
		}
		as.Read(ctx, false)

		as.Read(ctx, false)

		WriteResponse(ctx, w, &as, nil, 1, "", nil)
	}))

	defer srv.Close()

	ahC := seed.AuthHouseholds[0]
	ahC.ID = models.GenerateUUID()
	ahC.SelfHostedID = types.UUIDToNullUUID(ahC.ID)
	ahC.SelfHostedURL = types.StringLimit(srv.URL)
	ahC.Create(ctx, true)

	ahE := seed.AuthHouseholds[0]
	ahE.ID = models.GenerateUUID()
	ahE.SelfHostedID = types.UUIDToNullUUID(ahE.ID)
	ahE.SubscriptionExpires = types.CivilDateToday().AddDays(-1)
	ahE.SelfHostedURL = types.StringLimit(srv.URL)
	ahE.Create(ctx, true)

	aaC := seed.AuthAccounts[0]
	aaC.EmailAddress = "cloud@example.com"
	aaC.Create(ctx, false)

	aaCah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &aaC.ID,
		AuthHouseholdID: ahC.ID,
	}
	models.Create(ctx, &aaCah, models.CreateOpts{})

	aaE := seed.AuthAccounts[0]
	aaE.EmailAddress = "expired@example.com"
	aaE.Create(ctx, false)

	aaEah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &aaE.ID,
		AuthHouseholdID: ahE.ID,
	}
	models.Create(ctx, &aaEah, models.CreateOpts{})

	asC := seed.AuthSessions[0]
	asC.AuthAccountID = aaC.ID
	asC.Create(ctx, false)

	asE := seed.AuthSessions[0]
	asE.AuthAccountID = aaE.ID
	asE.Create(ctx, false)

	tests3 := map[string]struct {
		err     string
		id      string
		session models.AuthSession
		want    bool
	}{
		"expired": {
			err:     errs.ErrSenderPaymentRequired.Message(),
			id:      ahE.SelfHostedID.UUID.String(),
			session: asE,
		},
		"no proxy": {
			session: seed.AuthSessions[0],
		},
		"proxy": {
			id:      ahC.SelfHostedID.UUID.String(),
			session: asC,
			want:    true,
		},
	}

	for name, tc := range tests3 {
		t.Run(name, func(t *testing.T) {
			var as models.AuthSessions

			proxyHit = false

			r := request{
				headers: http.Header{
					"Authorization": []string{
						fmt.Sprintf("Bearer %s_%s_%s", tc.id, tc.session.ID, tc.session.Key),
					},
				},
				method:       "GET",
				responseType: &as,
				uri:          "/auth/signin",
			}

			assert.Equal(t, r.do().Error(), tc.err)
			assert.Equal(t, proxyHit, tc.want)

			if tc.err == "" {
				assert.Equal(t, as[0].ID, tc.session.ID)
			}
		})
	}

	ahC.Delete(ctx)
	ahE.Delete(ctx)

	// Test header auth
	proxyAddress := h.Config.App.ProxyAddress
	proxyEmail := h.Config.App.ProxyHeaderEmail
	proxyName := h.Config.App.ProxyHeaderName
	h.Config.App.ProxyHeaderEmail = "Remote-Email"
	h.Config.App.ProxyHeaderName = "Remote-Name"

	tests4 := map[string]struct {
		err   string
		input string
	}{
		"create": {
			input: "127.0.0.1",
		},
		"read": {
			input: "127.0.0.1",
		},
		"invalid": {
			err:   errs.ErrSenderNotFound.Message(),
			input: "1.1.1.1",
		},
	}

	var as models.AuthSessions

	for name, tc := range tests4 {
		t.Run(name, func(t *testing.T) {
			h.Config.App.ProxyAddress = tc.input

			assert.Equal(t, request{
				headers: http.Header{
					"Remote-Email": []string{
						"testheaders@example.com",
					},
					"Remote-Name": []string{
						"Test Headers",
					},
				},
				method:       "GET",
				responseType: &as,
				uri:          "/auth/signin",
			}.do().Error(), tc.err)
		})
	}

	aa := models.AuthAccount{
		ID: as[0].AuthAccountID,
	}
	aa.Delete(ctx)
	aaC.Delete(ctx)
	aaE.Delete(ctx)

	h.Config.App.ProxyAddress = proxyAddress
	h.Config.App.ProxyHeaderEmail = proxyEmail
	h.Config.App.ProxyHeaderName = proxyName
}

func TestSetCORS(t *testing.T) {
	logger.UseTestLogger(t)

	r, _ := http.NewRequest(http.MethodOptions, ts.URL, nil)
	client := &http.Client{}
	res, _ := client.Do(r)

	assert.Equal(t, res.Header.Get("access-control-allow-origin"), "*")
	assert.Equal(t, res.Header.Get("access-control-allow-credentials"), "true")
	assert.Equal(t, res.Header.Get("access-control-allow-headers"), "content-type, x-homechart-debug, x-homechart-hash, x-homechart-id, x-homechart-key, x-homechart-updated, x-homechart-version")
	assert.Equal(t, res.Header.Get("access-control-allow-methods"), "*")
}
