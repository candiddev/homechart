package models

import (
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/crypto"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestAuthHouseholdsDeleteEmptyAndExpired(t *testing.T) {
	logger.UseTestLogger(t)

	ahD := seed.AuthHouseholds[0]
	ahD.Create(ctx, false)

	ahD1 := seed.AuthHouseholds[0]
	ahD1.SubscriptionExpires = types.CivilDateToday().AddDays(-1*c.App.KeepExpiredAuthHouseholdDays - 1)
	ahD1.Create(ctx, false)

	ahD2 := seed.AuthHouseholds[0]
	ahD2.Demo = true
	ahD2.SubscriptionExpires = types.CivilDateToday().AddDays(3)
	ahD2.Create(ctx, false)

	ahD1a := seed.AuthAccounts[0]
	ahD1a.EmailAddress = "ahd1a@example.com"
	ahD1a.Child = true
	ahD1a.Create(ctx, false)

	ahDaah := AuthAccountAuthHousehold{
		AuthAccountID:   &ahD1a.ID,
		AuthHouseholdID: ahD1.ID,
	}
	ahDaah.create(ctx, CreateOpts{})

	ahD2a := seed.AuthAccounts[0]
	ahD2a.EmailAddress = "ahd2a@example.com"
	ahD2a.Create(ctx, false)

	ahD2aah := AuthAccountAuthHousehold{
		AuthAccountID:   &ahD2a.ID,
		AuthHouseholdID: ahD2.ID,
	}
	ahD2aah.create(ctx, CreateOpts{})

	ahE := seed.AuthHouseholds[0]
	ahE.Create(ctx, false)

	ahEa1 := seed.AuthAccounts[0]
	ahEa1.EmailAddress = "ahe1a@example.com"
	ahEa1.Child = true
	ahEa1.Create(ctx, false)

	ahEa1ah := AuthAccountAuthHousehold{
		AuthAccountID:   &ahEa1.ID,
		AuthHouseholdID: ahE.ID,
	}
	ahEa1ah.create(ctx, CreateOpts{})

	ahEa2 := seed.AuthAccounts[0]
	ahEa2.EmailAddress = "ahea2@example.com"
	ahEa2.Create(ctx, false)

	ahEa2ah := AuthAccountAuthHousehold{
		AuthAccountID:   &ahEa2.ID,
		AuthHouseholdID: ahE.ID,
	}
	ahEa2ah.create(ctx, CreateOpts{})

	ahEa3 := seed.AuthAccounts[0]
	ahEa3.EmailAddress = "ahea3@example.com"
	ahEa3.Create(ctx, false)

	AuthHouseholdsDeleteEmptyAndExpired(ctx)

	ahD = AuthHousehold{
		ID: ahD.ID,
	}

	assert.Equal[error](t, ahD.Read(ctx), errs.ErrSenderNotFound)

	ahD1 = AuthHousehold{
		ID: ahD1.ID,
	}

	assert.Equal[error](t, ahD1.Read(ctx), errs.ErrSenderNotFound)

	ahD1a = AuthAccount{
		ID: ahD1a.ID,
	}
	assert.Equal[error](t, ahD1a.Read(ctx), errs.ErrSenderNotFound)

	ahEa3 = AuthAccount{
		ID: ahEa3.ID,
	}
	assert.Equal[error](t, ahEa3.Read(ctx), errs.ErrSenderNotFound)

	ahD2 = AuthHousehold{
		ID: ahD2.ID,
	}
	assert.Equal(t, ahD2.Read(ctx), nil)

	ahE = AuthHousehold{
		ID: ahE.ID,
	}
	assert.Equal(t, ahE.Read(ctx), nil)

	ahEa1 = AuthAccount{
		ID: ahEa1.ID,
	}
	assert.Equal(t, ahEa1.Read(ctx), nil)

	ahEa2 = AuthAccount{
		ID: ahEa2.ID,
	}
	assert.Equal(t, ahEa2.Read(ctx), nil)

	aa := AuthAccount{
		ID: seed.AuthAccounts[0].ID,
	}
	assert.Equal(t, aa.Read(ctx), nil)

	ah := AuthHousehold{
		ID: seed.AuthHouseholds[0].ID,
	}
	assert.Equal(t, ah.Read(ctx), nil)

	ahD2.Delete(ctx)
	ahD2a.Delete(ctx)
	ahE.Delete(ctx)
	ahEa1.Delete(ctx)
	ahEa2.Delete(ctx)
}

