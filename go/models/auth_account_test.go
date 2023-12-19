package models

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/oidc"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/cryptolib"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
	"github.com/pquerna/otp/totp"
)

func TestAuthAccountNotifyTypeIsPermitted(t *testing.T) {
	logger.UseTestLogger(t)

	id := GenerateUUID()

	ahp := AuthHouseholdsPermissions{
		{
			AuthHouseholdID: id,
			Permissions: Permissions{
				Calendar: PermissionNone,
				Plan:     PermissionNone,
			},
		},
	}

	tests := map[string]struct {
		input AuthAccountNotifyType
		want  bool
	}{
		"Calendar": {
			input: AuthAccountNotifyTypeEventHousehold,
			want:  false,
		},
		"Cook": {
			input: AuthAccountNotifyTypeMealPlanCook,
			want:  true,
		},
		"System": {
			input: AuthAccountNotifyTypeSystem,
			want:  true,
		},
		"Plan": {
			input: AuthAccountNotifyTypeTaskHousehold,
			want:  false,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, tc.input.isPermitted(&ahp[0].AuthHouseholdID, ahp), tc.want)
		})
	}
}

func TestAuthAccountReadAgenda(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "agenda@example.com"
	aa.Create(ctx, false)

	as := seed.AuthSessions[0]
	as.AuthAccountID = aa.ID
	as.WebPush = &notify.WebPushClient{
		Endpoint: "token1",
	}
	as.Create(ctx, false)

	// Create test data
	today := GenerateTimestamp()

	ba := seed.BudgetAccounts[0]
	ba.AuthHouseholdID = seed.AuthHouseholds[1].ID
	ba.create(ctx, CreateOpts{})

	bt := seed.BudgetRecurrences[0]
	bt.AuthHouseholdID = seed.AuthHouseholds[1].ID
	bt.BudgetAccountID = ba.ID
	bt.create(ctx, CreateOpts{})

	ce := seed.CalendarEvents[0]
	ce.AuthAccountID = &seed.AuthAccounts[3].ID
	ce.create(ctx, CreateOpts{})

	cm := seed.CookMealTimes[0]
	cm.AuthHouseholdID = seed.AuthHouseholds[1].ID
	cm.create(ctx, CreateOpts{})

	ReadAll(ctx, &cm, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[1].ID,
				},
			},
		},
	})

	cs := seed.CookMealPlans[2]
	cs.AuthHouseholdID = seed.AuthHouseholds[1].ID
	cs.CookMealTimeID = cm.ID
	cs.create(ctx, CreateOpts{})

	pt := seed.PlanTasks[0]
	pt.AuthAccountID = &seed.AuthAccounts[3].ID
	pt.DueDate = &today
	pt.ID = uuid.Nil
	pt.PlanProjectID = nil
	pt.create(ctx, CreateOpts{})

	// Test assistant
	assert.Equal(t, AuthAccountReadAgendaAssistant(ctx, &seed.AuthAccounts[3].ID, types.CivilDateToday(), "today"), "You have 1 recurring transaction, 1 event, 1 meal, and 1 task scheduled for today.")

	// Test notify
	got, err := AuthAccountsReadAgendaNotify(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(got), 4)

	for _, n := range got {
		switch *n.AuthAccountID {
		case seed.AuthAccounts[3].ID:
			assert.Equal(t, n.BodySMTP, fmt.Sprintf(`Here's a summary of your daily agenda:

- 1 Recurring Transaction
- 1 Event
- 1 Meal Plan
- 1 Task

[View your calendar](%s/calendar)`, c.App.BaseURL))
			assert.Equal(t, n.BodyWebPush, `1 Recurring Transaction
1 Event
1 Meal Plan
1 Task

Press here to view your calendar`)
		case aa.ID:
			assert.Equal(t, n.BodyWebPush, `Nothing scheduled today!

Press here to view your calendar`)

			assert.Equal(t, n.ToWebPush, notify.WebPushClients{
				{
					Endpoint: "token1",
				},
			})
		}
	}

	Delete(ctx, &ba, DeleteOpts{})
	Delete(ctx, &bt, DeleteOpts{})
	Delete(ctx, &ce, DeleteOpts{})
	Delete(ctx, &cm, DeleteOpts{})
	Delete(ctx, &cs, DeleteOpts{})
	Delete(ctx, &pt, DeleteOpts{})

	aa.Delete(ctx)
}

func TestAuthAccountsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var aas AuthAccounts

	for i := 1; i <= 51; i++ {
		aa := seed.AuthAccounts[0]
		aa.EmailAddress = types.EmailAddress(fmt.Sprintf("%02dtestauthaccountsread@example.com", i))
		aa.Create(ctx, false)

		aas = append(aas, aa)
	}

	// Email Address tests
	tests := map[string]struct {
		inputEmail  types.EmailAddress
		inputOffset int
		want        int
	}{
		"no filter, no pagination": {
			inputEmail:  types.EmailAddress(""),
			inputOffset: 0,
			want:        50,
		},
		"no filter, with pagination": {
			inputEmail:  types.EmailAddress(""),
			inputOffset: 50,
			want:        6,
		},
		"with filter, no pagination": {
			inputEmail:  types.EmailAddress("testauthaccountsread"),
			inputOffset: 0,
			want:        50,
		},
		"with filter, with pagination": {
			inputEmail:  types.EmailAddress("testauthaccountsread"),
			inputOffset: 50,
			want:        1,
		},
		"with filter, no pagination, bad email": {
			inputEmail:  seed.AuthAccounts[0].EmailAddress,
			inputOffset: 0,
			want:        1,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			a, total, err := AuthAccountsRead(ctx, tc.inputEmail, uuid.Nil, tc.inputOffset)
			assert.Equal(t, err, nil)
			assert.Equal(t, len(a), tc.want)

			if tc.inputEmail == "" {
				assert.Equal(t, total, 56)
			}
		})
	}

	// ID tests
	a, _, err := AuthAccountsRead(ctx, "", seed.AuthAccounts[0].ID, 0)
	assert.Equal(t, err, nil)
	assert.Equal(t, a[0].EmailAddress, seed.AuthAccounts[0].EmailAddress)

	_, total, err := AuthAccountsRead(ctx, "", seed.AuthAccounts[0].PrimaryAuthHouseholdID.UUID, 0)
	assert.Equal(t, err, nil)
	assert.Equal(t, total, 3)

	for i := range aas {
		aas[i].Delete(ctx)
	}
}

