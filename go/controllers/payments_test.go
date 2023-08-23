package controllers

import (
	"context"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/paddle"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestSetAuthHouseholdExpires(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.SubscriptionExpires = types.CivilDateToday().AddDays(-10)
	ah.Create(ctx, false)

	id1 := models.GenerateUUID()

	var id2 *uuid.UUID

	e1 := types.CivilDateToday()
	e2 := e1.AddDays(10)

	referrer := seed.AuthHouseholds[0]
	referrer.Create(ctx, false)

	aaah := seed.AuthAccountAuthHouseholds[0]
	aaah.AuthHouseholdID = referrer.ID
	models.Create(ctx, &aaah, models.CreateOpts{})

	referrer.SubscriptionExpires = types.CivilDateToday()
	referrer.SubscriptionReferralCode = "test123"
	referrer.SubscriptionReferralCount = 8
	referrer.UpdateSubscription(ctx)

	referral1 := seed.AuthHouseholds[0]
	referral1.SubscriptionReferrerCode = "test123"
	referral1.Create(ctx, false)

	referral2 := seed.AuthHouseholds[0]
	referral2.SubscriptionReferrerCode = "test123"
	referral2.Create(ctx, false)

	referral3 := seed.AuthHouseholds[0]
	referral3.SubscriptionReferrerCode = "test123"
	referral3.Create(ctx, false)

	tests := []struct { // This test needs to be ordered.
		customerID          string
		expires             *types.CivilDate
		householdID         *uuid.UUID
		name                string
		wantExpires         types.CivilDate
		wantReferralCount   int
		wantReferrerExpires types.CivilDate
	}{
		{
			name:        "missing",
			expires:     &ah.SubscriptionExpires,
			householdID: &id1,
			wantExpires: ah.SubscriptionExpires,
		},
		{
			name:        "AuthHouseholdID",
			customerID:  "1",
			expires:     &e1,
			householdID: &ah.ID,
			wantExpires: e1,
		},
		{
			name:        "CustomerID",
			customerID:  "1",
			expires:     &e2,
			householdID: id2,
			wantExpires: e2,
		},
		{
			name:                "Referral - Remaining",
			householdID:         &referral1.ID,
			expires:             &e2,
			wantExpires:         e2,
			wantReferralCount:   9,
			wantReferrerExpires: referrer.SubscriptionExpires,
		},
		{
			name:                "Referral - Lifetime",
			customerID:          fmt.Sprintf(yaml8n.EmailReferralBodyHeader.Translate("")+yaml8n.EmailReferralBodyRemaining.Translate(""), 10, 1),
			expires:             &e2,
			householdID:         &referral2.ID,
			wantExpires:         e2,
			wantReferralCount:   10,
			wantReferrerExpires: subscriptionExpiresLifetime(),
		},
		{
			name:                "Referral - +1",
			householdID:         &referral3.ID,
			expires:             &e2,
			wantExpires:         e2,
			wantReferralCount:   11,
			wantReferrerExpires: subscriptionExpiresLifetime(),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			assert.Equal(t, h.setAuthHouseholdExpires(ctx, tc.householdID, tc.customerID, "", "", models.AuthHouseholdSubscriptionProcessorPaddleMonthly, tc.expires), nil)

			aho := models.AuthHousehold{
				ID: ah.ID,
			}

			aho.Read(ctx)

			assert.Equal(t, tc.expires, &aho.SubscriptionExpires)

			if tc.wantReferralCount > 0 {
				referrer.Read(ctx)

				assert.Equal(t, referrer.SubscriptionReferralCount, tc.wantReferralCount)
				assert.Equal(t, referrer.SubscriptionExpires, tc.wantReferrerExpires)
			}
		})
	}

	referrer.Delete(ctx)
	referral1.Delete(ctx)
	referral2.Delete(ctx)
	referral3.Delete(ctx)
	ah.Delete(ctx)
}

func TestPaymentsCreate(t *testing.T) {
	logger.UseTestLogger(t)

	endpoint := h.Config.App.CloudEndpoint
	h.Info.Cloud = false

	p := h.Config.Paddle

	h.Config.Paddle = paddle.Config{
		PlanIDMonthly:     11,
		PlanIDYearly:      12,
		ProductIDLifetime: 13,
		Sandbox:           true,
		VendorAuthCode:    "test",
		VendorID:          10,
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.Info.Cloud = true
		h.PaymentsCreate(w, r)
	}))

	defer srv.Close()

	h.Config.App.CloudEndpoint = srv.URL

	var pu []paddleURL

	noError(t, request{
		data: paymentsBilling{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BaseURL:         "http://homechart.app",
			EmailAddress:    seed.AuthAccounts[0].EmailAddress.String(),
			Processor:       models.AuthHouseholdSubscriptionProcessorPaddleMonthly,
		},
		method:       "POST",
		responseType: &pu,
		uri:          "/payments",
	}.do())

	query := url.Values{
		"email": []string{
			seed.AuthAccounts[0].EmailAddress.String(),
		},
		"id": []string{
			seed.AuthHouseholds[0].ID.String(),
		},
		"product": []string{
			strconv.Itoa(h.Config.Paddle.PlanIDMonthly),
		},
		"redirect": []string{
			"http://homechart.app/subscription?success",
		},
		"sandbox": []string{
			"",
		},
		"vendor": []string{
			strconv.Itoa(h.Config.Paddle.VendorID),
		},
	}

	assert.Equal(t, pu[0].URL, h.Config.App.BaseURL+"/payment?"+query.Encode())

	h.Config.App.CloudEndpoint = endpoint
	h.Config.Paddle = p
	h.Config.Paddle.Mock = nil
}

func TestPaymentsDelete(t *testing.T) {
	logger.UseTestLogger(t)

	// Paddle
	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	ah.SubscriptionCustomerID = "test"
	ah.SubscriptionID = "1"
	ah.SubscriptionProcessor = models.AuthHouseholdSubscriptionProcessorPaddleMonthly
	ah.UpdateSubscription(ctx)

	h.Config.Paddle.Mock = func(ctx context.Context, dest any, method, path string, values url.Values) errs.Err {
		assert.Equal(t, values.Get("subscription_id"), ah.SubscriptionID)

		return nil
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.Info.Cloud = true
		h.PaymentsDelete(w, r)
	}))

	defer srv.Close()

	h.Config.App.CloudEndpoint = srv.URL

	noError(t, request{
		data: paymentsBilling{
			AuthHouseholdID: ah.ID,
			Processor:       models.AuthHouseholdSubscriptionProcessorPaddleMonthly,
		},
		method: "DELETE",
		uri:    "/payments",
	}.do())

	ah.Read(ctx)

	assert.Equal(t, ah.SubscriptionCustomerID, "")
	assert.Equal(t, ah.SubscriptionProcessor, models.AuthHouseholdSubscriptionProcessorNone)

	h.Config.Paddle.Mock = nil
}
