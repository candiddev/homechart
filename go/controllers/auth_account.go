package controllers

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/oidc"
	"github.com/candiddev/homechart/go/templates"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// AuthSignIn and AuthAccountCreate need to share a common creation method.
func (h *Handler) createAuthAccount(ctx context.Context, r *http.Request, a *models.AuthAccount, cloudHousehold bool) (models.AuthSession, errs.Err) {
	var ah models.AuthHousehold

	if cloudHousehold {
		ah.SelfHostedID = a.SelfHostedID
		ah.SubscriptionExpires = types.CivilDateToday()
		ah.SubscriptionExpires = types.CivilDateToday().AddDays(h.Config.App.TrialDays)

		if err := ah.Create(ctx, false); err != nil {
			return models.AuthSession{}, logger.Log(ctx, err)
		}
	}

	// Create the account
	err := a.Create(ctx, false)
	ctx = models.SetAuthAccountID(ctx, a.ID)

	if err != nil {
		// Delete the AuthHousehold created for the duplicate account
		derr := ah.Delete(ctx)
		if derr != nil && derr != errs.ErrClientNoContent {
			return models.AuthSession{}, logger.Log(ctx, derr)
		}

		if errors.Is(err, errs.ErrClientConflictExists) {
			err = errConflictAuthAccount
		}

		return models.AuthSession{}, logger.Log(ctx, err)
	}

	if cloudHousehold {
		aaah := models.AuthAccountAuthHousehold{
			AuthAccountID:   &a.ID,
			AuthHouseholdID: ah.ID,
		}
		if err := models.Create(ctx, &aaah, models.CreateOpts{}); err != nil {
			return models.AuthSession{}, logger.Log(ctx, err)
		}
	}

	m := models.Notification{
		BodySMTP:    yaml8n.EmailWelcomeBodyHeader.Translate(a.ISO639Code),
		ToSMTP:      a.EmailAddress.String(),
		SubjectSMTP: yaml8n.EmailWelcomeSubject.Translate(a.ISO639Code),
	}

	if !a.Verified {
		m.BodySMTP += "  " + templates.EmailVerificationBody(a.ISO639Code, h.Config.App.BaseURL, a.ID.String(), a.VerificationToken.UUID.String())
	}

	m.BodySMTP += "\n\n" + fmt.Sprintf(yaml8n.EmailWelcomeBodyStarted.Translate(a.ISO639Code), h.Config.App.BaseURL)

	m.BodySMTP += "\n\n" + yaml8n.EmailWelcomeBodyHelp.Translate(a.ISO639Code)

	go m.Send(ctx, nil) //nolint:errcheck

	// Initialize defaults
	if err := models.InitAccount(ctx, a.ID); err != nil {
		return models.AuthSession{}, logger.Log(ctx, err)
	}

	if cloudHousehold {
		if err := models.InitHousehold(ctx, ah.ID, a.ID); err != nil {
			return models.AuthSession{}, logger.Log(ctx, err)
		}
	}

	s, err := h.createAuthSession(ctx, r, a)
	ctx = setAuthSessionID(ctx, s.ID)

	logger.LogNotice(noticeAuthAccountCreated, a.EmailAddress.String())
	h.sendAnalytics(analyticsEventSignUp, a.UserAgent, r)

	return s, logger.Log(ctx, err)
}

// AuthAccountCreate creates a new AuthAccount using POST data.
// @Accept json
// @ID AuthAccountCreate
// @Param body body models.AuthAccount true "AuthAccount"
// @Produce json
// @Success 200 {object} Response{dataValue=models.AuthSessions}
// @Summary Create AuthAccount
// @Router /auth/accounts [post]
// @Tags AuthAccount
func (h *Handler) AuthAccountCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if h.Config.App.SignupDisabled && !getAuthSessionAdmin(ctx) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errClientBadRequestSignupDisabled))

		return
	}

	// Get AuthAccount from body
	var a models.AuthAccount

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Check if ToS is accepted
	if !a.ToSAccepted {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errClientBadRequestToSAccepted))

		return
	}

	if a.Password == "" {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, types.ErrClientBadRequestPasswordLength))

		return
	}

	a.Verified = false

	s, err := h.createAuthAccount(ctx, r, &a, false)

	WriteResponse(ctx, w, s, nil, 1, "", logger.Log(ctx, err))
}