func TestAuthAccountsReadNotifications(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testauthaccountsreadnotify@example.com"
	aa.Preferences.IgnoreDeviceCalendarEvent = true
	aa.Preferences.IgnoreDevicePlanTask = true
	aa.Preferences.IgnoreEmailNewsletter = true
	aa.Preferences.NotificationsHouseholds = []AuthAccountPreferencesNotificationsHousehold{
		{
			AuthHouseholdID:              seed.AuthHouseholds[0].ID,
			IgnoreDeviceCalendarEvent:    true,
			IgnoreDeviceCookMealPlanCook: true,
			IgnoreDevicePlanTask:         true,
			IgnoreEmailCookMealPlanPrep:  true,
		},
	}
	aa.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	aaah.create(ctx, CreateOpts{})

	soon := GenerateTimestamp().Add(10 * time.Hour)

	as1 := AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
		Expires:       soon,
		WebPush: &notify.WebPushClient{
			Endpoint: "endpoint1",
		},
	}
	as1.Create(ctx, false)

	as2 := AuthSession{
		AuthAccountID: seed.AuthAccounts[0].ID,
		Expires:       soon,
		WebPush: &notify.WebPushClient{
			Endpoint: "endpoint2",
		},
	}
	as2.Create(ctx, false)

	as3 := AuthSession{
		AuthAccountID: seed.AuthAccounts[1].ID,
		Expires:       soon,
		WebPush: &notify.WebPushClient{
			Endpoint: "endpoint3",
		},
	}
	as3.Create(ctx, false)

	/*
		Inputs:
		- AuthAccountID
		- AuthHouseholdID,
		- Type,
		- Output FCM,
		- Output SMTP
	*/

	a0p := seed.AuthAccounts[0].Preferences
	a0p.HideCalendarHealthLogs = types.SliceString{}
	a0p.HideComponents = types.SliceString{}

	a1p := seed.AuthAccounts[1].Preferences
	a1p.HideCalendarHealthLogs = types.SliceString{}
	a1p.HideComponents = types.SliceString{}

	a3p := seed.AuthAccounts[3].Preferences
	a3p.HideCalendarHealthLogs = types.SliceString{}
	a3p.HideComponents = types.SliceString{}

	a4p := seed.AuthAccounts[4].Preferences
	a4p.HideCalendarHealthLogs = types.SliceString{}
	a4p.HideComponents = types.SliceString{}

	tests := map[string]struct {
		authAccountID   *uuid.UUID
		authHouseholdID *uuid.UUID
		notifyType      AuthAccountNotifyType
		want            Notifications
	}{
		"account - prep": {
			authAccountID:   &seed.AuthAccounts[0].ID,
			authHouseholdID: &seed.AuthHouseholds[0].ID,
			notifyType:      AuthAccountNotifyTypeMealPlanPrep,
			want: Notifications{
				{
					AuthAccountID: &seed.AuthAccounts[0].ID,
					ISO639Code:    seed.AuthAccounts[0].ISO639Code,
					Preferences:   a0p,
					ToWebPush: notify.WebPushClients{
						as1.WebPush,
						as2.WebPush,
					},
					ToSMTP: seed.AuthAccounts[0].EmailAddress.String(),
				},
				{
					AuthAccountID: &seed.AuthAccounts[1].ID,
					ISO639Code:    seed.AuthAccounts[1].ISO639Code,
					Preferences:   a1p,
					ToWebPush: notify.WebPushClients{
						as3.WebPush,
					},
					ToSMTP: seed.AuthAccounts[1].EmailAddress.String(),
				},
			},
		},
		"household - cook": {
			authAccountID:   nil,
			authHouseholdID: &seed.AuthHouseholds[0].ID,
			notifyType:      AuthAccountNotifyTypeMealPlanCook,
			want: Notifications{
				{
					AuthAccountID: &seed.AuthAccounts[0].ID,
					ISO639Code:    seed.AuthAccounts[0].ISO639Code,
					Preferences:   a0p,
					ToWebPush: notify.WebPushClients{
						as1.WebPush,
						as2.WebPush,
					},
					ToSMTP: seed.AuthAccounts[0].EmailAddress.String(),
				},
				{
					AuthAccountID: &seed.AuthAccounts[1].ID,
					ISO639Code:    seed.AuthAccounts[1].ISO639Code,
					Preferences:   a1p,
					ToWebPush: notify.WebPushClients{
						as3.WebPush,
					},
					ToSMTP: seed.AuthAccounts[1].EmailAddress.String(),
				},
				{
					AuthAccountID: &aa.ID,
					ISO639Code:    aa.ISO639Code,
					Preferences:   aa.Preferences,
					ToSMTP:        aa.EmailAddress.String(),
				},
			},
		},
		"household - plan": {
			authAccountID:   nil,
			authHouseholdID: &seed.AuthHouseholds[0].ID,
			notifyType:      AuthAccountNotifyTypeMealPlanCook,
			want: Notifications{
				{
					AuthAccountID: &seed.AuthAccounts[0].ID,
					ISO639Code:    seed.AuthAccounts[0].ISO639Code,
					Preferences:   a0p,
					ToWebPush: notify.WebPushClients{
						as1.WebPush,
						as2.WebPush,
					},
					ToSMTP: seed.AuthAccounts[0].EmailAddress.String(),
				},
				{
					AuthAccountID: &seed.AuthAccounts[1].ID,
					ISO639Code:    seed.AuthAccounts[1].ISO639Code,
					Preferences:   a1p,
					ToWebPush: notify.WebPushClients{
						as3.WebPush,
					},
					ToSMTP: seed.AuthAccounts[1].EmailAddress.String(),
				},
				{
					AuthAccountID: &aa.ID,
					ISO639Code:    aa.ISO639Code,
					Preferences:   aa.Preferences,
					ToSMTP:        aa.EmailAddress.String(),
				},
			},
		},
		"oops": {
			authAccountID:   nil,
			authHouseholdID: nil,
			notifyType:      AuthAccountNotifyTypeMealPlanCook,
			want:            Notifications{},
		},
		"household - newsletter": {
			authAccountID:   nil,
			authHouseholdID: nil,
			notifyType:      AuthAccountNotifyTypeNewsletter,
			want: Notifications{
				{
					AuthAccountID: &seed.AuthAccounts[0].ID,
					ISO639Code:    seed.AuthAccounts[0].ISO639Code,
					Preferences:   a0p,
					ToSMTP:        seed.AuthAccounts[0].EmailAddress.String(),
				},
				{
					AuthAccountID: &seed.AuthAccounts[1].ID,
					ISO639Code:    seed.AuthAccounts[1].ISO639Code,
					Preferences:   a1p,
					ToSMTP:        seed.AuthAccounts[1].EmailAddress.String(),
				},
				{
					AuthAccountID: &seed.AuthAccounts[3].ID,
					ISO639Code:    seed.AuthAccounts[3].ISO639Code,
					Preferences:   a3p,
					ToSMTP:        seed.AuthAccounts[3].EmailAddress.String(),
				},
				{
					AuthAccountID: &seed.AuthAccounts[4].ID,
					ISO639Code:    seed.AuthAccounts[4].ISO639Code,
					Preferences:   a4p,
					ToSMTP:        seed.AuthAccounts[4].EmailAddress.String(),
				},
			},
		},
		"household - system": {
			authAccountID:   nil,
			authHouseholdID: &seed.AuthHouseholds[0].ID,
			notifyType:      AuthAccountNotifyTypeSystem,
			want: Notifications{
				{
					AuthAccountID: &seed.AuthAccounts[0].ID,
					ISO639Code:    seed.AuthAccounts[0].ISO639Code,
					Preferences:   a0p,
					ToWebPush: notify.WebPushClients{
						as1.WebPush,
						as2.WebPush,
					},
					ToSMTP: seed.AuthAccounts[0].EmailAddress.String(),
				},
				{
					AuthAccountID: &seed.AuthAccounts[1].ID,
					ISO639Code:    seed.AuthAccounts[1].ISO639Code,
					Preferences:   a1p,
					ToWebPush: notify.WebPushClients{
						as3.WebPush,
					},
					ToSMTP: seed.AuthAccounts[1].EmailAddress.String(),
				},
				{
					AuthAccountID: &aa.ID,
					ISO639Code:    aa.ISO639Code,
					Preferences:   aa.Preferences,
					ToSMTP:        aa.EmailAddress.String(),
				},
			},
		},
		"plan complete": {
			authAccountID:   &seed.AuthAccounts[1].ID,
			authHouseholdID: &seed.AuthHouseholds[0].ID,
			notifyType:      AuthAccountNotifyTypeTaskComplete,
			want: Notifications{
				{
					AuthAccountID: &seed.AuthAccounts[0].ID,
					ISO639Code:    seed.AuthAccounts[0].ISO639Code,
					Preferences:   a0p,
					ToWebPush: notify.WebPushClients{
						as1.WebPush,
						as2.WebPush,
					},
				},
			},
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, AuthAccountsReadNotifications(ctx, tc.authAccountID, tc.authHouseholdID, tc.notifyType), tc.want)
		})
	}

	aa.Delete(ctx)
	as1.Delete(ctx)
	as2.Delete(ctx)
	as3.Delete(ctx)
}

