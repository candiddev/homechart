package controllers

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
)

func TestContact(t *testing.T) {
	logger.UseTestLogger(t)

	notify.Test.SMTPMessages()

	ah := seed.AuthHouseholds[0]
	ah.SelfHostedID = types.UUIDToNullUUID(ah.ID)
	ah.Create(ctx, false)

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h.Info.Cloud = true
		h.Contact(w, r)
	}))

	defer srv.Close()

	endpoint := h.Config.App.CloudEndpoint
	h.Config.App.CloudEndpoint = srv.URL
	h.Config.App.ContactFeedback = "feedback@example.com"
	h.Config.App.ContactSupport = "support@example.com"
	h.Config.App.TestNotifier = true

	tests := map[string]struct {
		contains string
		contact  contact
		invert   bool
	}{
		"feedback": {
			contact: contact{
				AuthHouseholdID: &seed.AuthHouseholds[0].ID,
				EmailAddress:    seed.AuthAccounts[0].EmailAddress,
				Message:         "feedback",
				Type:            contactTypeFeedback,
				URL:             "example.com",
			},
			contains: "New Product Feedback",
		},
		"support": {
			contact: contact{
				AuthHouseholdID: &seed.AuthHouseholds[0].ID,
				EmailAddress:    seed.AuthAccounts[0].EmailAddress,
				Message:         "support",
				Type:            contactTypeSupport,
				URL:             "example.com",
			},
			contains: "New Support Request",
		},
		"self-hosted": {
			contact: contact{
				EmailAddress: seed.AuthAccounts[0].EmailAddress,
				Message:      "support",
				SelfHostedID: ah.SelfHostedID,
				Type:         contactTypeSupport,
				URL:          "example.com",
			},
			contains: "New Support Request",
		},
		"feedback fail": {
			contact: contact{
				AuthHouseholdID: &seed.AuthHouseholds[0].ID,
				EmailAddress:    seed.AuthAccounts[0].EmailAddress,
				Message:         "",
				Type:            contactTypeFeedback,
				URL:             "example.com",
			},
			contains: "New Product Feedback",
			invert:   true,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			h.Info.Cloud = false

			r := request{
				data:    tc.contact,
				method:  "POST",
				session: seed.AuthSessions[0],
				uri:     "/contact",
			}

			noError(t, r.do())

			msgs := notify.Test.SMTPMessages()

			if len(msgs) > 0 {
				assert.Equal(t, strings.Contains(msgs[0].Subject, tc.contains), !tc.invert)
			}

			if name == "self-hosted" {
				assert.Contains(t, msgs[0].Body, "**Self-Hosted:** true")
			}
		})
	}

	ah.Delete(ctx)

	h.Config.App.CloudEndpoint = endpoint
	h.Info.Cloud = true
}
