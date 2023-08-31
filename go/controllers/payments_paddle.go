package controllers

import (
	"bytes"
	"context"
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha1" //nolint:gosec
	"crypto/x509"
	"encoding/base64"
	"encoding/pem"
	"errors"
	"net/http"
	"net/url"
	"sort"
	"strconv"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

type paddleConfig struct {
	PlanIDMonthly     int  `json:"planIDMonthly"`
	PlanIDYearly      int  `json:"planIDYearly"`
	ProductIDLifetime int  `json:"productIDLifetime"`
	Sandbox           bool `json:"sandbox"`
	VendorID          int  `json:"vendorID"`
}

var paddlePubKey *rsa.PublicKey //nolint:gochecknoglobals

func paddleCreateSignature(privateKey *rsa.PrivateKey, values *url.Values) {
	sha := paddleSHASum(*values)

	sig, err := rsa.SignPKCS1v15(rand.Reader, privateKey, crypto.SHA1, sha[:])
	if err != nil {
		return
	}

	values.Add("p_signature", base64.StdEncoding.EncodeToString(sig))
}

func paddleSHASum(values url.Values) [20]byte {
	// Sort the keys
	sortedKeys := make([]string, 0, len(values))
	for k := range values {
		sortedKeys = append(sortedKeys, k)
	}

	sort.Strings(sortedKeys)

	// Perform PHP serialization
	var sbuf bytes.Buffer

	sbuf.WriteString("a:")
	sbuf.WriteString(strconv.Itoa(len(sortedKeys)))
	sbuf.WriteString(":{")

	encodeString := func(s string) {
		sbuf.WriteString("s:")
		sbuf.WriteString(strconv.Itoa(len(s)))
		sbuf.WriteString(":\"")
		sbuf.WriteString(s)
		sbuf.WriteString("\";")
	}

	for _, k := range sortedKeys {
		encodeString(k)
		encodeString(values.Get(k))
	}

	sbuf.WriteString("}")

	sha1Sum := sha1.Sum(sbuf.Bytes()) //nolint:gosec

	return sha1Sum
}

func paddleParsePublicKey(ctx context.Context, publicKeyBase64 string) errs.Err {
	b, err := base64.StdEncoding.DecodeString(publicKeyBase64)
	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(err), err.Error())
	}

	der, _ := pem.Decode(b)
	if der == nil {
		return logger.Log(ctx, errServerWebhook, "unable to decode PEM key")
	}

	pub, err := x509.ParsePKIXPublicKey(der.Bytes)
	if err != nil {
		return logger.Log(ctx, errServerWebhook, err.Error())
	}

	signingKey, ok := pub.(*rsa.PublicKey)
	if !ok {
		return logger.Log(ctx, errServerWebhook, "invalid format for key")
	}

	paddlePubKey = signingKey

	logger.Log(ctx, nil) //nolint:errcheck

	return nil
}

func paddleVerifySignature(ctx context.Context, values url.Values) bool {
	// Decode the signature
	sig, err := base64.StdEncoding.DecodeString(values.Get("p_signature"))
	if err != nil {
		logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

		return false
	}

	// Remove the signature so the rest of the values can verified
	values.Del("p_signature")

	sha := paddleSHASum(values)

	// Validate the SHA sum
	err = rsa.VerifyPKCS1v15(paddlePubKey, crypto.SHA1, sha[:], sig)
	if err != nil {
		logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

		return false
	}

	logger.Log(ctx, nil) //nolint:errcheck

	return true
}

func (h *Handler) paddleCancelSubscription(ctx context.Context, subscriptionID string) errs.Err {
	ctx = logger.Trace(ctx)

	values := url.Values{}
	values.Set("subscription_id", subscriptionID)

	return logger.Log(ctx, h.Config.Paddle.Request(ctx, nil, "POST", "/api/2.0/subscription/users_cancel", values))
}

