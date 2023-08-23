package models

import (
	"context"
	"errors"
	"fmt"
	"io"
	"net/http"
	"sort"
	"time"

	"github.com/candiddev/homechart/go/templates"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/jwt"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// ErrServerActionHouseholdsExceeded means a self-hosted instance has exceeded the number of allowed households.
var ErrServerActionHouseholdsExceeded = errs.NewServerErr(errors.New("self-hosted instances are limited to 5 households"))

// AuthHousehold defines the household fields.
type AuthHousehold struct {
	SelfHostedID                  *uuid.NullUUID                     `db:"self_hosted_id" json:"selfHostedID"`
	Created                       time.Time                          `db:"created" format:"date-time" json:"created"`
	Updated                       time.Time                          `db:"updated" format:"date-time" json:"updated"`
	ID                            uuid.UUID                          `db:"id" format:"uuid" json:"id"`
	Members                       AuthHouseholdMembers               `db:"members" json:"members"`
	Preferences                   AuthHouseholdPreferences           `db:"preferences" json:"preferences"`
	CountMembers                  int                                `db:"count_members" json:"countMembers"`
	SubscriptionReferralCount     int                                `db:"subscription_referral_count" json:"subscriptionReferralCount"`
	Demo                          bool                               `db:"demo" json:"demo"`
	NotifiedExpired               bool                               `db:"notified_expired" json:"-"`
	NotifiedExpiring              bool                               `db:"notified_expiring" json:"-"`
	BackupEncryptionKey           types.StringLimit                  `db:"backup_encryption_key" json:"backupEncryptionKey"`
	Name                          types.StringLimit                  `db:"name" json:"name"`
	SelfHostedURL                 types.StringLimit                  `db:"self_hosted_url" json:"selfHostedURL"`
	CloudJWT                      string                             `db:"cloud_jwt" json:"-"`
	SubscriptionCustomerID        string                             `db:"subscription_customer_id" json:"subscriptionCustomerID"`
	SubscriptionID                string                             `db:"subscription_id" json:"subscriptionID"`
	SubscriptionLastTransactionID string                             `db:"subscription_last_transaction_id" json:"subscriptionLastTransactionID"`
	SubscriptionExpires           types.CivilDate                    `db:"subscription_expires" format:"date" json:"subscriptionExpires" swaggertype:"string"`
	SubscriptionProcessor         AuthHouseholdSubscriptionProcessor `db:"subscription_processor" json:"subscriptionProcessor"`
	SubscriptionReferralCode      types.StringLimit                  `db:"subscription_referral_code" json:"subscriptionReferralCode"`
	SubscriptionReferrerCode      types.StringLimit                  `db:"subscription_referrer_code" json:"subscriptionReferrerCode"`
	FeatureVotes                  AuthHouseholdFeatureVotes          `db:"feature_votes" json:"featureVotes"`
} // @Name AuthHousehold

// AuthHouseholdSubscriptionProcessor is the payment processor for a subscription.
type AuthHouseholdSubscriptionProcessor int

// AuthHouseholdSubscriptionProcessor is the payment processor for a subscription.
const (
	AuthHouseholdSubscriptionProcessorNone         AuthHouseholdSubscriptionProcessor = iota
	AuthHouseholdSubscriptionProcessorPaddleYearly                                    // TODO: remove
	AuthHouseholdSubscriptionProcessorApple                                           // TODO: remove
	AuthHouseholdSubscriptionProcessorGoogle                                          // TODO: remove
	AuthHouseholdSubscriptionProcessorPaddleMonthly
	AuthHouseholdSubscriptionProcessorPaddleLifetime
)

// AuthHouseholdSubscriptionProcessors are all of the SubscriptionProcessors.
var AuthHouseholdSubscriptionProcessors = []string{ //nolint:gochecknoglobals
	"None",
	"PaddleYearly",
	"Apple",
	"Google",
	"PaddleMonthly",
	"PaddleLifetime",
}

// AuthHouseholdJWT is used by self-hosted instances to validate subscriptions.
type AuthHouseholdJWT struct {
	ID                    uuid.UUID                          `json:"id"`
	SelfHostedID          *uuid.NullUUID                     `json:"selfHostedID"`
	SubscriptionExpires   types.CivilDate                    `json:"subscriptionExpires"`
	SubscriptionProcessor AuthHouseholdSubscriptionProcessor `json:"subscriptionProcessor"`
	jwt.RegisteredClaims
}

func (a *AuthHouseholdJWT) GetRegisteredClaims() *jwt.RegisteredClaims {
	return &a.RegisteredClaims
}

// AuthHouseholds is multiple AuthHousehold.
type AuthHouseholds []AuthHousehold

// AuthHouseholdsDeleteEmptyAndExpired deletes AuthHousehold records without associated accounts.
func AuthHouseholdsDeleteEmptyAndExpired(ctx context.Context) {
	ctx = logger.Trace(ctx)

	// Delete households
	tx, err := db.BeginTx(ctx)
	if err != nil {
		logger.Log(ctx, err) //nolint:errcheck

		return
	}

	// Triggers in this table block household deletion cascade, need to investigate further
	if _, err := tx.Exec("ALTER TABLE budget_category DISABLE TRIGGER bd_budget_category"); err != nil {
		logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

		return
	}

	if _, err := tx.Exec(fmt.Sprintf(`
DELETE FROM auth_household
WHERE
	NOT EXISTS (
		SELECT 1
		FROM auth_account_auth_household
		LEFT JOIN auth_account ON auth_account_auth_household.auth_account_id = auth_account.id
		WHERE NOT auth_account.child
		AND auth_household_id = auth_household.id
	)
	OR subscription_expires < now() - interval '%d days'
	OR (
		demo
		AND created < now() - interval '1 days'
	);
`, c.App.KeepExpiredAuthHouseholdDays)); err != nil {
		logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

		return
	}

	if _, err := tx.Exec(`
DELETE FROM auth_account
WHERE
	(
		child
		OR email_address LIKE '%example.com%'
	) AND NOT EXISTS (
			SELECT 1
			FROM auth_account_auth_household
			WHERE auth_account_id = auth_account.id
	)
`); err != nil {
		logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

		return
	}

	if _, err := tx.Exec("ALTER TABLE budget_category ENABLE TRIGGER bd_budget_category"); err != nil {
		logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

		return
	}

	if err := tx.Commit(); err != nil {
		logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck

		return
	}

	logger.Log(ctx, nil) //nolint:errcheck
}

// AuthHouseholdsDeleteFeatureVotes deletes AuthHousehold.FeatureVotes.
func AuthHouseholdsDeleteFeatureVotes(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Delete households
	return logger.Log(ctx, db.Exec(ctx, `
UPDATE auth_household
SET feature_votes = '[]'
`, nil))
}

// AuthHouseholdsExceeded checks if the number of AuthHouseholds is more than 2 for non-hosted instances.
func AuthHouseholdsExceeded(ctx context.Context) bool {
	var total int

	if err := db.Query(ctx, false, &total, "SELECT count(*) FROM AUTH_HOUSEHOLD", nil); err != nil {
		logger.Log(ctx, err) //nolint:errcheck

		return true
	}

	if total > 5 {
		logger.Log(ctx, ErrServerActionHouseholdsExceeded, fmt.Sprintf("%d total households", total)) //nolint:errcheck

		return true
	}

	logger.Log(ctx, nil) //nolint:errcheck

	return false
}

// AuthHouseholdsRead returns all AuthHouseholds in a database.
func AuthHouseholdsRead(ctx context.Context, idFilter types.UUIDs, offset int) (AuthHouseholds, int, errs.Err) {
	ctx = logger.Trace(ctx)

	// Get AuthHouseholds
	a := AuthHouseholds{}

	var err errs.Err

	var total int

	if len(idFilter) > 0 {
		for i := range idFilter {
			ah := AuthHousehold{
				ID: idFilter[i],
			}

			if err := ah.Read(ctx); err != nil && err != errs.ErrClientBadRequestMissing {
				return a, 0, logger.Log(ctx, err)
			}

			a = append(a, ah)
		}

		total = len(a)
	} else {
		if err = db.Query(ctx, true, &a, `
SELECT
	  auth_household.*
	, count(auth_account_auth_household.id) AS count_members
FROM auth_household
LEFT JOIN auth_account_auth_household
ON auth_household.id = auth_account_auth_household.auth_household_id
WHERE NOT auth_household.demo
GROUP BY auth_household.id
ORDER BY created
LIMIT 50
OFFSET $1
`, nil, offset); err != nil {
			return a, total, err
		}

		err = db.Query(ctx, false, &total, "SELECT COUNT(*) FROM auth_household WHERE NOT auth_household.demo", nil)
	}

	return a, total, logger.Log(ctx, err)
}

// AuthHouseholdsReadFeatureVotes returns all FeatureVotes.
func AuthHouseholdsReadFeatureVotes(ctx context.Context) (AuthHouseholdFeatureVotes, errs.Err) {
	ctx = logger.Trace(ctx)

	va := AuthHouseholdFeatureVotes{}

	var votes AuthHouseholdFeatureVotes

	if err := db.Query(ctx, false, &votes, `
SELECT json_agg(votes)
FROM
	  auth_household
	, jsonb_array_elements(feature_votes) as votes
`, nil); err == nil {
		for _, vote := range votes {
			match := false

			for i := range va {
				if va[i].Feature == vote.Feature {
					va[i].Amount += vote.Amount

					if vote.Comment != "" {
						va[i].Comment += "\n" + vote.Comment
					}

					match = true

					break
				}
			}

			if !match {
				va = append(va, vote)
			}
		}
	}

	sort.SliceStable(va, func(i, j int) bool {
		return va[i].Feature < va[j].Feature
	})

	return va, logger.Log(ctx, nil)
}

// AuthHouseholdsReadNotifiedExpired returns AuthHouseholdIDs for subscriptions expiring.
func AuthHouseholdsReadNotifiedExpired(ctx context.Context) (Notifications, error) {
	ctx = logger.Trace(ctx)

	a := AuthHouseholds{}
	n := Notifications{}

	if err := db.Query(ctx, true, &a, `
UPDATE auth_household
SET notified_expired = true
WHERE notified_expired is false
AND subscription_expires < current_date - INTERVAL '1 day'
RETURNING
	  id
	, subscription_expires
`, nil); err != nil {
		return n, logger.Log(ctx, err)
	}

	for i := range a {
		n = AuthAccountsReadNotifications(ctx, nil, &a[i].ID, AuthAccountNotifyTypeSystem)

		for i := range n {
			n[i].BodySMTP = templates.EmailExpiredBody(n[i].ISO639Code, a[i].SubscriptionExpires.StringFormat(n[i].Preferences.FormatDateOrder, n[i].Preferences.FormatDateSeparator), c.App.BaseURL)
			n[i].SubjectSMTP = yaml8n.EmailExpiredSubject.Translate(n[i].ISO639Code)
		}
	}

	return n, logger.Log(ctx, nil)
}

// AuthHouseholdsReadNotifiedExpiring returns AuthHouseholdIDs for subscriptions that are expired.
func AuthHouseholdsReadNotifiedExpiring(ctx context.Context) (Notifications, error) {
	ctx = logger.Trace(ctx)

	a := AuthHouseholds{}
	n := Notifications{}

	if err := db.Query(ctx, true, &a, `
UPDATE auth_household
SET notified_expiring = true
WHERE subscription_processor = 0
AND notified_expiring IS FALSE
AND subscription_expires <= current_date + INTERVAL '7 day'
RETURNING
	  id
	, subscription_expires
`, nil); err != nil {
		return n, logger.Log(ctx, err)
	}

	for i := range a {
		n = AuthAccountsReadNotifications(ctx, nil, &a[i].ID, AuthAccountNotifyTypeSystem)

		for i := range n {
			n[i].BodySMTP = templates.EmailExpiringBody(n[i].ISO639Code, a[i].SubscriptionExpires.StringFormat(n[i].Preferences.FormatDateOrder, n[i].Preferences.FormatDateSeparator), c.App.BaseURL)
			n[i].SubjectSMTP = yaml8n.EmailExpiringSubject.Translate(n[i].ISO639Code)
		}
	}

	return n, logger.Log(ctx, nil)
}

// AuthHouseholdMemberDelete removes an AuthHousehold member.
func AuthHouseholdMemberDelete(ctx context.Context, authAccountID, authHouseholdID uuid.UUID, p PermissionsOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if p.AuthHouseholdsPermissions != nil && !p.AuthHouseholdsPermissions.IsPermitted(&authHouseholdID, PermissionComponentAuth, PermissionEdit) {
		err := errs.ErrClientForbidden

		return logger.Log(ctx, err)
	}

	return logger.Log(ctx, db.Exec(ctx, `
DELETE FROM auth_account_auth_household
WHERE auth_account_id = :auth_account_id
AND auth_household_id = :auth_household_id
`, AuthAccountAuthHousehold{
		AuthAccountID:   &authAccountID,
		AuthHouseholdID: authHouseholdID,
	}))
}

func (a *AuthHousehold) validateFeatureVotes() {
	total := types.ScaleInt(0)

	for i := range a.FeatureVotes {
		if a.FeatureVotes[i].Amount+total <= 5 {
			total += a.FeatureVotes[i].Amount
		} else {
			a.FeatureVotes[i].Amount = 5 - total
			total = 5
		}
	}
}

// Create adds an AuthHousehold to a database.
func (a *AuthHousehold) Create(ctx context.Context, restore bool) errs.Err {
	ctx = logger.Trace(ctx)

	if (a.SubscriptionExpires == types.CivilDate{}) {
		a.SubscriptionExpires = types.CivilDateOf(GenerateTimestamp())
	}

	if a.Name == "" {
		a.Name = "Homecharter"
	}

	// Set fields
	if !restore {
		a.ID = GenerateUUID()
		a.CloudJWT = ""
	}

	a.SubscriptionReferralCode = types.StringLimit(types.NewNanoid())

	// Add to database
	err := db.Query(ctx, false, a, `
INSERT INTO auth_household (
	  backup_encryption_key
	, cloud_jwt
	, demo
	, id
	, name
	, self_hosted_id
	, self_hosted_url
	, subscription_expires
	, subscription_processor
	, subscription_referrer_code
	, subscription_referral_code
	, subscription_last_transaction_id
) VALUES (
	  :backup_encryption_key
	, :cloud_jwt
	, :demo
	, :id
	, :name
	, :self_hosted_id
	, :self_hosted_url
	, :subscription_expires
	, :subscription_processor
	, :subscription_referrer_code
	, :subscription_referral_code
	, :subscription_last_transaction_id
)
RETURNING *
`, a)

	return logger.Log(ctx, err)
}

// CreateJWT uses a SelfHostedID to find a Household and return a JWT.
func (a *AuthHousehold) CreateJWT(ctx context.Context) (string, errs.Err) {
	ctx = logger.Trace(ctx)

	if a.SelfHostedID == nil {
		return "", logger.Log(ctx, errs.ErrClientBadRequestProperty)
	}

	if err := a.Read(ctx); err != nil && err != errs.ErrClientNoContent {
		return "", logger.Log(ctx, err)
	}

	expires := time.Now().Add(24 * time.Hour)
	if !a.SubscriptionExpires.After(types.CivilDateToday()) {
		expires = time.Now().Add(1 * time.Hour)
	}

	t, err := jwt.SignJWT(c.App.CloudPrivateKey, &AuthHouseholdJWT{
		ID:                    a.ID,
		SelfHostedID:          a.SelfHostedID,
		SubscriptionExpires:   a.SubscriptionExpires,
		SubscriptionProcessor: a.SubscriptionProcessor,
	}, expires, "Homechart", c.App.BaseURL, a.SelfHostedID.UUID.String())
	if err != nil {
		return "", logger.Log(ctx, errs.NewServerErr(err))
	}

	return t, logger.Log(ctx, nil)
}

// Delete deletes an AuthHousehold database record.
func (a *AuthHousehold) Delete(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Delete account
	err := db.Exec(ctx, "DELETE FROM auth_household WHERE id = :id", a)

	return logger.Log(ctx, err)
}

// IsExpired checks if an AuthHousehold is expired.
func (a *AuthHousehold) IsExpired() bool {
	return types.CivilDateToday().After(a.SubscriptionExpires)
}

// Read queries a database for an AuthHousehold.
func (a *AuthHousehold) Read(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	cache := Cache{
		ID:        &a.ID,
		TableName: "auth_household",
	}

	if a.ID != uuid.Nil {
		var ah AuthHousehold

		cache.Value = &ah

		if err := cache.Get(ctx); err == nil {
			if ah.Updated.Equal(a.Updated) {
				err = errs.ErrClientNoContent
			} else {
				if ah.FeatureVotes == nil {
					ah.FeatureVotes = AuthHouseholdFeatureVotes{}
				}

				*a = ah
			}

			if !cloud {
				if err := a.ReadJWT(ctx, false); err != nil && err != errs.ErrClientNoContent {
					return logger.Log(ctx, err)
				}
			}

			return logger.Log(ctx, err)
		}
	}

	query := `
SELECT
	  auth_household.backup_encryption_key
	, auth_household.cloud_jwt
	, auth_household.created
	, auth_household.demo
	, auth_household.feature_votes
	, auth_household.id
	, auth_household.name
	, auth_household.notified_expired
	, auth_household.notified_expiring
	, auth_household.preferences
	, auth_household.self_hosted_url
	, auth_household.subscription_customer_id
	, auth_household.subscription_expires
	, auth_household.subscription_id
	, auth_household.subscription_last_transaction_id
	, auth_household.subscription_processor
	, auth_household.subscription_referral_count
	, auth_household.subscription_referral_code
	, auth_household.subscription_referrer_code
	, auth_household.self_hosted_id
	, count(auth_account_auth_household.*) as count_members
	, COALESCE(
		  JSONB_AGG(
				JSONB_BUILD_OBJECT(
						'authHouseholdID', auth_account_auth_household.auth_household_id
					, 'child', auth_account.child
					, 'color', auth_account_auth_household.color
					, 'emailAddress', CASE WHEN auth_account.email_address IS NULL
						THEN auth_account_auth_household.email_address
						ELSE auth_account.email_address END
					, 'id', auth_account.id
					, 'inviteToken', auth_account_auth_household.invite_token
					, 'name', auth_account.name
					, 'permissions', auth_account_auth_household.permissions
					, 'publicKey', auth_account.public_key
				)
		  ) FILTER (WHERE auth_account_auth_household.id IS NOT NULL)
		, '[]'::::jsonb
	) as members
	, GREATEST(auth_household.updated, MAX(auth_account_auth_household.updated), MAX(auth_account.updated)) as updated
FROM auth_household
LEFT JOIN auth_account_auth_household
ON auth_household.id = auth_account_auth_household.auth_household_id
LEFT JOIN auth_account
ON auth_account.id = auth_account_auth_household.auth_account_id
WHERE auth_household.id = :id
OR (
	auth_household.self_hosted_id IS NOT NULL
	AND auth_household.self_hosted_id = :self_hosted_id
)
GROUP BY
    auth_household.id
`

	if !a.Updated.IsZero() {
		query += `
HAVING (
	auth_household.updated > :updated
  OR MAX(auth_account_auth_household.updated) > :updated
  OR MAX(auth_account.updated) > :updated
)
`
	}

	// Read AuthHousehold
	err := db.Query(ctx, false, a, query, a)
	if err == nil {
		if !cloud {
			if err := a.ReadJWT(ctx, false); err != nil {
				logger.Log(ctx, err) //nolint:errcheck
			}
		}

		cache.Value = &a
		err := cache.Set(ctx)
		logger.Log(ctx, err) //nolint:errcheck
	}

	return logger.Log(ctx, err)
}

// ReadJWT reads a JWT entry from Homechart Cloud.
func (a *AuthHousehold) ReadJWT(ctx context.Context, force bool) errs.Err {
	var err error

	var r *http.Request

	var ah AuthHouseholdJWT

	if e, err := jwt.VerifyJWT(c.App.CloudPublicKey, &ah, a.CloudJWT); err != nil || time.Now().Add(1*time.Hour).After(e) || ah.SelfHostedID == nil || ah.SelfHostedID.UUID != a.ID || force {
		r, err = http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api/v1/cloud/%s/jwt", c.App.CloudEndpoint, a.ID), nil)
		if err == nil {
			client := &http.Client{}

			var res *http.Response

			res, err = client.Do(r)
			if err == nil {
				defer res.Body.Close()

				var b []byte

				b, err = io.ReadAll(res.Body)
				if err == nil {
					s := AuthHouseholdJWT{}

					if _, err := jwt.VerifyJWT(c.App.CloudPublicKey, &s, string(b)); err == nil {
						a.CloudJWT = string(b)
						ah = s
					}
				}
			}
		}
	}

	if ah.SelfHostedID != nil && ah.SelfHostedID.UUID == a.ID {
		a.SubscriptionProcessor = ah.SubscriptionProcessor
		a.SubscriptionExpires = ah.SubscriptionExpires
	} else {
		a.SubscriptionProcessor = AuthHouseholdSubscriptionProcessorNone
		a.SubscriptionExpires = types.CivilDateToday().AddDays(-1)
	}

	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(err))
	}

	return logger.Log(ctx, db.Exec(ctx, `
UPDATE auth_household
SET
	  cloud_jwt = :cloud_jwt
	, subscription_expires = :subscription_expires
	, subscription_processor = :subscription_processor
WHERE id = :id
RETURNING *`, a))
}

