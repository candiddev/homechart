package controllers

import (
	"errors"
	"fmt"
	"net/http"
	"strings"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/oidc"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
)

// AuthSignInCreate creates a new AuthSession using POST data.
// @Accept json
// @Description Requires emailAddress and password
// @ID AuthSignInCreate
// @Param body body models.AuthAccount true "AuthAccount"
// @Produce json
// @Router /auth/signin [post]
// @Success 200 {object} Response{dataValue=models.AuthSessions}
// @Summary Create AuthSession using an AuthAccount
// @Tags AuthSession
func (h *Handler) AuthSignInCreate(w http.ResponseWriter, r *http.Request) { //nolint:gocognit
	ctx := logger.Trace(r.Context())

	// Get AuthAccount from body
	var a models.AuthAccount

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	a.ID = uuid.UUID{}

	var err errs.Err

	if a.UserAgent == "" {
		a.UserAgent = types.ParseUserAgent(r.UserAgent())
	}

	switch {
	// Check if OIDC signin
	case a.OIDCCode != "":
		// This is for testing
		if a.OIDCProviderType == oidc.ProviderTypeTest && h.Config.SMTP.ValidDomain(a.OIDCCode) {
			a.EmailAddress = types.EmailAddress(a.OIDCCode)
			a.OIDCID = a.OIDCCode
		} else {
			// This is for reals
			a.EmailAddress, a.OIDCID, err = h.OIDCProviders.GetClaims(ctx, a.OIDCProviderType, a.OIDCCode)
			if err != nil {
				WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

				return
			}
		}

		if err = a.ReadOIDCID(ctx); err != nil {
			var s models.AuthSession

			if errors.Is(err, errs.ErrClientBadRequestMissing) {
				if a.ToSAccepted {
					a.Verified = true
					s, err = h.createAuthAccount(ctx, r, &a, false)
				} else {
					err = errClientBadRequestAuthAccountMissing
				}
			}

			WriteResponse(ctx, w, s, nil, 1, "", logger.Log(ctx, err))

			return
		}
	case a.Password != "":
		// Get password hash
		p := a.Password
		err = a.ReadPasswordHash(ctx)

		if err != nil || a.Child {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errClientBadRequestAuthAccountMissing))

			return
		}

		// Compare passwords
		err := p.CompareHashAndPassword(a.PasswordHash)
		if a.PasswordHash == "" || err != nil {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errClientBadRequestPassword))

			return
		}

		if strings.HasPrefix(a.PasswordHash, "$2a") {
			a.Password = p
			if err := a.UpdatePasswordHash(ctx); err != nil {
				WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

				return
			}
		}

		// Check two-factor
		if a.TOTPSecret != "" && (!totp.Validate(a.TOTPCode, a.TOTPSecret) && a.TOTPCode != a.TOTPBackup) {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, models.ErrClientBadRequestTOTP))

			return
		}
	default:
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errClientBadRequestPassword))

		return
	}

	s, err := h.createAuthSession(ctx, r, &a)
	if err == nil {
		m := models.Notification{
			BodySMTP:    fmt.Sprintf(yaml8n.EmailSignInBody.Translate(s.ISO639Code), s.Name, h.RateLimiter.GetIP(r)),
			SubjectSMTP: yaml8n.EmailSignInSubject.Translate(a.ISO639Code),
			ToSMTP:      a.EmailAddress.String(),
		}

		go m.Send(ctx, nil) //nolint:errcheck
	}

	ctx = setAuthSessionID(ctx, s.ID)

	WriteResponse(ctx, w, s, nil, 1, "", logger.Log(ctx, err))
}

// AuthSignInRead returns an AuthSession using URL parameters.
// @Accept json
// @ID AuthSignInRead
// @Produce json
// @Router /auth/signin [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthSessions}
// @Summary Check if AuthSession is valid
// @Tags AuthSession
func (*Handler) AuthSignInRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	p := getPermissions(ctx)

	// Get Session ID
	a := models.AuthSession{
		ID:                    getAuthSessionID(ctx),
		Admin:                 getAuthSessionAdmin(ctx),
		AuthAccountID:         models.GetAuthAccountID(ctx),
		WebPush:               getWebPush(ctx),
		PermissionsAccount:    *p.AuthAccountPermissions,
		PermissionsHouseholds: *p.AuthHouseholdsPermissions,
	}

	WriteResponse(ctx, w, a, nil, 1, "", logger.Log(ctx, nil))
}