func TestAuthAccountCreate(t *testing.T) {
	logger.UseTestLogger(t)

	email := "TestCreate@example.com"
	aa := seed.AuthAccounts[0]
	aa.EmailAddress = types.EmailAddress(email)
	aa.LastActivity = time.Time{}
	aa.SubscriptionReferrerCode = "test"

	assert.Equal(t, aa.Create(ctx, false), nil)
	assert.Equal(t, strings.ToLower(email), aa.EmailAddress.String())
	assert.Equal(t, types.CivilDateOf(aa.LastActivity), types.CivilDateOf(GenerateTimestamp()))
	assert.Equal(t, aa.SubscriptionReferrerCode, "test")

	aa.Delete(ctx)

	aa.EmailAddress = "nopassword@example.com"
	aa.OIDCID = "something"
	aa.OIDCProviderType = oidc.ProviderTypeGoogle

	assert.Equal(t, aa.Create(ctx, false), nil)
	assert.Equal(t, aa.PasswordHash, "")

	aa.Delete(ctx)

	ac := aa
	ac.Child = true

	assert.Equal(t, ac.Create(ctx, false), nil)
	assert.Equal(t, aa.EmailAddress != ac.EmailAddress, true)
	assert.Equal(t, ac.PasswordHash, "")

	ac.Delete(ctx)
	aa.Delete(ctx)
}