// AuthAccountDelete deletes an AuthAccount using URL parameters.
// @Accept json
// @ID AuthAccountDelete
// @Param id path string true "ID"
// @Produce json
// @Router /auth/accounts/{id} [delete]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response
// @Summary Delete AuthAccount
// @Tags AuthAccount
func (*Handler) AuthAccountDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get Account ID
	a := models.AuthAccount{
		ID: getUUID(r, "auth_account_id"),
	}

	// Delete account
	if err := a.Delete(ctx); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	logger.LogNotice(noticeAuthAccountDeleted, a.EmailAddress.String())
	WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, nil))
}

// AuthAccountKeysUpdate updates an AuthAccount PrivateKeys and PublicKey using PUT data.
// @ID AuthAccountKeysUpdate
// @Accept json
// @Param body body models.AuthAccount true "AuthAccount"
// @Param id path string true "ID"
// @Produce json
// @Router /auth/accounts/{id}/keys [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthAccounts}
// @Summary Update AuthAccount
// @Tags AuthAccount
func (*Handler) AuthAccountKeysUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get AuthAccount from body
	var a models.AuthAccount

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Get Account ID
	a.ID = getUUID(r, "auth_account_id")

	WriteResponse(ctx, w, a, nil, 1, "", logger.Log(ctx, a.UpdatePrivatePublicKeys(ctx)))
}

// AuthAccountRead reads an AuthAccount using URL parameters.
// @Accept json
// @ID AuthAccountRead
// @Param id path string true "ID"
// @Produce json
// @Router /auth/accounts/{id} [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthAccounts}
// @Summary Read AuthAccount
// @Tags AuthAccount
func (*Handler) AuthAccountRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get Account ID
	a := models.AuthAccount{
		ID:      getUUID(r, "auth_account_id"),
		Updated: getUpdated(ctx),
	}

	// Read Account
	err := a.Read(ctx)
	if err == nil && !errors.Is(err, errs.ErrClientNoContent) {
		a.PasswordResetToken = nil
		a.TOTPBackup = ""
		a.TOTPSecret = ""
		a.VerificationToken = nil
	}

	WriteResponse(ctx, w, a, nil, 1, "", logger.Log(ctx, err))
}

// AuthAccountTOTPCreate generates a TOTP token for use with AuthAccountTOTPUpdate.
// @Accept json
// @ID AuthAccountTOTPCreate
// @Param id path string true "ID"
// @Produce json
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthAccounts}
// @Summary Generate an initial TOTP token
// @Router /auth/accounts/{id}/totp [post]
// @Tags AuthAccount
func (Handler) AuthAccountTOTPCreate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	var a models.AuthAccount

	a.ID = getUUID(r, "auth_account_id")
	if err := a.Read(ctx); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	WriteResponse(ctx, w, a, nil, 1, "", logger.Log(ctx, a.CreateTOTP(ctx)))
}

// AuthAccountTOTPRead returns the TOTP backup token.
// @Accept json
// @ID AuthAccountTOTPRead
// @Param id path string true "ID"
// @Produce json
// @Router /auth/accounts/{id}/totp [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthAccounts}
// @Summary Read TOTP backup token
// @Tags AuthAccount
func (*Handler) AuthAccountTOTPRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	var a models.AuthAccount

	a.ID = getUUID(r, "auth_account_id")

	err := a.ReadTOTPBackup(ctx)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	a.PasswordResetToken = nil
	a.VerificationToken = nil

	WriteResponse(ctx, w, a, nil, 1, "", logger.Log(ctx, err))
}

// AuthAccountTOTPUpdate updates an AuthAccountTOTP using PUT data.
// @Accept json
// @ID AuthAccountTOTPUpdate
// @Param body body models.AuthAccount true "AuthAccount"
// @Param id path string true "ID"
// @Produce json
// @Router /auth/accounts/{id}/totp [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthAccounts}
// @Summary Confirm TOTP token works by sending a code
// @Tags AuthAccount
func (*Handler) AuthAccountTOTPUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get AuthAccount from body
	var a models.AuthAccount

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	a.ID = models.GetAuthAccountID(ctx)

	err := a.UpdateTOTP(ctx)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Send email
	var m models.Notification
	if a.TOTPBackup == "" {
		m = models.Notification{
			BodySMTP:    yaml8n.EmailTwoFactorDisabledBody.Translate(a.ISO639Code),
			SubjectSMTP: yaml8n.EmailTwoFactorDisabledSubject.Translate(a.ISO639Code),
			ToSMTP:      a.EmailAddress.String(),
		}
	} else {
		m = models.Notification{
			BodySMTP:    templates.EmailTwoFactorEnabledBody(a.ISO639Code, a.TOTPBackup),
			SubjectSMTP: yaml8n.EmailTwoFactorEnabledSubject.Translate(a.ISO639Code),
			ToSMTP:      a.EmailAddress.String(),
		}
	}

	go m.Send(ctx, nil) //nolint:errcheck

	a.TOTPBackup = ""
	a.TOTPCode = ""
	a.TOTPQR = ""
	a.TOTPSecret = ""
	a.PasswordResetToken = nil
	a.VerificationToken = nil

	WriteResponse(ctx, w, a, nil, 1, "", logger.Log(ctx, err))
}

