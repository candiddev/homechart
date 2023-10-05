package controllers

import (
	"fmt"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/pquerna/otp/totp"
)

func TestAuthResetCreate(t *testing.T) {
	logger.UseTestLogger(t)

	f := seed.AuthHouseholds[0]
	f.Create(ctx, false)

	a := seed.AuthAccounts[0]
	a.EmailAddress = "testauthaccountresetcreate@example.com"
	a.Create(ctx, false)
	a.CreateTOTP(ctx)
	totp.GenerateCode(a.TOTPSecret, models.GenerateTimestamp())
	a.UpdateTOTP(ctx)

	tests := map[string]struct {
		account models.AuthAccount
		err     string
	}{
		"invalid": {
			err: types.ErrEmailAddress.Message(),
		},
		"bademail": {
			account: models.AuthAccount{
				EmailAddress: "bademail@example.com",
			},
			err: errs.ErrSenderNotFound.Message(),
		},
		"good": {
			account: models.AuthAccount{
				EmailAddress: a.EmailAddress,
			},
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r := request{
				data:   tc.account,
				method: "POST",
				uri:    "/auth/reset",
			}

			assert.Equal(t, r.do().Error(), tc.err)

			if tc.err == "" {
				aa := tc.account

				if aa.EmailAddress == seed.AuthAccounts[0].EmailAddress {
					a.ReadTOTPBackup(ctx)

					assert.Equal(t, a.TOTPBackup, "")
					assert.Contains(t, notify.Test.SMTPMessages()[0].Body, fmt.Sprintf("%s/reset?email=%s&token=%s", h.Config.App.BaseURL, a.EmailAddress, a.PasswordResetToken.UUID))
				}

				if aa.EmailAddress == "bademail@example.com" {
					assert.Contains(t, notify.Test.SMTPMessages()[0].Body, "Unfortunately")
				}
			}
		})
	}

	a.Delete(ctx)
	f.Delete(ctx)
}

func TestAuthResetUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	f := seed.AuthHouseholds[0]
	f.Create(ctx, false)

	a1 := seed.AuthAccounts[0]
	a1.EmailAddress = "testauthaccountresetupdate1@example.com"
	a1.Create(ctx, false)

	e := models.GenerateTimestamp().Add(1 * time.Hour)
	a1.PasswordResetExpires = e
	rt := models.GenerateUUID()
	a1.PasswordResetToken = types.UUIDToNullUUID(rt)
	a1.UpdatePasswordReset(ctx)
	a2 := a1
	a2.EmailAddress = "testauthaccountresetupdate2@example.com"
	a2.Create(ctx, false)

	e = models.GenerateTimestamp().Add(-1 * time.Hour)
	a2.PasswordResetExpires = e
	rt = models.GenerateUUID()
	a2.PasswordResetToken = types.UUIDToNullUUID(rt)
	a2.UpdatePasswordReset(ctx)

	a1.Password = "ANewPassword!"
	tests := map[string]struct {
		account *models.AuthAccount
		err     string
	}{
		"No data": {
			err: errs.ErrSenderNotFound.Message(),
		},
		"bad data": {
			account: &a2,
		},
		"wrong token user": {
			account: &models.AuthAccount{
				EmailAddress:       a1.EmailAddress,
				PasswordResetToken: a2.PasswordResetToken,
			},
		},
		"expired token": {
			account: &a2,
		},
		"good": {
			account: &a1,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r := request{
				data:   tc.account,
				method: "PUT",
				uri:    "/auth/reset",
			}
			res := r.do()

			assert.Equal(t, res.Error(), tc.err)

			if res.Status == 200 {
				assert.Contains(t, notify.Test.SMTPMessages()[0].Subject, "Confirmation")
			}
		})
	}

	a1.Delete(ctx)
	a2.Delete(ctx)
	f.Delete(ctx)
}