func (h *Handler) paddleHandlePaymentRefunded(ctx context.Context, values url.Values) errs.Err {
	ctx = logger.Trace(ctx)

	today := types.CivilDateToday()

	id, err := uuid.Parse(values.Get("passthrough"))
	if err != nil {
		return logger.Log(ctx, errServerWebhook, err.Error())
	}

	return logger.Log(ctx, h.setAuthHouseholdExpires(ctx, &id, "", "", "", models.AuthHouseholdSubscriptionProcessorNone, &today))
}

func (h *Handler) paddleHandlePaymentSucceeded(ctx context.Context, values url.Values) errs.Err {
	ctx = logger.Trace(ctx)

	id, e := uuid.Parse(values.Get("passthrough"))
	if e != nil {
		return logger.Log(ctx, errServerWebhook, e.Error())
	}

	var expires *types.CivilDate

	customerID := ""
	subscriptionID := values.Get("subscription_id")
	processor := models.AuthHouseholdSubscriptionProcessorNone
	transactionID := ""

	switch values.Get("alert_name") {
	case "payment_succeeded":
		if values.Get("product_id") == strconv.Itoa(h.Config.Paddle.ProductIDLifetime) {
			lifetime := subscriptionExpiresLifetime()
			expires = &lifetime
			processor = models.AuthHouseholdSubscriptionProcessorPaddleLifetime
			transactionID = values.Get("order_id")
		}
	case "subscription_payment_succeeded":
		customerID = values.Get("user_id")
		transactionID = values.Get("subscription_payment_id")

		switch values.Get("subscription_plan_id") {
		case strconv.Itoa(h.Config.Paddle.PlanIDMonthly):
			fallthrough
		case strconv.Itoa(h.Config.Paddle.PlanIDMonthlyReferral):
			if date, err := types.ParseCivilDate(values.Get("next_bill_date")); err == nil {
				d := date.AddDays(2)
				expires = &d
			}

			processor = models.AuthHouseholdSubscriptionProcessorPaddleMonthly
		}
	}

	err := h.setAuthHouseholdExpires(ctx, &id, customerID, subscriptionID, transactionID, processor, expires)
	if errors.Is(err, errs.ErrClientBadRequestMissing) {
		err = nil
	}

	return logger.Log(ctx, err)
}

// PaymentsPaddleCreate provides a webhook for Paddle.
func (h *Handler) PaymentsPaddleCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if paddlePubKey == nil {
		if err := paddleParsePublicKey(ctx, h.Config.Paddle.PublicKeyBase64); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}
	}

	if err := r.ParseForm(); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errServerWebhook))

		return
	}

	if !paddleVerifySignature(ctx, r.Form) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errServerWebhook, "unable to verify signature"))

		return
	}

	var err errs.Err

	switch r.Form.Get("alert_name") {
	case "payment_succeeded":
		fallthrough
	case "subscription_payment_succeeded":
		err = h.paddleHandlePaymentSucceeded(ctx, r.Form)
	case "payment_refunded":
		fallthrough
	case "subscription_payment_refunded":
		err = h.paddleHandlePaymentRefunded(ctx, r.Form)
	}

	WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))
}

// PaymentsPaddleRead returns a paddle config.
func (h *Handler) PaymentsPaddleRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Info.Cloud {
		p := paddleConfig{
			PlanIDMonthly:     h.Config.Paddle.PlanIDMonthly,
			PlanIDYearly:      h.Config.Paddle.PlanIDYearly,
			ProductIDLifetime: h.Config.Paddle.ProductIDLifetime,
			Sandbox:           h.Config.Paddle.Sandbox,
			VendorID:          h.Config.Paddle.VendorID,
		}

		WriteResponse(ctx, w, p, nil, 1, "", logger.Log(ctx, nil))

		return
	}

	logger.Log(ctx, h.proxyCloudRequest(ctx, w, "GET", "/api/v1/payments/paddle", nil)) //nolint:errcheck
}