func TestAuthHouseholdsDeleteFeatureVotes(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)
	ah.FeatureVotes = AuthHouseholdFeatureVotes{
		{
			Amount:  1,
			Feature: 1,
		},
	}
	ah.Update(ctx)

	assert.Equal(t, AuthHouseholdsDeleteFeatureVotes(ctx), nil)

	ah.Read(ctx)

	assert.Equal(t, len(ah.FeatureVotes), 0)

	ah.Delete(ctx)
}

func TestAuthHouseholdsExceeded(t *testing.T) {
	logger.UseTestLogger(t)

	assert.Equal(t, AuthHouseholdsExceeded(ctx), false)

	ah1 := seed.AuthHouseholds[0]
	ah1.Create(ctx, false)

	ah2 := seed.AuthHouseholds[0]
	ah2.Create(ctx, false)

	ah3 := seed.AuthHouseholds[0]
	ah3.Create(ctx, false)

	ah4 := seed.AuthHouseholds[0]
	ah4.Create(ctx, false)

	assert.Equal(t, AuthHouseholdsExceeded(ctx), true)

	ah1.Delete(ctx)
	ah2.Delete(ctx)
	ah3.Delete(ctx)
	ah4.Delete(ctx)
}

func TestAuthHouseholdsRead(t *testing.T) {
	logger.UseTestLogger(t)

	for i := 1; i <= 51; i++ {
		ah := seed.AuthHouseholds[0]
		ah.Create(ctx, false)
	}

	tests := map[string]struct {
		offset int
		want   int
	}{
		"no offset": {
			offset: 0,
			want:   50,
		},
		"offset": {
			offset: 50,
			want:   3,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			a, total, err := AuthHouseholdsRead(ctx, types.UUIDs{}, tc.offset)

			assert.Equal(t, err, nil)
			assert.Equal(t, len(a), tc.want)
			assert.Equal(t, total, 53)
		})
	}

	// ID test
	_, total, err := AuthHouseholdsRead(ctx, types.UUIDs{
		seed.AuthHouseholds[0].ID,
		seed.AuthHouseholds[1].ID,
	}, 0)

	assert.Equal(t, err, nil)
	assert.Equal(t, total, 2)

	AuthHouseholdsDeleteEmptyAndExpired(ctx)
}

func TestAuthHouseholdsReadFeatureVotes(t *testing.T) {
	logger.UseTestLogger(t)

	ah1 := seed.AuthHouseholds[0]
	ah1.Create(ctx, false)
	ah1.FeatureVotes = AuthHouseholdFeatureVotes{
		{
			Amount:  4,
			Comment: "I really want this!",
			Feature: 1,
		},
		{
			Amount:  2,
			Comment: "This would be cool!",
			Feature: 2,
		},
	}
	ah1.Update(ctx)

	ah2 := seed.AuthHouseholds[0]
	ah2.Create(ctx, false)
	ah2.FeatureVotes = AuthHouseholdFeatureVotes{
		{
			Amount:  2,
			Comment: "Sounds exciting!",
			Feature: 2,
		},
		{
			Amount:  1,
			Feature: 1,
		},
		{
			Amount:  2,
			Feature: 3,
		},
	}
	ah2.Update(ctx)

	got, err := AuthHouseholdsReadFeatureVotes(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, got, AuthHouseholdFeatureVotes{
		{
			Amount:  5,
			Comment: "I really want this!",
			Feature: 1,
		},
		{
			Amount: 3,
			Comment: `This would be cool!
Sounds exciting!`,
			Feature: 2,
		},
		{
			Amount:  2,
			Feature: 3,
		},
	})

	ah1.Delete(ctx)
	ah2.Delete(ctx)
}