func TestAuthAccountCreateTOTP(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testauthaccounttotpgenerate@example.com"
	aa.Create(ctx, false)

	output := AuthAccount{
		ID:           aa.ID,
		EmailAddress: aa.EmailAddress,
	}
	assert.Equal(t, output.CreateTOTP(ctx), nil)
	assert.Equal(t, output.TOTPSecret != "", true)
	assert.Equal(t, output.TOTPQR != "", true)

	aa.Delete(ctx)
}

func TestAuthAccountDelete(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testdelete@example.com"
	aa.Create(ctx, false)

	assert.Equal(t, aa.Delete(ctx), nil)
}

func TestAuthAccountReadOIDC(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testread@example.com"
	aa.OIDCProviderType = oidc.ProviderTypeGoogle
	aa.OIDCID = "1"
	aa.Create(ctx, false)

	var a AuthAccount

	a.OIDCProviderType = aa.OIDCProviderType
	a.OIDCID = aa.OIDCID

	assert.Equal(t, a.ReadOIDCID(ctx), nil)
	assert.Equal(t, a, AuthAccount{
		ID:               aa.ID,
		OIDCID:           aa.OIDCID,
		OIDCProviderType: aa.OIDCProviderType,
	})

	aa.Delete(ctx)
}

func TestAuthAccountRead(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testread@example.com"
	aa.LastActivity = seed.AuthAccounts[1].LastActivity
	aa.Create(ctx, false)

	output1 := AuthAccount{
		ID: aa.ID,
	}

	assert.Equal(t, output1.Read(ctx), nil)
	assert.Equal(t, aa.EmailAddress, output1.EmailAddress)
	assert.Equal(t, types.CivilDateOf(output1.LastActivity), types.CivilDateOf(GenerateTimestamp()))

	output2 := AuthAccount{
		ID:      output1.ID,
		Updated: output1.Updated,
	}

	assert.Equal[error](t, output2.Read(ctx), errs.ErrSenderNoContent)
	assert.Equal(t, output2.EmailAddress, types.EmailAddress(""))

	var output AuthAccount

	cache := Cache{
		ID:        &aa.ID,
		TableName: "auth_account",
		Value:     &output,
	}
	cache.Get(ctx)

	output.CollapsedNotesPages = aa.CollapsedNotesPages
	output.CollapsedPlanProjects = aa.CollapsedPlanProjects
	output.CollapsedPlanTasks = aa.CollapsedPlanProjects
	output.HideCalendarICalendars = aa.HideCalendarICalendars
	output.Preferences.HideCalendarHealthLogs = aa.Preferences.HideCalendarHealthLogs
	output.Preferences.HideComponents = aa.Preferences.HideComponents

	assert.Equal(t, output, output1)

	aa.Delete(ctx)
}

