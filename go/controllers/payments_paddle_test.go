package controllers

import (
	"crypto/rand"
	"crypto/rsa"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"strings"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/paddle"
	"github.com/candiddev/shared/go/types"
)

func TestPaymentsPaddleCreate(t *testing.T) {
	logger.UseTestLogger(t)

	p := h.Config.Paddle

	privateKey, _ := rsa.GenerateKey(rand.Reader, 4096)

	publicKey := privateKey.Public()
	publicKeyDER, _ := x509.MarshalPKIXPublicKey(publicKey)
	publicKeyPEM := pem.EncodeToMemory(
		&pem.Block{
			Bytes: publicKeyDER,
			Type:  "PUBLIC KEY",
		},
	)

	h.Config.Paddle = paddle.Config{
		PlanIDMonthly:     11,
		PlanIDYearly:      12,
		ProductIDLifetime: 13,
		PublicKeyBase64:   base64.StdEncoding.EncodeToString(publicKeyPEM),
		VendorID:          10,
	}

	invalid := url.Values{
		"p_signature": []string{
			"wrong",
		},
	}

	ahLifetime := seed.AuthHouseholds[0]
	ahLifetime.Create(ctx, false)

	expiresLifetime := types.CivilDateToday().AddMonths(50 * 12)
	paymentSucceeded := url.Values{
		"alert_name": []string{
			"payment_succeeded",
		},
		"order_id": []string{
			"1234",
		},
		"passthrough": []string{
			ahLifetime.ID.String(),
		},
		"product_id": []string{
			strconv.Itoa(h.Config.Paddle.ProductIDLifetime),
		},
		"user_id": []string{
			"a",
		},
	}
	paddleCreateSignature(privateKey, &paymentSucceeded)

	ahMonthly := seed.AuthHouseholds[0]
	ahMonthly.Create(ctx, false)

	expiresMonthly := types.CivilDateToday().AddMonths(1)
	subscriptionPaymentSucceeded := url.Values{
		"alert_name": []string{
			"subscription_payment_succeeded",
		},
		"next_bill_date": []string{
			expiresMonthly.String(),
		},
		"passthrough": []string{
			ahMonthly.ID.String(),
		},
		"subscription_payment_id": []string{
			"2345",
		},
		"subscription_plan_id": []string{
			strconv.Itoa(h.Config.Paddle.PlanIDMonthly),
		},
		"user_id": []string{
			"1",
		},
	}
	paddleCreateSignature(privateKey, &subscriptionPaymentSucceeded)

	paymentRefunded := url.Values{
		"alert_name": []string{
			"payment_refunded",
		},
		"passthrough": []string{
			ahLifetime.ID.String(),
		},
	}
	paddleCreateSignature(privateKey, &paymentRefunded)

	subscriptionPaymentRefunded := url.Values{
		"alert_name": []string{
			"subscription_payment_refunded",
		},
		"passthrough": []string{
			ahMonthly.ID.String(),
		},
	}
	paddleCreateSignature(privateKey, &subscriptionPaymentRefunded)

	today := types.CivilDateToday()

	tests := []struct { // This test needs to be ordered
		err               string
		inputValues       url.Values
		name              string
		wantCustomerID    string
		wantExpires       types.CivilDate
		wantHousehold     *models.AuthHousehold
		wantProcessor     models.AuthHouseholdSubscriptionProcessor
		wantTransactionID string
	}{
		{
			name:        "invalid signature",
			err:         errServerWebhook.Message(),
			inputValues: invalid,
		},
		{
			name:              "payment_succeeded",
			inputValues:       paymentSucceeded,
			wantExpires:       expiresLifetime,
			wantHousehold:     &ahLifetime,
			wantProcessor:     models.AuthHouseholdSubscriptionProcessorPaddleLifetime,
			wantTransactionID: paymentSucceeded.Get("order_id"),
		},
		{
			name:              "subscription_payment_succeeded",
			inputValues:       subscriptionPaymentSucceeded,
			wantCustomerID:    subscriptionPaymentSucceeded.Get("user_id"),
			wantExpires:       expiresMonthly.AddDays(2),
			wantHousehold:     &ahMonthly,
			wantProcessor:     models.AuthHouseholdSubscriptionProcessorPaddleMonthly,
			wantTransactionID: subscriptionPaymentSucceeded.Get("subscription_payment_id"),
		},
		{
			name:              "payment_refunded",
			inputValues:       paymentRefunded,
			wantExpires:       today,
			wantHousehold:     &ahLifetime,
			wantProcessor:     models.AuthHouseholdSubscriptionProcessorNone,
			wantTransactionID: paymentSucceeded.Get("order_id"),
		},
		{
			name:              "subscription_payment_refunded",
			inputValues:       subscriptionPaymentRefunded,
			wantCustomerID:    subscriptionPaymentSucceeded.Get("user_id"),
			wantExpires:       today,
			wantHousehold:     &ahMonthly,
			wantProcessor:     models.AuthHouseholdSubscriptionProcessorNone,
			wantTransactionID: subscriptionPaymentSucceeded.Get("subscription_payment_id"),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r, _ := http.NewRequestWithContext(ctx, http.MethodPost, ts.URL+"/api/v1/payments/paddle", strings.NewReader(tc.inputValues.Encode()))
			r.Header.Add("Content-Type", "application/x-www-form-urlencoded")
			r.Header.Add("Content-Length", strconv.Itoa(len(tc.inputValues.Encode())))

			msg := &Response{}

			client := &http.Client{}

			res, err := client.Do(r)
			if err == nil {
				defer res.Body.Close()

				json.NewDecoder(res.Body).Decode(msg)

				assert.Equal(t, msg.Error(), tc.err)
			}

			if tc.err == "" {
				tc.wantHousehold.Read(ctx)

				assert.Equal(t, tc.wantHousehold.SubscriptionLastTransactionID, tc.wantTransactionID)
				assert.Equal(t, tc.wantHousehold.SubscriptionCustomerID, tc.wantCustomerID)
				assert.Equal(t, tc.wantHousehold.SubscriptionExpires, tc.wantExpires)
				assert.Equal(t, tc.wantHousehold.SubscriptionProcessor, tc.wantProcessor)
			}
		})
	}

	ahLifetime.Delete(ctx)
	ahMonthly.Delete(ctx)

	h.Config.Paddle = p
}

func TestPaymentsPaddleRead(t *testing.T) {
	logger.UseTestLogger(t)

	p := h.Config.Paddle

	h.Config.Paddle = paddle.Config{
		PlanIDMonthly:     11,
		PlanIDYearly:      12,
		ProductIDLifetime: 13,
		VendorID:          10,
	}

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.Info.Cloud = true
		h.PaymentsPaddleRead(w, r)
	}))

	h.Info.Cloud = false
	endpoint := h.Config.App.CloudEndpoint
	h.Config.App.CloudEndpoint = srv.URL

	var pc []paddleConfig

	noError(t, request{
		method:       "GET",
		responseType: &pc,
		uri:          "/payments/paddle",
	}.do())

	assert.Equal(t, pc[0], paddleConfig{
		PlanIDMonthly:     h.Config.Paddle.PlanIDMonthly,
		PlanIDYearly:      h.Config.Paddle.PlanIDYearly,
		ProductIDLifetime: h.Config.Paddle.ProductIDLifetime,
		VendorID:          h.Config.Paddle.VendorID,
	})

	h.Config.App.CloudEndpoint = endpoint

	h.Config.Paddle = p
}