func TestAuthHouseholdsReadNotifiedExpired(t *testing.T) {
	logger.UseTestLogger(t)

	ah1 := AuthHousehold{
		SubscriptionExpires:   types.CivilDateOf(GenerateTimestamp()).AddDays(1),
		SubscriptionProcessor: AuthHouseholdSubscriptionProcessorNone,
	}
	ah1.Create(ctx, false)

	aaah := seed.AuthAccountAuthHouseholds[0]
	aaah.AuthHouseholdID = ah1.ID
	aaah.create(ctx, CreateOpts{})

	ah2 := AuthHousehold{
		SubscriptionExpires:   types.CivilDateOf(GenerateTimestamp()),
		SubscriptionProcessor: AuthHouseholdSubscriptionProcessorNone,
	}
	ah2.Create(ctx, false)

	aaah.AuthHouseholdID = ah2.ID
	aaah.create(ctx, CreateOpts{})

	ah3 := AuthHousehold{
		SubscriptionExpires:   types.CivilDateOf(GenerateTimestamp()).AddDays(-2),
		SubscriptionProcessor: AuthHouseholdSubscriptionProcessorNone,
	}
	ah3.Create(ctx, false)

	aaah.AuthHouseholdID = ah3.ID
	aaah.create(ctx, CreateOpts{})

	var n Notifications

	n, err := AuthHouseholdsReadNotifiedExpired(ctx)
	assert.Equal(t, err, nil)
	assert.Equal(t, len(n), 1)

	ah2.Read(ctx)

	assert.Equal(t, ah2.NotifiedExpired, false)

	ah3.Read(ctx)

	assert.Equal(t, ah3.NotifiedExpired, true)
	assert.Contains(t, n[0].SubjectSMTP, "Expired")

	n, err = AuthHouseholdsReadNotifiedExpired(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(n), 0)

	ah3.SubscriptionExpires = types.CivilDateOf(time.Now()).AddDays(50)
	ah3.UpdateSubscription(ctx)
	ah3.Read(ctx)

	assert.Equal(t, ah3.NotifiedExpired, false)

	ah1.Delete(ctx)
	ah2.Delete(ctx)
	ah3.Delete(ctx)
}

func TestAuthHouseholdsReadNotifiedExpiring(t *testing.T) {
	logger.UseTestLogger(t)

	ah1 := AuthHousehold{
		SubscriptionExpires:   types.CivilDateOf(GenerateTimestamp()).AddDays(8),
		SubscriptionProcessor: AuthHouseholdSubscriptionProcessorNone,
	}
	ah1.Create(ctx, false)

	aaah := seed.AuthAccountAuthHouseholds[0]
	aaah.AuthHouseholdID = ah1.ID
	aaah.create(ctx, CreateOpts{})

	ah2 := AuthHousehold{
		SubscriptionExpires:   types.CivilDateOf(GenerateTimestamp()).AddDays(7),
		SubscriptionProcessor: AuthHouseholdSubscriptionProcessorNone,
	}
	ah2.Create(ctx, false)

	aaah.AuthHouseholdID = ah2.ID
	aaah.create(ctx, CreateOpts{})

	ah3 := AuthHousehold{
		SubscriptionExpires:   types.CivilDateOf(GenerateTimestamp()).AddDays(6),
		SubscriptionProcessor: AuthHouseholdSubscriptionProcessorNone,
	}
	ah3.Create(ctx, false)

	aaah.AuthHouseholdID = ah3.ID
	aaah.create(ctx, CreateOpts{})

	n, err := AuthHouseholdsReadNotifiedExpiring(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(n), 1)

	ah2.Read(ctx)

	assert.Equal(t, ah2.NotifiedExpiring, true)

	ah3.Read(ctx)

	assert.Equal(t, ah3.NotifiedExpiring, true)
	assert.Contains(t, n[0].SubjectSMTP, "Expires")

	n, err = AuthHouseholdsReadNotifiedExpiring(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(n), 0)

	ah3.SubscriptionExpires = types.CivilDateOf(time.Now()).AddDays(50)
	ah3.UpdateSubscription(ctx)
	ah3.Read(ctx)

	assert.Equal(t, ah3.NotifiedExpiring, false)

	ah1.Delete(ctx)
	ah2.Delete(ctx)
	ah3.Delete(ctx)
}