// AuthAccountUpdate updates an AuthAccount using PUT data.
// @ID AuthAccountUpdate
// @Accept json
// @Param body body models.AuthAccount true "AuthAccount"
// @Param id path string true "ID"
// @Produce json
// @Router /auth/accounts/{id} [put]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthAccounts}
// @Summary Update AuthAccount
// @Tags AuthAccount
func (h *Handler) AuthAccountUpdate(w http.ResponseWriter, r *http.Request) { //nolint:gocognit
	ctx := logger.Trace(r.Context())

	// Get AuthAccount from body
	var a models.AuthAccount

	if err := getJSON(ctx, &a, r.Body); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Get Account ID
	a.ID = getUUID(r, "auth_account_id")
	oldA := models.AuthAccount{
		ID: a.ID,
	}

	if err := oldA.Read(ctx); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// If admin
	if getAuthSessionAdmin(ctx) && models.GetAuthAccountID(ctx) != a.ID {
		emailAddress := a.EmailAddress
		password := a.Password
		verified := a.Verified
		a = oldA
		a.EmailAddress = emailAddress
		a.Verified = verified

		// if not cloud, change password if specified
		if !h.Info.Cloud {
			a.Password = password
		} else if password != "" {
			WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestProperty))

			return
		}
	} else {
		a.Verified = oldA.Verified
	}

	var err errs.Err

	// Check if OIDC signup
	if a.OIDCCode != "" {
		if a.EmailAddress != "" && !h.Config.SMTP.ValidDomain(a.EmailAddress.String()) && a.OIDCProviderType == oidc.ProviderTypeTest {
			a.OIDCID = models.GenerateUUID().String()
		} else {
			_, a.OIDCID, err = h.OIDCProviders.GetClaims(ctx, a.OIDCProviderType, a.OIDCCode)
			if err != nil {
				WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

				return
			}
		}
	}

	switch {
	case a.Password != "":
		err = a.UpdatePasswordHash(ctx)
		// Send email
		m := models.Notification{
			BodySMTP:    yaml8n.EmailPasswordChangeConfirmationBody.Translate(a.ISO639Code),
			SubjectSMTP: yaml8n.EmailPasswordChangeConfirmationSubject.Translate(a.ISO639Code),
			ToSMTP:      a.EmailAddress.String(),
		}

		go m.Send(ctx, nil) //nolint:errcheck
	case a.OIDCID != "":
		err = a.UpdateOIDC(ctx)

		// Send email
		m := models.Notification{
			ToSMTP: a.EmailAddress.String(),
		}

		provider := ""
		if a.OIDCProviderType == oidc.ProviderTypeGoogle {
			provider = "Google"
		}

		m.BodySMTP = fmt.Sprintf(yaml8n.EmailOIDCConfirmationBody.Translate(a.ISO639Code), provider)
		m.SubjectSMTP = fmt.Sprintf(yaml8n.EmailOIDCConfirmationSubject.Translate(a.ISO639Code), provider)

		go m.Send(ctx, nil) //nolint:errcheck
	default:
		if !getAuthSessionAdmin(ctx) {
			a.VerificationToken = oldA.VerificationToken

			if a.EmailAddress != oldA.EmailAddress && (h.Config.SMTP.ValidDomain(a.EmailAddress.String())) {
				a.Verified = false
			}
		}

		err = a.Update(ctx)

		if a.EmailAddress != oldA.EmailAddress {
			if !a.Verified {
				mVerify := models.Notification{
					AuthAccountID: &a.ID,
					BodySMTP:      templates.EmailEmailAddressChangeConfirmationBody(a.ISO639Code, h.Config.App.BaseURL, a.ID.String(), a.VerificationToken.UUID.String()),
					SubjectSMTP:   yaml8n.EmailEmailAddressChangeConfirmationSubject.Translate(a.ISO639Code),
					ToSMTP:        a.EmailAddress.String(),
				}

				go mVerify.Send(ctx, nil) //nolint:errcheck
			}

			mUpdated := models.Notification{
				AuthAccountID: &a.ID,
				BodySMTP:      templates.EmailEmailAddressUpdatedBody(a.ISO639Code, string(a.EmailAddress)),
				SubjectSMTP:   yaml8n.EmailEmailAddressUpdateSubject.Translate(a.ISO639Code),
				ToSMTP:        oldA.EmailAddress.String(),
			}
			go mUpdated.Send(ctx, nil) //nolint:errcheck
		}
	}

	a.OIDCCode = ""
	a.Password = ""
	a.PasswordResetToken = nil
	a.TOTPBackup = ""
	a.TOTPSecret = ""
	a.VerificationToken = nil

	WriteResponse(ctx, w, a, nil, 1, "", logger.Log(ctx, err))
}

