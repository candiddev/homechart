package controllers

import (
	"fmt"
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/templates"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

type contact struct {
	AuthHouseholdID *uuid.UUID         `json:"authHouseholdID"`
	EmailAddress    types.EmailAddress `json:"emailAddress"`
	Message         string             `json:"message"`
	SelfHostedID    *uuid.NullUUID     `json:"selfHostedID"`
	Type            contactType        `json:"type"`
	URL             string             `json:"url"`
}

type contactType int

const (
	contactTypeSupport contactType = iota
	contactTypeFeedback
)

// Contact creates a new contact request.
func (h *Handler) Contact(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Info.Cloud {
		// Get contact from body
		var c contact

		if err := getJSON(ctx, &c, r.Body); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}

		ah := models.AuthHousehold{}

		if c.AuthHouseholdID != nil {
			ah.ID = *c.AuthHouseholdID
		} else if c.SelfHostedID != nil {
			ah.SelfHostedID = c.SelfHostedID
		}

		if err := ah.Read(ctx); err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, err))

			return
		}

		if c.SelfHostedID != nil && ah.IsExpired() {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, errs.ErrSenderPaymentRequired))

			return
		}

		email := models.Notification{
			BodySMTP: fmt.Sprintf(templates.ContactUsBodySMTP, c.EmailAddress, c.URL, c.SelfHostedID != nil, getSubscriptionTrial(ctx), c.Message),
		}

		switch c.Type {
		case contactTypeFeedback:
			email.ToSMTP = h.Config.App.ContactFeedback
			email.SubjectSMTP = templates.ContactUsSubjectSMTPFeedback
		case contactTypeSupport:
			email.ToSMTP = h.Config.App.ContactSupport
			email.SubjectSMTP = templates.ContactUsSubjectSMTPSupport
		}

		if c.EmailAddress != "" && c.Message != "" && c.URL != "" {
			go email.Send(ctx, nil) //nolint:errcheck
		}

		WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, nil))

		return
	}

	err := h.proxyCloudRequest(ctx, w, "POST", "/api/v1/contact", r.Body)
	logger.Error(ctx, err) //nolint:errcheck
}