func TestAuthHouseholdCreate(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.SelfHostedURL = "https://web.homechart.app"

	assert.Equal(t, ah.Create(ctx, false), nil)
	assert.Equal(t, ah.Created.IsZero(), false)

	ah.Delete(ctx)

	// Existing ID
	ah.SelfHostedID = types.UUIDToNullUUID(ah.ID)
	ah1 := ah

	assert.Equal(t, ah.Create(ctx, true), nil)
	assert.Equal(t, ah1.ID, ah.ID)
	assert.Equal(t, ah1.SelfHostedID, ah.SelfHostedID)

	ah1.Delete(ctx)
}

func TestAuthHouseholdCreateReadJWT(t *testing.T) {
	logger.UseTestLogger(t)

	oldPrv := c.App.CloudPrivateKey
	oldPub := c.App.CloudPublicKey
	endpoint := c.App.CloudEndpoint

	prv, pub, _ := crypto.NewEd25519()
	c.App.CloudPrivateKey = prv
	c.App.CloudPublicKey = pub

	usedJWT := true

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cloud = true
		usedJWT = false

		a := AuthHousehold{
			SelfHostedID: types.UUIDToNullUUID(ParseUUID(strings.Split(r.RequestURI, "/")[4])),
		}

		jwt, err := a.CreateJWT(ctx)
		cloud = false
		if err == nil {
			w.Write([]byte(jwt))
		} else {
			w.WriteHeader(http.StatusNotFound)
		}
	}))

	c.App.CloudEndpoint = srv.URL
	cloud = false

	id1 := GenerateUUID()
	id2 := GenerateUUID()

	ah1 := seed.AuthHouseholds[0]
	ah1.SelfHostedID = types.UUIDToNullUUID(id1)
	ah1.SubscriptionExpires = types.CivilDateToday().AddDays(1)
	ah1.SubscriptionProcessor = AuthHouseholdSubscriptionProcessorPaddleMonthly
	ah1.Create(ctx, false)

	ah2 := seed.AuthHouseholds[0]
	ah2.SelfHostedID = types.UUIDToNullUUID(id2)
	ah2.SubscriptionExpires = types.CivilDateToday().AddDays(-1)
	ah2.Create(ctx, false)

	jwt1, _ := ah1.CreateJWT(ctx)
	jwt2, _ := ah2.CreateJWT(ctx)

	tests := map[string]struct {
		cloudJWT       string
		cloudHousehold AuthHousehold
		err            error
		force          bool
		selfHostedID   uuid.UUID
		wantJWT        bool
		wantExpires    types.CivilDate
		wantProcessor  AuthHouseholdSubscriptionProcessor
	}{
		"valid": {
			cloudHousehold: ah1,
			selfHostedID:   id1,
			wantExpires:    ah1.SubscriptionExpires,
			wantProcessor:  ah1.SubscriptionProcessor,
		},
		"good cloud JWT": {
			cloudHousehold: ah1,
			cloudJWT:       jwt1,
			selfHostedID:   id1,
			wantJWT:        true,
			wantExpires:    ah1.SubscriptionExpires,
			wantProcessor:  ah1.SubscriptionProcessor,
		},
		"good cloud JWT force": {
			cloudHousehold: ah1,
			cloudJWT:       jwt1,
			force:          true,
			selfHostedID:   id1,
			wantExpires:    ah1.SubscriptionExpires,
			wantProcessor:  ah1.SubscriptionProcessor,
		},
		"expired cloud JWT": {
			cloudHousehold: ah1,
			cloudJWT:       jwt2,
			selfHostedID:   id1,
			wantExpires:    ah1.SubscriptionExpires,
			wantProcessor:  ah1.SubscriptionProcessor,
		},
		"wrong household cloud JWT": {
			cloudHousehold: ah2,
			cloudJWT:       jwt1,
			selfHostedID:   id2,
		},
		"expired": {
			cloudHousehold: ah2,
			selfHostedID:   id2,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			ah := seed.AuthHouseholds[0]
			ah.CloudJWT = tc.cloudJWT
			ah.ID = tc.selfHostedID
			ah.SubscriptionExpires = types.CivilDateToday().AddMonths(100)
			ah.SubscriptionProcessor = AuthHouseholdSubscriptionProcessorPaddleLifetime
			ah.Create(ctx, true)

			usedJWT = true

			var err error

			ah.Updated = time.Time{}

			if tc.wantJWT || tc.force {
				err = ah.ReadJWT(ctx, tc.force)
			} else {
				err = ah.Read(ctx)
			}
			assert.Equal(t, err, tc.err)
			assert.Equal(t, usedJWT, tc.wantJWT)

			if tc.wantProcessor == AuthHouseholdSubscriptionProcessorNone {
				assert.Equal(t, ah.SubscriptionExpires, types.CivilDateToday().AddDays(-1))
				assert.Equal(t, ah.SubscriptionProcessor, AuthHouseholdSubscriptionProcessorNone)
			} else {
				assert.Equal(t, ah.SubscriptionExpires, tc.wantExpires)
				assert.Equal(t, ah.SubscriptionProcessor, tc.wantProcessor)
			}

			ah.Updated = time.Time{}
			assert.Equal(t, ah.Read(ctx), nil)
			ah.Updated = time.Time{}
			assert.Equal(t, ah.Read(ctx), nil)

			ah.Delete(ctx)
		})
	}

	ah1.Delete(ctx)
	ah2.Delete(ctx)

	cloud = true
	c.App.CloudEndpoint = endpoint
	c.App.CloudPrivateKey = oldPrv
	c.App.CloudPublicKey = oldPub
}