// ReadSubscriptionCustomerID queries a database for an AuthHousehold using a SubscriptionCustomerID.
func (a *AuthHousehold) ReadSubscriptionCustomerID(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Read AuthHousehold
	return logger.Log(ctx, db.Query(ctx, false, a, "SELECT * FROM auth_household WHERE subscription_customer_id != '' AND subscription_customer_id = :subscription_customer_id", a))
}

// ReadReferral queries a database for an AuthHousehold using a referral code.
func (a *AuthHousehold) ReadReferral(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Read AuthHousehold
	return logger.Log(ctx, db.Query(ctx, false, a, "SELECT * FROM auth_household WHERE subscription_referral_code = :subscription_referral_code", a))
}

// Update updates an AuthHousehold using an ID.
func (a *AuthHousehold) Update(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	a.validateFeatureVotes()

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_household
SET
	  backup_encryption_key = :backup_encryption_key
	, feature_votes = :feature_votes
	, name = :name
	, preferences = :preferences
	, self_hosted_id = :self_hosted_id
	, self_hosted_url = :self_hosted_url
	, subscription_referrer_code = :subscription_referrer_code
	, subscription_referral_code = :subscription_referral_code
WHERE id = :id
RETURNING *
`, a))
}

// UpdateSelfHosted updates an AuthHousehold self hosted settings using an ID.
func (a *AuthHousehold) UpdateSelfHosted(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_household
SET
	  subscription_referral_code = :subscription_referral_code
	, subscription_referrer_code = :subscription_referrer_code
	, self_hosted_url = :self_hosted_url
WHERE self_hosted_id = :self_hosted_id
RETURNING *
`, a))
}

// UpdateSubscription updates an AuthHousehold subscription using ID.
func (a *AuthHousehold) UpdateSubscription(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, a, `
UPDATE auth_household
SET
	  notified_expired = false
	, notified_expiring = false
	, subscription_customer_id = :subscription_customer_id
	, subscription_expires = :subscription_expires
	, subscription_id = :subscription_id
	, subscription_last_transaction_id = :subscription_last_transaction_id
	, subscription_processor = :subscription_processor
	, subscription_referral_code = :subscription_referral_code
	, subscription_referral_count = :subscription_referral_count
	, subscription_referrer_code = :subscription_referrer_code
WHERE id = :id
RETURNING *
`, a))
}
