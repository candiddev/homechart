package controllers

import (
	"context"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"strconv"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

type paddleURL struct {
	URL string `json:"url"`
}

type paymentsBilling struct {
	SelfHostedID    *uuid.NullUUID                            `json:"selfHostedID"`
	AuthHouseholdID uuid.UUID                                 `json:"authHouseholdID"`
	BaseURL         string                                    `json:"baseURL"`
	EmailAddress    string                                    `json:"emailAddress"`
	Processor       models.AuthHouseholdSubscriptionProcessor `json:"processor"`
}

func subscriptionExpiresLifetime() types.CivilDate {
	return types.CivilDateToday().AddMonths(50 * 12)
}

func (h *Handler) setAuthHouseholdExpires(ctx context.Context, authHouseholdID *uuid.UUID, customerID, subscriptionID, transactionID string, subscriptionProcessor models.AuthHouseholdSubscriptionProcessor, expires *types.CivilDate) errs.Err { //nolint:gocognit,revive
	ctx = logger.Trace(ctx)

	var ah models.AuthHousehold

	var err errs.Err

	if authHouseholdID == nil {
		ah.SubscriptionCustomerID = customerID
		err = ah.ReadSubscriptionCustomerID(ctx)
	} else {
		ah.ID = *authHouseholdID
		err = ah.Read(ctx)
	}

	if err != nil || errors.Is(err, errs.ErrClientNoContent) {
		if errors.Is(err, errs.ErrClientBadRequestMissing) {
			err = nil
		}

		return logger.Log(ctx, err)
	}

	if customerID != "" {
		ah.SubscriptionCustomerID = customerID
	}

	if transactionID != "" {
		if ah.SubscriptionLastTransactionID == transactionID {
			logger.Log(ctx, errServerDuplicateWebhook, ah.ID.String()) //nolint:errcheck

			return errs.ErrClientNoContent
		}

		ah.SubscriptionLastTransactionID = transactionID
	}

	if subscriptionID != "" {
		ah.SubscriptionID = subscriptionID
	}

	if expires != nil {
		ah.SubscriptionExpires = *expires
	}

	oldProcessor := ah.SubscriptionProcessor
	ah.SubscriptionProcessor = subscriptionProcessor

	if ah.SubscriptionReferrerCode != "" && ah.SubscriptionReferrerCode != ah.SubscriptionReferralCode && oldProcessor == models.AuthHouseholdSubscriptionProcessorNone {
		ahReferral := models.AuthHousehold{
			SubscriptionReferralCode: ah.SubscriptionReferrerCode,
		}

		if refErr := ahReferral.ReadReferral(ctx); refErr == nil {
			ns := models.AuthAccountsReadNotifications(ctx, nil, &ahReferral.ID, models.AuthAccountNotifyTypeSystem)
			ahReferral.SubscriptionReferralCount++

			for i := range ns {
				ns[i].SubjectSMTP = yaml8n.EmailReferralSubject.Translate(ns[i].ISO639Code)
				ns[i].BodySMTP = fmt.Sprintf(yaml8n.EmailReferralBodyHeader.Translate(ns[i].ISO639Code), ahReferral.SubscriptionReferralCount)

				if ahReferral.SubscriptionReferralCount == 10 {
					ns[i].BodySMTP += " " + yaml8n.EmailReferralBodyLifetime.Translate(ns[i].ISO639Code)
					ahReferral.SubscriptionExpires = subscriptionExpiresLifetime()

					if ahReferral.SubscriptionProcessor == models.AuthHouseholdSubscriptionProcessorPaddleMonthly {
						ns[i].BodySMTP += "  " + yaml8n.EmailReferralBodyCancelled.Translate(ns[i].ISO639Code)
					}
				} else {
					ns[i].BodySMTP += " " + fmt.Sprintf(yaml8n.EmailReferralBodyRemaining.Translate(ns[i].ISO639Code), 10-ahReferral.SubscriptionReferralCount)
				}

				if i == 0 {
					if err := ahReferral.UpdateSubscription(ctx); err != nil {
						logger.Log(ctx, err) //nolint:errcheck
					}
				}

				if ahReferral.SubscriptionProcessor != models.AuthHouseholdSubscriptionProcessorPaddleLifetime {
					go ns[i].Send(ctx, nil) //nolint:errcheck
				}
			}
		}
	}

	if err := ah.UpdateSubscription(ctx); err != nil {
		return logger.Log(ctx, err)
	}

	if ah.SubscriptionID != "" && subscriptionProcessor == models.AuthHouseholdSubscriptionProcessorPaddleLifetime {
		if err := h.paddleCancelSubscription(ctx, ah.SubscriptionID); err != nil {
			return logger.Log(ctx, err)
		}
	}

	if oldProcessor == models.AuthHouseholdSubscriptionProcessorNone {
		ns := models.AuthAccountsReadNotifications(ctx, nil, &ah.ID, models.AuthAccountNotifyTypeSystem)

		for i := range ns {
			ns[i].BodySMTP = yaml8n.EmailPaymentBody.Translate(ns[i].ISO639Code)
			ns[i].SubjectSMTP = yaml8n.EmailPaymentSubject.Translate(ns[i].ISO639Code)

			go ns[i].Send(ctx, nil) //nolint:errcheck
		}

		logger.LogNotice(noticeAuthHouseholdSubscribed, models.AuthHouseholdSubscriptionProcessors[ah.SubscriptionProcessor])
	}

	return logger.Log(ctx, nil)
}

// PaymentsCreate generates payment data for the frontend.
func (h *Handler) PaymentsCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Info.Cloud {
		// Get PaymentsRead from body
		var p paymentsBilling

		if err := getJSON(ctx, &p, r.Body); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}

		if h.Config.Paddle.VendorAuthCode != "" {
			h.sendAnalytics(analyticsEventPurchase, types.ParseUserAgent(r.UserAgent()), r)

			ah := models.AuthHousehold{}

			if p.SelfHostedID != nil {
				ah.SelfHostedID = p.SelfHostedID
			} else {
				ah.ID = p.AuthHouseholdID
			}

			err := ah.Read(ctx)
			if err != nil {
				WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestMissing))

				return
			}

			var productID int

			switch p.Processor {
			case models.AuthHouseholdSubscriptionProcessorApple:
			case models.AuthHouseholdSubscriptionProcessorGoogle:
			case models.AuthHouseholdSubscriptionProcessorNone:
			case models.AuthHouseholdSubscriptionProcessorPaddleLifetime:
				productID = h.Config.Paddle.ProductIDLifetime
			case models.AuthHouseholdSubscriptionProcessorPaddleMonthly:
				productID = h.Config.Paddle.PlanIDMonthly
			case models.AuthHouseholdSubscriptionProcessorPaddleYearly:
			}

			query := url.Values{
				"email": []string{
					p.EmailAddress,
				},
				"id": []string{
					ah.ID.String(),
				},
				"product": []string{
					strconv.Itoa(productID),
				},
				"redirect": []string{
					p.BaseURL + "/subscription?success",
				},
				"vendor": []string{
					strconv.Itoa(h.Config.Paddle.VendorID),
				},
			}

			if h.Config.Paddle.Sandbox {
				query["sandbox"] = []string{
					"",
				}
			}

			if ah.SubscriptionReferrerCode != "" {
				query["product"] = []string{
					strconv.Itoa(h.Config.Paddle.PlanIDMonthlyReferral),
				}
			}

			p := paddleURL{
				URL: fmt.Sprintf("%s/payment?%s", h.Config.App.BaseURL, query.Encode()),
			}

			WriteResponse(ctx, w, p, nil, 1, "", logger.Log(ctx, err))

			return
		}

		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, nil))

		return
	}

	err := h.proxyCloudRequest(ctx, w, "POST", "/api/v1/payments", r.Body)
	logger.Log(ctx, err) //nolint:errcheck
}