func TestAuthAccountReadPasswordHash(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testreadpasshash@example.com"
	aa.Child = true
	aa.Create(ctx, false)

	output := AuthAccount{
		EmailAddress: aa.EmailAddress,
	}

	assert.Equal(t, output.ReadPasswordHash(ctx), nil)
	assert.Equal(t, output.PasswordHash, aa.PasswordHash)
	assert.Equal(t, output.Child, true)

	aa.Delete(ctx)
}

func TestAuthAccountReadPasswordReset(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testreadpasstoken@example.com"
	aa.Create(ctx, false)

	rt := GenerateUUID()
	update := AuthAccount{
		EmailAddress:         aa.EmailAddress,
		PasswordResetToken:   types.UUIDToNullUUID(rt),
		PasswordResetExpires: GenerateTimestamp(),
	}
	update.UpdatePasswordReset(ctx)

	output := AuthAccount{
		EmailAddress: aa.EmailAddress,
	}

	assert.Equal(t, output.ReadPasswordReset(ctx), nil)
	assert.Equal(t, aa.ISO639Code, output.ISO639Code)
	assert.Equal(t, update.PasswordResetExpires, output.PasswordResetExpires)

	aa.Delete(ctx)
}

func TestAuthAccountReadTOTP(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testauthaccounttotpread@example.com"
	aa.Create(ctx, false)

	aatn := AuthAccount{
		ID:           aa.ID,
		EmailAddress: aa.EmailAddress,
	}
	aatn.CreateTOTP(ctx)
	aatn.TOTPCode, _ = totp.GenerateCode(aatn.TOTPSecret, GenerateTimestamp())
	aatn.UpdateTOTP(ctx)

	output := AuthAccount{
		ID:           aa.ID,
		EmailAddress: aa.EmailAddress,
	}

	assert.Equal(t, output.ReadTOTPBackup(ctx), nil)
	assert.Equal(t, output.TOTPBackup, aatn.TOTPBackup)

	aa.Delete(ctx)
}

func TestAuthAccountUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testupdate@example.com"
	aa.LastActivity = time.Time{}
	aa.Verified = false
	aa.Create(ctx, false)

	aa.EmailAddress = "test@example.com"
	token := aa.VerificationToken

	assert.Equal(t, aa.Update(ctx), nil)
	assert.Equal(t, aa.VerificationToken, token)

	aa.CollapsedPlanProjects = types.SliceString{
		seed.PlanProjects[0].ID.String(),
	}
	aa.CollapsedPlanProjects = types.SliceString{
		seed.PlanTasks[0].ID.String(),
	}
	aa.SubscriptionReferrerCode = "testing"
	aa.Preferences.ColorAccent = types.ColorGreen
	aa.Preferences.ColorPrimary = types.ColorBlue
	aa.EmailAddress = "TEEEEESTupdate@example.com"
	aa.Name = "testing123"
	aa.Setup = true
	aa.Verified = true
	aa.VerificationToken = nil
	assert.Equal(t, aa.Update(ctx), nil)

	output := AuthAccount{
		ID: aa.ID,
	}
	output.Read(ctx)

	aa.Password = ""

	assert.Equal(t, output, aa)

	aa.Delete(ctx)
}

func TestAuthAccountUpdateICal(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "updateical@example.com"
	aa.Create(ctx, false)

	assert.Equal(t, aa.UpdateICalendarID(ctx, false), nil)

	id := aa.ICalendarID

	assert.Equal(t, aa.UpdateICalendarID(ctx, false), nil)
	assert.Equal(t, aa.ICalendarID != id, true)

	assert.Equal(t, aa.UpdateICalendarID(ctx, true), nil)
	assert.Equal(t, aa.ICalendarID, nil)

	aa.Delete(ctx)
}

