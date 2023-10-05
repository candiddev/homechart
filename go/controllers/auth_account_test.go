package controllers

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/oidc"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/crypto"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
)

func TestAuthAccountCreate(t *testing.T) {
	logger.UseTestLogger(t)

	h.Config.SMTP.NoEmailDomains = []string{
		"oidc.example.com",
	}
	g := seed.AuthAccounts[0]
	g.ID = models.GenerateUUID()
	g.Password = types.Password(seed.AuthAccounts[0].EmailAddress)
	goodAuthAccountPassword := g
	goodAuthAccountPassword.EmailAddress = "Testcreateauthpassword@example.com"
	badAuthAccountPassword := g
	badAuthAccountPassword.Password = ""
	badAuthAccountToS := g
	badAuthAccountToS.ToSAccepted = false

	tests := []struct {
		err   string
		input *models.AuthAccount
		name  string
	}{
		{
			name: "invalid",
			err:  errClientBadRequestToSAccepted.Message(),
		},
		{
			name:  "bad tos",
			err:   errClientBadRequestToSAccepted.Message(),
			input: &badAuthAccountToS,
		},
		{
			name:  "bad password",
			err:   types.ErrClientBadRequestPasswordLength.Message(),
			input: &badAuthAccountPassword,
		},
		{
			name:  "vaild password",
			input: &goodAuthAccountPassword,
		},
		{
			name:  "exists",
			err:   errConflictAuthAccount.Message(),
			input: &goodAuthAccountPassword,
		},
		{
			name:  "disabled-admin",
			err:   errConflictAuthAccount.Message(),
			input: &goodAuthAccountPassword,
		},
		{
			name:  "disabled-non-admin",
			err:   errClientBadRequestSignupDisabled.Message(),
			input: &goodAuthAccountPassword,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var as models.AuthSessions

			var s models.AuthSession

			r := request{
				data:         tc.input,
				method:       "POST",
				responseType: &as,
				uri:          "/auth/accounts",
			}

			if strings.Contains(tc.name, "disabled") {
				h.Config.App.SignupDisabled = true
			}

			if strings.Contains(tc.name, "disabled-admin") {
				s = seed.AuthSessions[0]
				s.Admin = true
				s.Create(ctx, false)
				r.session = s
			}

			res := r.do()

			assert.Equal(t, res.Error(), tc.err)

			if tc.err == "" {
				a := models.AuthAccount{
					ID: as[0].AuthAccountID,
				}
				a.Read(ctx)

				assert.Equal(t, string(a.EmailAddress), strings.ToLower(string(tc.input.EmailAddress)))

				time.Sleep(1 * time.Second)

				tc.input.Read(ctx)
				tc.input.Password = types.Password(tc.input.EmailAddress)

				msg := notify.Test.SMTPMessages()

				if tc.input.Password == "" {
					assert.Equal(t, strings.Contains(msg[0].Body, "verify"), false)
				} else {
					assert.Equal(t, strings.Contains(msg[0].Body, fmt.Sprintf("%s/verify?id=%s&token=%s", h.Config.App.BaseURL, a.ID, a.VerificationToken.UUID)), true)
				}

				goodAuthAccountPassword.ID = a.ID
			}

			s.Delete(ctx)
		})
	}

	goodAuthAccountPassword.Delete(ctx)

	h.Config.SMTP.NoEmailDomains = []string{}
}

func TestAuthAccountCreateTOTP(t *testing.T) {
	logger.UseTestLogger(t)

	r := request{
		method:  "POST",
		session: seed.AuthSessions[0],
		uri:     "/auth/accounts/" + seed.AuthAccounts[0].ID.String() + "/totp",
	}

	var a models.AuthAccounts

	r.responseType = &a

	noError(t, r.do())
	assert.Equal(t, a[0].TOTPSecret != "", true)
	assert.Equal(t, a[0].TOTPQR != "", true)
	assert.Equal(t, a[0].TOTPBackup == "", true)
}

func TestAuthAccountDelete(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	a1 := seed.AuthAccounts[0]
	a1.EmailAddress = "testdeleteauth1@example.com"
	a1.Create(ctx, false)

	aaah1 := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a1.ID,
		AuthHouseholdID: ah.ID,
	}
	models.Create(ctx, &aaah1, models.CreateOpts{})

	a2 := seed.AuthAccounts[0]
	a2.EmailAddress = "testdeleteauth2@example.com"
	a2.Create(ctx, false)

	aaah2 := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a2.ID,
		AuthHouseholdID: ah.ID,
	}
	models.Create(ctx, &aaah2, models.CreateOpts{})

	s1 := models.AuthSession{
		AuthAccountID: a1.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	s1.Create(ctx, false)

	s2 := models.AuthSession{
		AuthAccountID: a2.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	s2.Create(ctx, false)

	tests := map[string]struct {
		inputID      uuid.UUID
		inputSession models.AuthSession
	}{
		"1": {
			inputID:      a1.ID,
			inputSession: s1,
		},
		"2": {
			inputID:      a2.ID,
			inputSession: s2,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r := request{
				method:  "DELETE",
				session: tc.inputSession,
				uri:     "/auth/accounts/" + tc.inputID.String(),
			}

			noError(t, r.do())
			assert.Equal(t, r.do().Error(), errs.ErrSenderNotFound.Message())
		})
	}

	a1.Updated = time.Time{}

	assert.Equal[error](t, a1.Read(ctx), errs.ErrSenderNotFound)

	ah.Delete(ctx)
}

func TestAuthAccountKeysUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	a := seed.AuthAccounts[0]
	a.EmailAddress = "updatekey@example.com"
	a.Create(ctx, false)

	as := seed.AuthSessions[0]
	as.AuthAccountID = a.ID
	as.Create(ctx, false)

	_, pub, _ := crypto.NewRSA()

	a.PublicKey = pub

	tests := map[string]struct {
		err   string
		input models.AuthSession
		want  crypto.RSAPublicKey
	}{
		"wrong account": {
			err:   errs.ErrSenderForbidden.Message(),
			input: seed.AuthSessions[0],
		},
		"good": {
			input: as,
			want:  pub,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var an models.AuthAccounts

			r := request{
				data:         a,
				method:       "PUT",
				responseType: &an,
				session:      tc.input,
				uri:          fmt.Sprintf("/auth/accounts/%s/keys", a.ID),
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				assert.Equal(t, an[0].PublicKey, tc.want)
			}
		})
	}

	a.Delete(ctx)
}

func TestAuthAccountRead(t *testing.T) {
	logger.UseTestLogger(t)

	r := request{
		method:  "GET",
		session: seed.AuthSessions[0],
		uri:     "/auth/accounts/" + seed.AuthAccounts[0].ID.String(),
	}

	var a models.AuthAccounts
	r.responseType = &a

	noError(t, r.do())
	assert.Equal(t, a[0].EmailAddress, seed.AuthAccounts[0].EmailAddress)

	r.updated = a[0].Updated

	noError(t, r.do())
}

func TestAuthAccountTOTPRead(t *testing.T) {
	logger.UseTestLogger(t)

	f := seed.AuthHouseholds[0]
	f.Create(ctx, false)

	a := seed.AuthAccounts[0]
	a.EmailAddress = "testauthaccounttotpread@example.com"
	a.Create(ctx, false)
	a.CreateTOTP(ctx)
	a.TOTPCode, _ = totp.GenerateCode(a.TOTPSecret, models.GenerateTimestamp())
	a.UpdateTOTP(ctx)

	s := models.AuthSession{
		AuthAccountID: a.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	s.Create(ctx, false)

	r := request{
		method:  "GET",
		session: s,
		uri:     "/auth/accounts/" + a.ID.String() + "/totp",
	}

	var att models.AuthAccounts

	r.responseType = &att

	noError(t, r.do())
	assert.Equal(t, att[0].TOTPBackup, a.TOTPBackup)
	assert.Equal(t, att[0].TOTPSecret, "")

	a.Delete(ctx)
	f.Delete(ctx)
}

func TestAuthAccountTOTPUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	f := models.AuthHousehold{}
	f.Create(ctx, false)

	a := seed.AuthAccounts[0]
	a.EmailAddress = "testauthaccounttotpupdate@example.com"
	a.Create(ctx, false)
	aBad := a
	aBad.CreateTOTP(ctx)
	aBad.TOTPCode = "123456"
	aGoodAdd := a
	aGoodAdd.CreateTOTP(ctx)
	aGoodAdd.TOTPCode, _ = totp.GenerateCode(aGoodAdd.TOTPSecret, models.GenerateTimestamp())
	aGoodRemove := a
	aGoodRemove.TOTPEnabled = true
	s := models.AuthSession{
		AuthAccountID: a.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	s.Create(ctx, false)

	uri := "/auth/accounts/"

	tests := []struct {
		authAccount models.AuthAccount
		err         string
		name        string
		uri         string
	}{
		{
			name: "missing body",
			err:  types.ErrEmailAddress.Message(),
			uri:  uri + "aaaaa/totp",
		},
		{
			name:        "invalid passcode",
			authAccount: aBad,
			err:         models.ErrClientBadRequestTOTP.Message(),
			uri:         uri + a.ID.String() + "/totp",
		},
		{
			name:        "good - add",
			authAccount: aGoodAdd,
			uri:         uri + a.ID.String() + "/totp",
		},
		{
			name:        "good - remove",
			authAccount: aGoodRemove,
			uri:         uri + a.ID.String() + "/totp",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r := request{
				data:    tc.authAccount,
				method:  "PUT",
				session: s,
				uri:     tc.uri,
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				updated := a.Updated.Add(time.Duration(-5) * time.Minute)
				a.Updated = updated

				var want string

				if tc.name == "good - add" {
					a.Read(ctx)

					assert.Equal(t, a.TOTPEnabled, true)
					assert.Equal(t, a.TOTPEnabled, true)

					want = "backup code"
				} else {
					a.Read(ctx)

					assert.Equal(t, a.TOTPEnabled, false)

					want = "disabled"
				}

				time.Sleep(1 * time.Second)

				assert.Contains(t, notify.Test.SMTPMessages()[0].Body, want)
			}
		})
	}

	a.Delete(ctx)
	f.Delete(ctx)
}

func TestAuthAccountUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	f := seed.AuthHouseholds[0]
	f.Create(ctx, false)

	a := seed.AuthAccounts[0]
	a.EmailAddress = "testupdate@example.com"
	a.Verified = false
	a.Create(ctx, false)
	aEmail := a
	aEmail.Password = ""
	aEmail.EmailAddress = "testupdate1@example.com"
	aEmailAdmin := aEmail
	aEmailAdmin.EmailAddress = "testupdate2@example.com"
	aEmailAdmin.Verified = true
	aPassword := aEmailAdmin
	aPassword.Password = seed.AuthAccounts[0].Password
	aPassword.Password = "supersecretgreatpassword"
	aOIDC := aPassword
	aOIDC.OIDCCode = "something"
	aOIDC.OIDCProviderType = oidc.ProviderTypeTest
	aOIDC.Password = ""
	s := models.AuthSession{
		AuthAccountID: a.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	s.Create(ctx, false)

	sa := seed.AuthSessions[0]
	sa.Admin = true
	sa.Create(ctx, false)

	ac := a
	ac.Child = true
	ac.Create(ctx, false)
	ac.Preferences.ColorAccent = types.ColorOrange
	ac.EmailAddress = "a@b.c"
	ac.Name = "test"
	ac.OIDCID = "1234"
	sc := models.AuthSession{
		AuthAccountID: ac.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	sc.Create(ctx, false)

	tests := []struct {
		account  models.AuthAccount
		notCloud bool
		err      string
		name     string
		session  models.AuthSession
	}{
		{
			name:    "invalid",
			err:     types.ErrEmailAddress.Message(),
			session: s,
		},
		{
			name:    "child",
			account: ac,
			session: sc,
		},
		{
			name:    "update email",
			account: aEmail,
			session: s,
		},
		{
			name:    "update email - admin",
			account: aEmailAdmin,
			session: sa,
		},
		{
			name:    "update password - good",
			account: aPassword,
			session: s,
		},
		{
			name:    "update password - admin - cloud",
			account: aPassword,
			err:     errs.ErrSenderBadRequest.Message(),
			session: sa,
		},
		{
			name:     "update password - admin - not cloud",
			account:  aPassword,
			notCloud: true,
			session:  sa,
		},
		{
			name:    "update oidc",
			account: aOIDC,
			session: s,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			var an models.AuthAccounts

			h.Info.Cloud = !tc.notCloud

			id := tc.session.AuthAccountID

			if tc.account.ID != uuid.Nil {
				id = tc.account.ID
			}

			if strings.Contains(tc.name, "oidc") {
				h.Config.SMTP.NoEmailDomains = []string{
					"example.com",
				}
			}

			r := request{
				data:         tc.account,
				method:       "PUT",
				responseType: &an,
				session:      tc.session,
				uri:          "/auth/accounts/" + id.String(),
			}

			assert.Equal(t, r.do().Error(), tc.err)

			msg := notify.Test.SMTPMessages()

			if tc.err == "" {
				a1 := models.AuthAccount{
					ID: an[0].ID,
				}
				a1.Read(ctx)

				assert.Equal(t, an[0].EmailAddress, a1.EmailAddress)
				assert.Equal(t, an[0].PasswordHash, "")

				switch {
				case tc.account.Child:
					assert.Equal(t, an[0].EmailAddress != ac.EmailAddress, true)
					assert.Equal(t, an[0].Name != ac.Name, true)
					assert.Equal(t, an[0].OIDCID != ac.OIDCID, true)
				case tc.account.Password != "" && !tc.session.Admin || tc.notCloud:
					assert.Contains(t, msg[0].Subject, "Password Change Confirmation")

					var as models.AuthSessions

					r := request{
						data:         tc.account,
						method:       "POST",
						responseType: &as,
						uri:          "/auth/signin",
					}

					noError(t, r.do())
					assert.Equal(t, as[0].AuthAccountID, an[0].ID)
				case tc.account.OIDCCode != "":
					assert.Equal(t, msg[1].Subject, "Sign In With  Enabled")
					assert.Equal(t, an[0].OIDCCode, "")
				default:
					if len(msg) == 2 {
						assert.Contains(t, msg[1].Subject, "Email Address Updated")
					} else {
						assert.Contains(t, msg[0].Subject, "Email Address Updated")
					}

					an[0].Updated = time.Time{}
					an[0].Read(ctx)

					var want *uuid.NullUUID

					if !tc.account.Verified {
						want = tc.account.VerificationToken
					}

					assert.Equal(t, an[0].VerificationToken, want)
					assert.Equal(t, an[0].Verified, tc.account.Verified)
				}
			}
		})
	}

	h.Info.Cloud = true

	a.Delete(ctx)
	ac.Delete(ctx)
	f.Delete(ctx)
}