// PaymentsDelete cancels a subscription.
func (h *Handler) PaymentsDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Info.Cloud {
		// Get PaymentsRead from body
		var p paymentsBilling

		if err := getJSON(ctx, &p, r.Body); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}

		ah := models.AuthHousehold{}

		if p.SelfHostedID != nil {
			ah.SelfHostedID = p.SelfHostedID
		} else {
			ah.ID = p.AuthHouseholdID
		}

		err := ah.Read(ctx)
		if err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestMissing))

			return
		}

		if ah.SubscriptionProcessor == models.AuthHouseholdSubscriptionProcessorPaddleMonthly {
			err = h.paddleCancelSubscription(ctx, ah.SubscriptionID)
		}

		if err == nil {
			ah.SubscriptionCustomerID = ""
			ah.SubscriptionProcessor = models.AuthHouseholdSubscriptionProcessorNone
			err = ah.UpdateSubscription(ctx)
		}

		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	err := h.proxyCloudRequest(ctx, w, "DELETE", "/api/v1/payments", r.Body)
	logger.Log(ctx, err) //nolint:errcheck
}

// PaymentsUpdate changes a subscription.
func (h *Handler) PaymentsUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Info.Cloud {
		// Get PaymentsRead from body
		var p paymentsBilling

		err := getJSON(ctx, &p, r.Body)
		if err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

			return
		}

		ah := models.AuthHousehold{}

		if p.SelfHostedID != nil {
			ah.SelfHostedID = p.SelfHostedID
		} else {
			ah.ID = p.AuthHouseholdID
		}

		if err := ah.Read(ctx); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestMissing))

			return
		}

		if ah.SubscriptionProcessor == models.AuthHouseholdSubscriptionProcessorPaddleMonthly {
			data := url.Values{}
			data.Set("subscription_id", ah.SubscriptionID)
			data.Set("plan_id", strconv.Itoa(h.Config.Paddle.PlanIDMonthly))

			if err := h.Config.Paddle.Request(ctx, nil, "POST", "/api/2.0/subscription/users/update", data); err != nil {
				WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))
			}
		}

		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	err := h.proxyCloudRequest(ctx, w, "PUT", "/api/v1/payments", r.Body)
	logger.Log(ctx, err) //nolint:errcheck
}