func TestAuthHouseholdDelete(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	assert.Equal(t, ah.Delete(ctx), nil)

	ah.Delete(ctx)
}

func TestAuthHouseholdRead(t *testing.T) {
	logger.UseTestLogger(t)

	ah := AuthHousehold{
		SelfHostedID: types.UUIDToNullUUID(GenerateUUID()),
	}
	ah.Create(ctx, false)
	ah.Members = AuthHouseholdMembers{}

	output := AuthHousehold{
		ID: ah.ID,
	}

	assert.Equal(t, output.Read(ctx), nil)
	assert.Equal(t, output, ah)

	output = AuthHousehold{
		SelfHostedID: ah.SelfHostedID,
	}

	assert.Equal(t, output.Read(ctx), nil)
	assert.Equal(t, output, ah)

	// Test members
	aa1 := seed.AuthAccounts[0]
	aa1.EmailAddress = "householdread1@example.com"
	aa1.Create(ctx, false)

	aa2 := seed.AuthAccounts[0]
	aa2.EmailAddress = "householdread2@example.com"
	aa2.Name = "testing"
	aa2.Create(ctx, false)

	aaah1 := AuthAccountAuthHousehold{
		AuthAccountID:   &aa1.ID,
		AuthHouseholdID: ah.ID,
		Color:           types.ColorBrown,
	}
	aaah1.create(ctx, CreateOpts{})

	aaah2 := AuthAccountAuthHousehold{
		AuthAccountID:   &aa2.ID,
		AuthHouseholdID: ah.ID,
	}
	aaah2.create(ctx, CreateOpts{})

	aaah3 := AuthAccountAuthHousehold{
		AuthHouseholdID: ah.ID,
		EmailAddress:    "householdread3@example.com",
		Permissions: Permissions{
			Auth: PermissionNone,
		},
	}
	aaah3.InviteCreate(ctx)

	ahm := AuthHouseholdMembers{
		{
			AuthHouseholdID: ah.ID,
			Color:           aaah1.Color,
			EmailAddress:    aa1.EmailAddress,
			Name:            string(aa1.Name),
			ID:              aa1.ID,
			PublicKey:       aa1.PublicKey,
		},
		{
			AuthHouseholdID: ah.ID,
			EmailAddress:    aa2.EmailAddress,
			Name:            string(aa2.Name),
			ID:              aa2.ID,
			PublicKey:       aa2.PublicKey,
		},
		{
			AuthHouseholdID: ah.ID,
			EmailAddress:    types.EmailAddress(aaah3.EmailAddress),
			Permissions:     aaah3.Permissions,
			InviteToken:     aaah3.InviteToken,
		},
	}

	ah.Read(ctx)

	assert.Equal(t, ah.CountMembers, 3)
	assert.Equal(t, ah.Updated, aaah3.Updated)
	assert.Equal(t, ah.Members, ahm)
	assert.Equal[error](t, ah.Read(ctx), errs.ErrSenderNoContent)

	output = AuthHousehold{}

	cache := Cache{
		ID:        &ah.ID,
		TableName: "auth_household",
		Value:     &output,
	}
	cache.Get(ctx)

	output.FeatureVotes = ah.FeatureVotes

	assert.Equal(t, output, ah)

	aa1.Delete(ctx)
	aa2.Delete(ctx)
	ah.Delete(ctx)
}

