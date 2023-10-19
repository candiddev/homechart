package controllers

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/cryptolib"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

func TestCloudHouseholdCreate(t *testing.T) {
	logger.UseTestLogger(t)

	id := models.GenerateUUID()

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		logger.UseTestLogger(t)
		ctx := chi.NewRouteContext()
		ctx.URLParams.Add("self_hosted_id", id.String())
		r = r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, ctx))
		h.Info.Cloud = true
		h.CloudHouseholdCreate(w, r)
	}))

	defer srv.Close()

	endpoint := h.Config.App.CloudEndpoint
	h.Config.App.CloudEndpoint = srv.URL
	h.Info.Cloud = false

	var as models.AuthSessions

	r := request{
		data: cloudHousehold{
			EmailAddress: "cloudhousehold@example.com",
		},
		method:       "POST",
		responseType: &as,
		uri:          "/cloud/" + id.String(),
	}

	noError(t, r.do())

	// Check for self hosted ID
	ah := models.AuthHousehold{
		ID: *as[0].PrimaryAuthHouseholdID,
	}
	ah.Read(ctx)

	assert.Equal(t, ah.SelfHostedID.UUID, id)

	ah.Delete(ctx)

	h.Config.App.CloudEndpoint = endpoint
}

func TestCloudHouseholdRead(t *testing.T) {
	logger.UseTestLogger(t)

	endpoint := h.Config.App.CloudEndpoint

	ah1 := seed.AuthHouseholds[0]
	ah1.SelfHostedID = types.UUIDToNullUUID(seed.AuthHouseholds[0].ID)
	ah1.SubscriptionExpires = types.CivilDateToday().AddDays(-1)
	ah1.Create(ctx, false)
	h.Info.Cloud = false

	ah2 := seed.AuthHouseholds[0]
	ah2.SelfHostedID = types.UUIDToNullUUID(seed.AuthHouseholds[1].ID)
	ah2.SubscriptionExpires = types.CivilDateToday().AddDays(1)
	ah2.Create(ctx, false)

	tests := map[string]struct {
		expires types.CivilDate
		id      uuid.UUID
		want    int
	}{
		"expired": {
			expires: ah1.SubscriptionExpires,
			id:      ah1.SelfHostedID.UUID,
			want:    http.StatusNotFound,
		},
		"good": {
			expires: ah2.SubscriptionExpires,
			id:      ah2.SelfHostedID.UUID,
			want:    http.StatusOK,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				ctx := chi.NewRouteContext()
				ctx.URLParams.Add("self_hosted_id", tc.id.String())
				r = r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, ctx))

				h.Info.Cloud = true
				h.CloudHouseholdRead(w, r)
				h.Info.Cloud = false
			}))

			defer srv.Close()

			h.Config.App.CloudEndpoint = srv.URL

			r, _ := http.NewRequest(http.MethodGet, fmt.Sprintf("%s/api/v1/cloud/%s", ts.URL, tc.id), nil)
			client := &http.Client{}
			res, _ := client.Do(r)

			var ah models.AuthHouseholds

			msg, _ := DecodeResponse(res.Body, &ah)

			if msg.Success {
				assert.Equal(t, ah[0].SubscriptionExpires, tc.expires)
			}
		})
	}

	ah1.Delete(ctx)
	ah2.Delete(ctx)

	h.Info.Cloud = true
	h.Config.App.CloudEndpoint = endpoint
}

func TestCloudHouseholdReadJWT(t *testing.T) {
	logger.UseTestLogger(t)

	endpoint := h.Config.App.CloudEndpoint
	oldPrv := h.Config.App.CloudPrivateKey
	oldPub := h.Config.App.CloudPublicKey

	prv, pub, _ := cryptolib.NewKeysSign()
	h.Config.App.CloudPrivateKey = prv
	h.Config.App.CloudPublicKey = pub

	id := models.GenerateUUID()

	ah1 := seed.AuthHouseholds[0]
	ah1.SelfHostedID = types.UUIDToNullUUID(id)
	ah1.SubscriptionExpires = types.CivilDateToday().AddDays(1)
	ah1.SubscriptionProcessor = models.AuthHouseholdSubscriptionProcessorPaddleMonthly
	ah1.Create(ctx, false)

	h.Info.Cloud = false
	h.Router = chi.NewRouter()
	h.Routes(ctx)
	ts = httptest.NewServer(h.Router)

	ah2 := seed.AuthHouseholds[0]
	ah2.ID = id
	ah2.Create(ctx, true)

	aaah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &seed.AuthAccounts[0].ID,
		AuthHouseholdID: ah2.ID,
	}
	models.Create(ctx, &aaah, models.CreateOpts{})

	tests := map[string]struct {
		authHouseholdID uuid.UUID
		errWant         string
	}{
		"allowed": {
			authHouseholdID: id,
		},
		"forbidden": {
			authHouseholdID: models.GenerateUUID(),
			errWant:         errs.ErrSenderForbidden.Message(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var ah models.AuthHouseholds

			srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				ctx := chi.NewRouteContext()
				ctx.URLParams.Add("self_hosted_id", tc.authHouseholdID.String())
				r = r.WithContext(context.WithValue(r.Context(), chi.RouteCtxKey, ctx))

				h.Info.Cloud = true
				h.CloudHouseholdReadJWT(w, r)
				h.Info.Cloud = false
			}))

			defer srv.Close()

			h.Config.App.CloudEndpoint = srv.URL

			assert.Equal(t, request{
				method:       "GET",
				responseType: &ah,
				session:      seed.AuthSessions[0],
				uri:          fmt.Sprintf("/cloud/%s/jwt", tc.authHouseholdID),
			}.do().Error(), tc.errWant)

			if tc.errWant == "" {
				assert.Equal(t, ah[0].SubscriptionExpires, ah1.SubscriptionExpires)
				assert.Equal(t, ah[0].SubscriptionProcessor, ah1.SubscriptionProcessor)
			}
		})
	}

	ah1.Delete(ctx)
	ah2.Delete(ctx)

	h.Info.Cloud = true
	h.Router = chi.NewRouter()
	h.Routes(ctx)
	ts = httptest.NewServer(h.Router)
	h.Config.App.CloudEndpoint = endpoint
	h.Config.App.CloudPrivateKey = oldPrv
	h.Config.App.CloudPublicKey = oldPub
}