func TestAuthAccountUpdateOIDC(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testupdate@example.com"
	aa.Create(ctx, false)

	aa.OIDCProviderType = oidc.ProviderTypeGoogle
	aa.OIDCID = "1"

	assert.Equal(t, aa.UpdateOIDC(ctx), nil)
	assert.Equal(t, aa.OIDCID, "1")

	aa.Delete(ctx)
}

func TestAuthAccountUpdatePasswordHash(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testupdatepasswordhash@example.com"
	aa.Create(ctx, false)

	output1 := AuthAccount{
		ID:       aa.ID,
		Password: "somepassword",
	}

	assert.Equal(t, output1.UpdatePasswordHash(ctx), nil)
	assert.Equal(t, output1.PasswordHash != aa.PasswordHash, true)

	output2 := AuthAccount{
		EmailAddress: aa.EmailAddress,
	}
	output2.ReadPasswordHash(ctx)

	assert.Equal(t, output2.PasswordHash, output1.PasswordHash)

	// Test password and OIDC clearing
	output1.TOTPSecret = "something"
	output1.UpdateTOTP(ctx)

	output1.OIDCID = "something"
	output1.OIDCProviderType = oidc.ProviderTypeGoogle
	output1.UpdateOIDC(ctx)

	assert.Equal(t, output1.PasswordHash, "")
	assert.Equal(t, output1.TOTPBackup, "")
	assert.Equal(t, output1.TOTPSecret, "")
	assert.Equal(t, output1.TOTPEnabled, false)

	output1.Password = "something"
	output1.UpdatePasswordHash(ctx)

	assert.Equal(t, output1.OIDCID, "")
	assert.Equal(t, output1.OIDCProviderType, oidc.ProviderTypeNone)

	aa.Delete(ctx)
}

func TestAuthAccountUpdatePasswordReset(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testupdatepasswordreset@example.com"
	aa.Create(ctx, false)

	rt := GenerateUUID()
	output1 := AuthAccount{
		EmailAddress:         aa.EmailAddress,
		PasswordResetExpires: GenerateTimestamp(),
		PasswordResetToken:   types.UUIDToNullUUID(rt),
	}

	assert.Equal(t, output1.UpdatePasswordReset(ctx), nil)

	output2 := AuthAccount{
		EmailAddress: aa.EmailAddress,
	}
	output2.ReadPasswordReset(ctx)

	assert.Equal(t, output2.PasswordResetToken, output1.PasswordResetToken)

	output1.PasswordResetToken = nil

	assert.Equal(t, output1.UpdatePasswordReset(ctx), nil)

	output2.ReadPasswordReset(ctx)

	assert.Equal(t, output2.PasswordResetToken, output1.PasswordResetToken)

	aa.Delete(ctx)
}

func TestAuthAccountUpdatePrivatePublicKeys(t *testing.T) {
	logger.UseTestLogger(t)

	a := seed.AuthAccounts[0]
	a.EmailAddress = "updateprvpub@example.com"
	a.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &a.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	aaah.create(ctx, CreateOpts{})

	sv1 := seed.SecretsVaults[0]
	sv1.AuthAccountID = &a.ID
	sv1.Keys[0].AuthAccountID = a.ID
	sv1.create(ctx, CreateOpts{})

	sv2 := seed.SecretsVaults[1]
	sv2.Keys = SecretsVaultKeys{
		sv2.Keys[0],
		sv2.Keys[1],
		{
			AuthAccountID: a.ID,
			Key:           sv2.Keys[0].Key,
		},
	}
	sv2.create(ctx, CreateOpts{})

	a.PublicKey = cryptolib.Key[cryptolib.KeyProviderPublic]{}

	assert.Equal(t, a.UpdatePrivatePublicKeys(ctx), nil)
	assert.Equal(t, len(a.PrivateKeys), 0)

	r := ReadOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &a.ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}

	assert.Equal[error](t, Read(ctx, &sv1, r), errs.ErrSenderNotFound)
	assert.Equal(t, Read(ctx, &sv2, r), nil)
	assert.Equal(t, sv2.Keys, seed.SecretsVaults[1].Keys)

	sv2.Keys = SecretsVaultKeys{
		seed.SecretsVaults[1].Keys[0],
		seed.SecretsVaults[1].Keys[1],
		{
			AuthAccountID: a.ID,
			Key:           sv2.Keys[0].Key,
		},
	}
	sv2.update(ctx, UpdateOpts(r))

	a.Delete(ctx)

	assert.Equal(t, Read(ctx, &sv2, r), nil)
	assert.Equal(t, sv2.Keys, seed.SecretsVaults[1].Keys)
}