func TestAuthHouseholdReadReferrer(t *testing.T) {
	logger.UseTestLogger(t)

	ah := AuthHousehold{
		SubscriptionReferralCode: "asdf",
	}
	ah.Create(ctx, false)

	output := AuthHousehold{
		SubscriptionReferralCode: ah.SubscriptionReferralCode,
	}

	assert.Equal(t, output.ReadReferral(ctx), nil)
	assert.Equal(t, output, ah)

	ah.Delete(ctx)
}

func TestAuthHouseholdMemberDelete(t *testing.T) {
	logger.UseTestLogger(t)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &seed.AuthAccounts[4].ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	Create(ctx, &aaah, CreateOpts{})

	tests := map[string]struct {
		err   error
		input PermissionsOpts
	}{
		"no permissions": {
			err: errs.ErrSenderForbidden,
			input: PermissionsOpts{
				AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
					{
						AuthHouseholdID: seed.AuthHouseholds[0].ID,
						Permissions: Permissions{
							Auth: PermissionView,
						},
					},
				},
			},
		},
		"permitted": {
			input: PermissionsOpts{
				AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
					{
						AuthHouseholdID: seed.AuthHouseholds[0].ID,
						Permissions: Permissions{
							Auth: PermissionEdit,
						},
					},
				},
			},
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.HasErr(t, AuthHouseholdMemberDelete(ctx, seed.AuthAccounts[4].ID, seed.AuthHouseholds[0].ID, tc.input), tc.err)

			if tc.err == nil {
				assert.Equal[error](t, Read(ctx, &aaah, ReadOpts{}), errs.ErrSenderNotFound)
			}
		})
	}

	Delete(ctx, &aaah, DeleteOpts{})
}

func TestAuthHouseholdReadSubscriptionCustomerID(t *testing.T) {
	logger.UseTestLogger(t)

	ah := AuthHousehold{}
	ah.Create(ctx, false)

	ah.SubscriptionCustomerID = "test"
	ah.UpdateSubscription(ctx)

	ah1 := AuthHousehold{
		SubscriptionCustomerID: "test",
	}

	assert.Equal(t, ah1.ReadSubscriptionCustomerID(ctx), nil)
	assert.Equal(t, ah1, ah)

	ah.Delete(ctx)
}