// AuthAccountVerifyRead reads an auth account and resends the verification email if applicable.
// @Accept json
// @ID AuthAccountVerifyRead
// @Param body body models.AuthAccount true "AuthAccount"
// @Produce json
// @Router /auth/verify [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthAccounts}
// @Summary Resend AuthAccount verification email
// @Tags AuthAccount
func (h *Handler) AuthAccountVerifyRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get IDs from parameter
	var a models.AuthAccount
	a.ID = models.GetAuthAccountID(ctx)

	err := a.Read(ctx)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	if a.VerificationToken != nil {
		m := models.Notification{
			BodySMTP:    templates.EmailVerificationBody(a.ISO639Code, h.Config.App.BaseURL, a.ID.String(), a.VerificationToken.UUID.String()),
			SubjectSMTP: yaml8n.EmailVerificationSubject.Translate(a.ISO639Code),
			ToSMTP:      a.EmailAddress.String(),
		}
		go m.Send(ctx, nil) //nolint:errcheck
	}

	WriteResponse(ctx, w, a, nil, 1, "", logger.Log(ctx, err))
}

// AuthAccountVerifyUpdate verifies the email address of an Auth Account.
// @Accept json
// @ID AuthAccountVerifyUpdate
// @Param id path string true "ID"
// @Param token path string true "Verification token"
// @Produce json
// @Router /auth/verify/{id}/{token} [put]
// @Success 200 {object} Response
// @Summary Verifies an AuthAccount using a verification token
// @Tags AuthAccount
func (*Handler) AuthAccountVerifyUpdate(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	// Get IDs from parameter
	var a models.AuthAccount
	a.ID = models.ParseUUID(r.URL.Query().Get("id"))
	token := models.ParseUUID(r.URL.Query().Get("token"))

	if a.ID == uuid.Nil || token == uuid.Nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestMissing))

		return
	}

	// Compare tokens
	if err := a.Read(ctx); err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	if a.VerificationToken == nil || a.VerificationToken != nil && a.VerificationToken.UUID != types.UUIDToNullUUID(token).UUID {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, errs.ErrClientBadRequestMissing))

		return
	}

	a.Verified = true
	err := a.Update(ctx)

	if err != nil || errors.Is(err, errs.ErrClientNoContent) {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	// Send email
	m := models.Notification{
		BodySMTP:    yaml8n.EmailVerifiedBody.Translate(a.ISO639Code),
		SubjectSMTP: yaml8n.EmailVerifiedSubject.Translate(a.ISO639Code),
		ToSMTP:      a.EmailAddress.String(),
	}

	go m.Send(ctx, nil) //nolint:errcheck

	WriteResponse(ctx, w, a, nil, 1, "", logger.Log(ctx, err))
}

// AuthAccountsRead reads all AuthAccounts account has access to.
// @Accept json
// @ID AuthAccountsRead
// @Produce json
// @Router /auth/accounts [get]
// @Security x-homechart-id
// @Security x-homechart-key
// @Success 200 {object} Response{dataValue=models.AuthAccounts}
// @Summary Read all AuthAccounts
// @Tags AuthAccount
func (*Handler) AuthAccountsRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	var a models.AuthAccounts

	var err errs.Err

	var total int

	if getAuthSessionAdmin(ctx) {
		filter := getFilter(ctx)
		id := models.ParseUUID(filter)
		a, total, err = models.AuthAccountsRead(ctx, types.EmailAddress(filter), id, getOffset(ctx))
	} else {
		a, total, err = models.AuthAccountsRead(ctx, "", models.GetAuthAccountID(ctx), 0)
	}

	WriteResponse(ctx, w, a, nil, total, "", logger.Log(ctx, err))
}
