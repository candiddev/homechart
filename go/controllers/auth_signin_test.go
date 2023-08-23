package controllers

import (
	"strings"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/oidc"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/pquerna/otp/totp"
	"golang.org/x/crypto/bcrypt"
)

func TestAuthSignInCreate(t *testing.T) {
	logger.UseTestLogger(t)

	aa := h.Config.App.AdminEmailAddresses
	h.Config.App.AdminEmailAddresses = []string{
		seed.AuthAccounts[4].EmailAddress.String(),
	}

	noAuthAccountEmail := models.AuthAccount{
		Password: seed.AuthAccounts[0].Password,
	}
	noAuthAccountPassword := models.AuthAccount{
		EmailAddress: seed.AuthAccounts[0].EmailAddress,
	}
	badAuthAccountEmail := models.AuthAccount{
		EmailAddress: "wrong@wrong.com",
		Password:     types.Password(seed.AuthAccounts[0].EmailAddress),
	}
	badAuthAccountPassword := models.AuthAccount{
		EmailAddress: seed.AuthAccounts[0].EmailAddress,
		Password:     "wrongwrongwrong",
	}
	authAccountPasscode := seed.AuthAccounts[0]
	authAccountPasscode.Password = types.Password(seed.AuthAccounts[0].EmailAddress)
	authAccountPasscode.EmailAddress = "testauthsessionpasscode@example.com"
	authAccountPasscode.Create(ctx, false)
	authAccountPasscode.CreateTOTP(ctx)
	authAccountPasscode.TOTPCode, _ = totp.GenerateCode(authAccountPasscode.TOTPSecret, models.GenerateTimestamp())
	authAccountPasscode.UpdateTOTP(ctx)

	authAccountOIDC := seed.AuthAccounts[0]
	authAccountOIDC.EmailAddress = "testauthsessionoidc@example.com"
	authAccountOIDC.Password = ""
	authAccountOIDC.PasswordHash = ""
	authAccountOIDC.OIDCID = "testauthsessionoidc@example.com"
	authAccountOIDC.OIDCProviderType = oidc.ProviderTypeTest
	authAccountOIDC.Create(ctx, false)

	badAuthAccountPasscode := models.AuthAccount{
		EmailAddress: authAccountPasscode.EmailAddress,
		Password:     authAccountPasscode.Password,
		TOTPCode:     "123456",
	}
	goodAuthAccountPasscode := models.AuthAccount{
		EmailAddress: authAccountPasscode.EmailAddress,
		Password:     authAccountPasscode.Password,
		TOTPCode:     authAccountPasscode.TOTPCode,
	}
	authAccountRemember := models.AuthAccount{
		EmailAddress: seed.AuthAccounts[0].EmailAddress,
		Password:     types.Password(seed.AuthAccounts[0].EmailAddress),
		RememberMe:   true,
	}

	authAccountBcyrpt := models.AuthAccount{
		EmailAddress: "testbcrypt@example.com",
		Password:     types.Password("password"),
		RememberMe:   true,
	}
	authAccountBcyrpt.Create(ctx, false)

	b, _ := bcrypt.GenerateFromPassword([]byte("password"), bcrypt.DefaultCost)
	authAccountBcyrpt.PasswordHash = string(b)
	h.Config.PostgreSQL.Exec(ctx, "update auth_account set password_hash = :password_hash where id = :id", authAccountBcyrpt)

	child := seed.AuthAccounts[2]
	child.Password = "testtest"

	tests := map[string]struct {
		err     string
		account models.AuthAccount
	}{
		"no email": {
			account: noAuthAccountEmail,
			err:     types.MsgEmailAddress,
		},
		"no password": {
			account: noAuthAccountPassword,
			err:     errClientBadRequestPassword.Message(),
		},
		"no password oidc": {
			account: models.AuthAccount{
				EmailAddress: authAccountOIDC.EmailAddress,
			},
			err: errClientBadRequestPassword.Message(),
		},
		"bad email": {
			account: badAuthAccountEmail,
			err:     errClientBadRequestAuthAccountMissing.Message(),
		},
		"bad password": {
			account: badAuthAccountPassword,
			err:     errClientBadRequestPassword.Message(),
		},
		"bad auth account passoode": {
			account: badAuthAccountPasscode,
			err:     models.ErrClientBadRequestTOTP.Message(),
		},
		"bad child account": {
			account: child,
			err:     errClientBadRequestAuthAccountMissing.Message(),
		},
		"account with oidc": {
			account: models.AuthAccount{
				EmailAddress:     "oidc@homechart.app",
				OIDCCode:         authAccountOIDC.EmailAddress.String(),
				OIDCProviderType: oidc.ProviderTypeTest,
			},
		},
		"no account oidc, no tos": {
			err: errClientBadRequestAuthAccountMissing.Message(),
			account: models.AuthAccount{
				EmailAddress:     "oidc@homechart.app",
				OIDCCode:         "oidccreate@example.com",
				OIDCProviderType: oidc.ProviderTypeTest,
			},
		},
		"account oidc": {
			account: models.AuthAccount{
				EmailAddress: "oidc@homechart.app",
				PermissionsAccount: models.Permissions{
					Plan: models.PermissionView,
				},
				OIDCCode:         "oidccreate@example.com",
				OIDCProviderType: oidc.ProviderTypeTest,
				ToSAccepted:      true,
			},
		},
		"good auth account passoode": {
			account: goodAuthAccountPasscode,
		},
		"good remember": {
			account: authAccountRemember,
		},
		"good non-admin": {
			account: models.AuthAccount{
				EmailAddress: seed.AuthAccounts[0].EmailAddress,
				Password:     types.Password(seed.AuthAccounts[0].EmailAddress),
			},
		},
		"good admin": {
			account: models.AuthAccount{
				EmailAddress: seed.AuthAccounts[4].EmailAddress,
				Password:     types.Password(seed.AuthAccounts[4].EmailAddress),
			},
		},
		"bcrypt to argon2": {
			account: models.AuthAccount{
				EmailAddress: authAccountBcyrpt.EmailAddress,
				Password:     types.Password("password"),
			},
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var a models.AuthSessions

			r := request{
				data:         tc.account,
				method:       "POST",
				responseType: &a,
				uri:          "/auth/signin",
			}

			msg := r.do()

			assert.Equal(t, msg.Error(), tc.err)

			msgs := notify.Test.SMTPMessages()

			if tc.account.EmailAddress == "testauthsessionverify@example.com" {
				assert.Contains(t, msgs[0].Subject, "Verify Your Account")
			}

			if msg.Success {
				assert.Equal(t, "Unknown", a[0].Name)

				a[0].Read(ctx, false)

				if tc.account.EmailAddress != seed.AuthAccounts[4].EmailAddress {
					assert.Equal(t, a[0].Admin, false)
				} else {
					assert.Contains(t, msgs[0].Body, "Unknown")
					assert.Equal(t, msgs[0].Subject, "New Device Sign In")
					assert.Equal(t, a[0].Admin, true)
				}

				if name == "account oidc" {
					assert.Equal(t, a[0].PermissionsAccount.Plan, models.PermissionView)

					aa := models.AuthAccount{
						ID: a[0].AuthAccountID,
					}

					aa.Delete(ctx)
				}

				if tc.account.EmailAddress == authAccountBcyrpt.EmailAddress {
					aa := models.AuthAccount{
						ID: a[0].AuthAccountID,
					}
					aa.ReadPasswordHash(ctx)

					assert.Equal(t, strings.HasPrefix(aa.PasswordHash, "$argon2id"), true)
				}

				a[0].Delete(ctx)
			}
		})
	}

	authAccountOIDC.Delete(ctx)
	authAccountPasscode.Delete(ctx)

	h.Config.App.AdminEmailAddresses = aa
}

func TestAuthSignInRead(t *testing.T) {
	logger.UseTestLogger(t)

	var a models.AuthSessions

	r := request{
		method:       "GET",
		responseType: &a,
		session:      seed.AuthSessions[0],
		uri:          "/auth/signin",
	}

	noError(t, r.do())
}