func TestAuthHouseholdUpdate(t *testing.T) {
	logger.UseTestLogger(t)
	db.Exec(ctx, "DELETE FROM self_hosted_household", nil)

	ah := AuthHousehold{
		SubscriptionExpires: types.CivilDateOf(GenerateTimestamp()),
	}
	ah.Create(ctx, false)
	ah.BackupEncryptionKey = "secret"
	ah.FeatureVotes = AuthHouseholdFeatureVotes{
		{
			Amount:  3,
			Feature: 1,
		},
		{
			Amount:  2,
			Feature: 2,
		},
		{
			Amount:  1,
			Feature: 3,
		},
	}
	ah.Members = AuthHouseholdMembers{}
	ah.SelfHostedID = types.UUIDToNullUUID(ah.ID)
	ah.SelfHostedURL = "https://web.homechart.app"
	ah.Preferences.Currency = types.CurrencyCAD

	assert.Equal(t, ah.Update(ctx), nil)

	output := AuthHousehold{
		ID: ah.ID,
	}
	output.Read(ctx)
	output.Updated = ah.Updated

	ah.FeatureVotes[2].Amount = 0

	assert.Equal(t, output, ah)

	var sh []SelfHostedHousehold

	db.Query(ctx, true, &sh, "SELECT * from self_hosted_household", nil)

	assert.Equal(t, len(sh), 1)
	assert.Equal(t, sh[0].Households, 1)

	ah.Delete(ctx)
	ah.Create(ctx, false)

	sh = []SelfHostedHousehold{}

	db.Query(ctx, true, &sh, "SELECT * from self_hosted_household", nil)

	assert.Equal(t, len(sh), 1)
	assert.Equal(t, sh[0].Households, 2)

	ah.Delete(ctx)
}

func TestAuthHouseholdUpdateSelfHosted(t *testing.T) {
	logger.UseTestLogger(t)

	id := GenerateUUID()

	ah := AuthHousehold{
		SelfHostedID:        types.UUIDToNullUUID(id),
		SubscriptionExpires: types.CivilDateToday(),
	}
	ah.Create(ctx, false)
	ah.SubscriptionExpires = ah.SubscriptionExpires.AddDays(100)
	ah.SubscriptionReferralCode = "123"
	ah.SubscriptionReferrerCode = "456"
	ah.SelfHostedURL = "test"
	ah.Members = AuthHouseholdMembers{}

	assert.Equal(t, ah.UpdateSelfHosted(ctx), nil)

	output := AuthHousehold{
		ID: ah.ID,
	}
	output.Read(ctx)
	output.Updated = ah.Updated

	assert.Equal(t, output, ah)
	assert.Equal(t, output.SubscriptionExpires, types.CivilDateToday())

	ah.Delete(ctx)
}

func TestAuthHouseholdUpdateSubscription(t *testing.T) {
	logger.UseTestLogger(t)

	ah := AuthHousehold{
		SubscriptionExpires: types.CivilDateOf(GenerateTimestamp()),
	}
	ah.Create(ctx, false)
	ah.SubscriptionCustomerID = "acustomerid"
	ah.SubscriptionExpires = ah.SubscriptionExpires.AddDays(100)
	ah.SubscriptionLastTransactionID = "atransactionid"
	ah.SubscriptionProcessor = AuthHouseholdSubscriptionProcessorNone
	ah.SubscriptionReferrerCode = seed.AuthHouseholds[0].SubscriptionReferralCode
	ah.SubscriptionReferralCode = "TESTING"
	ah.SubscriptionID = "test"
	ah.Members = AuthHouseholdMembers{}

	assert.Equal(t, ah.UpdateSubscription(ctx), nil)

	output := AuthHousehold{
		ID: ah.ID,
	}
	output.Read(ctx)
	output.Updated = ah.Updated

	assert.Equal(t, output, ah)

	ah.Delete(ctx)
}