func TestAuthAccountVerifyRead(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	a1 := seed.AuthAccounts[0]
	a1.EmailAddress = "testauthaccountverify1@example.com"
	a1.Verified = false
	a1.Create(ctx, false)

	aaah := models.AuthAccountAuthHousehold{
		AuthAccountID:   &a1.ID,
		AuthHouseholdID: ah.ID,
	}
	models.Create(ctx, &aaah, models.CreateOpts{})

	as := models.AuthSession{
		AuthAccountID: a1.ID,
		Expires:       seed.AuthSessions[0].Expires,
	}
	as.Create(ctx, false)

	tests := map[string]models.AuthSession{
		"unverified": as,
		"verified":   seed.AuthSessions[0],
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r := request{
				method:  "GET",
				session: tc,
				uri:     "/auth/verify",
			}

			noError(t, r.do())

			if name == "unverified" {
				time.Sleep(1 * time.Second)

				assert.Contains(t, notify.Test.SMTPMessages()[0].Subject, "Verify Your Account")
			}
		})
	}

	a1.Delete(ctx)
	ah.Delete(ctx)
}

func TestAuthAccountVerifyUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	a1 := seed.AuthAccounts[0]
	a1.EmailAddress = "testauthaccountverify1@example.com"
	a1.Verified = false
	a1.Create(ctx, false)
	a2 := a1
	a2.EmailAddress = "testauthaccountverify2@example.com"
	a2.Verified = false
	a2.Create(ctx, false)

	tests := []struct {
		err   string
		id    string
		name  string
		token string
	}{
		{
			name:  "invalid",
			err:   errs.ErrSenderBadRequest.Message(),
			id:    "aaaaaa",
			token: "aaaaaa",
		},
		{
			name:  "bad token",
			err:   errs.ErrSenderBadRequest.Message(),
			id:    a2.ID.String(),
			token: "aaaaaa",
		},
		{
			name:  "wrong token for user",
			err:   errs.ErrSenderNotFound.Message(),
			id:    a2.ID.String(),
			token: a1.VerificationToken.UUID.String(),
		},
		{
			name:  "good",
			id:    a1.ID.String(),
			token: a1.VerificationToken.UUID.String(),
		},
		{
			name:  "used token",
			err:   errs.ErrSenderNotFound.Message(),
			id:    a1.ID.String(),
			token: a1.VerificationToken.UUID.String(),
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			r := request{
				method: "PUT",
				uri:    fmt.Sprintf("/auth/verify?id=%s&token=%s", tc.id, tc.token),
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				time.Sleep(1 * time.Second)

				assert.Contains(t, notify.Test.SMTPMessages()[0].Subject, "Account Verified")
			}
		})
	}

	a1.Delete(ctx)
	a2.Delete(ctx)
}

func TestAuthAccountsRead(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.AuthSessions[0]
	s.Admin = true
	s.Create(ctx, false)

	tests := map[string]struct {
		filter  string
		session models.AuthSession
		want    int
	}{
		"non-admin": {
			filter:  "asdfasdfasdfsadf",
			session: seed.AuthSessions[0],
			want:    1,
		},
		"admin": {
			session: s,
			want:    5,
		},
		"admin - condition": {
			filter:  "jane",
			session: s,
			want:    1,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var a models.AuthAccounts

			msg := request{
				method:       "GET",
				responseType: &a,
				session:      tc.session,
				uri:          fmt.Sprintf("/auth/accounts?filter=%s", tc.filter),
			}.do()

			noError(t, msg)
			assert.Equal(t, len(a), tc.want)

			if tc.filter == "" {
				assert.Equal(t, msg.DataTotal, 5)
			}
		})
	}

	s.Delete(ctx)

	h.Config.SMTP.NoEmailDomains = []string{}
}