func TestAuthAccountUpdateTOTP(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testauthaccounttotpread@example.com"
	aa.Create(ctx, false)

	aat := AuthAccount{
		ID:           aa.ID,
		EmailAddress: aa.EmailAddress,
	}
	aatBad := aat
	aatBad.CreateTOTP(ctx)
	aatBad.TOTPCode = "123456"
	aatGood := aat
	aatGood.CreateTOTP(ctx)
	aatGood.TOTPCode, _ = totp.GenerateCode(aatGood.TOTPSecret, GenerateTimestamp())

	aac := aa
	aac.Child = true
	aac.Create(ctx, false)

	tests := []struct { // This test needs to be ordered.
		err    error
		input  *AuthAccount
		invert bool
		name   string
		want   string
	}{
		{
			name:  "update - child",
			err:   errs.ErrSenderNoContent,
			input: &aac,
			want:  "",
		},
		{
			name:  "2 update - bad totp",
			err:   ErrClientBadRequestTOTP,
			input: &aatBad,
			want:  "",
		},
		{
			name:   "3 update - good totp",
			input:  &aatGood,
			invert: true,
			want:   "",
		},
		{
			name:  "4 update - empty totp",
			input: &aat,
			want:  "",
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			assert.HasErr(t, tc.input.UpdateTOTP(ctx), tc.err)

			output := AuthAccount{
				ID:           aa.ID,
				EmailAddress: aa.EmailAddress,
			}
			output.ReadTOTPBackup(ctx)

			if tc.invert {
				assert.Equal(t, output.TOTPBackup != tc.want, true)
			} else {
				assert.Equal(t, output.TOTPBackup, tc.want)
			}
		})
	}

	aa.Delete(ctx)
	aac.Delete(ctx)
}

func TestAuthAccountUpdateVerification(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testupdateverification@example.com"
	aa.LastActivity = time.Time{}
	aa.Verified = false
	aa.Create(ctx, false)
	aa.Password = ""

	aa.Verified = true

	assert.Equal(t, aa.UpdateVerification(ctx), nil)

	output := AuthAccount{
		ID: aa.ID,
	}
	output.Read(ctx)

	assert.Equal(t, output, aa)

	aa.Delete(ctx)
}

func TestAuthAccountsDeleteInactive(t *testing.T) {
	logger.UseTestLogger(t)

	aa1 := seed.AuthAccounts[0]
	aa1.EmailAddress = "inactive@example.com"
	aa1.LastActivity = time.Now().Add(-1 * 24 * time.Hour * time.Duration(c.App.KeepInactiveAuthAccountDays+1))
	aa1.Create(ctx, false)

	aa2 := aa1
	aa2.EmailAddress = "inactivewithhousehold@example.com"
	aa2.Create(ctx, false)

	ah := AuthHousehold{}
	ah.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa2.ID,
		AuthHouseholdID: ah.ID,
	}
	aaah.create(ctx, CreateOpts{})

	_, n, _ := AuthAccountsRead(ctx, "", uuid.Nil, 0)

	assert.Equal(t, n, len(seed.AuthAccounts)+2)

	AuthAccountsDeleteInactive(ctx)

	want := n - 1

	_, n, _ = AuthAccountsRead(ctx, "", uuid.Nil, 0)

	assert.Equal(t, n, want)
	assert.Equal[error](t, aa1.Read(ctx), errs.ErrSenderNoContent)
	assert.Equal(t, aa2.Delete(ctx), nil)

	ah.Delete(ctx)
}
