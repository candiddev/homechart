package models

import (
	"context"
	"time"

	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// AuthSession defines the session fields.
type AuthSession struct {
	PrimaryAuthHouseholdID *uuid.UUID                `db:"primary_auth_household_id" json:"primaryAuthHouseholdID"`
	AuthAccountID          uuid.UUID                 `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	WebPush                *notify.WebPushClient     `db:"web_push" json:"webPush"`
	ID                     uuid.UUID                 `db:"id" format:"uuid" json:"id"`
	Key                    uuid.UUID                 `db:"key" format:"uuid" json:"key"`
	PermissionsAccount     Permissions               `db:"permissions_account" json:"permissionsAccount"`
	PermissionsHouseholds  AuthHouseholdsPermissions `db:"permissions_households" json:"permissionsHouseholds"`
	Created                time.Time                 `db:"created" format:"date-time" json:"created"`
	Expires                time.Time                 `db:"expires" format:"date-time" json:"expires"`
	ISO639Code             yaml8n.ISO639Code         `db:"iso_639_code" json:"-"`
	Admin                  bool                      `db:"admin" json:"admin,omitempty"`
	Child                  bool                      `db:"child" json:"child"`
	AuthAccountName        string                    `db:"auth_account_name" json:"-"`
	UserAgent              types.UserAgent           `db:"user_agent" json:"userAgent"`
	Name                   string                    `db:"name" json:"name"`
} // @Name AuthSession

const authSessionReadQuery1 = ` a_s.auth_account_id
	, a_s.id
	, a_s.user_agent
	, a_s.created
	, a_s.expires
	, a_s.admin
	, a_s.name
	, a_s.permissions_account
	, a_s.web_push
	, a_a.primary_auth_household_id
	, a_a.child
	, a_a.iso_639_code
	, COALESCE(
		  jsonb_agg(
				DISTINCT jsonb_build_object(
					  'authHouseholdID', a_h.auth_household_id
					, 'permissions', JSONB_BUILD_OBJECT(
						  'auth', CASE
								WHEN p.permissions -> 'auth' IS NULL or a_h.permissions -> 'auth' > p.permissions -> 'auth'
								THEN a_h.permissions -> 'auth'
								ELSE p.permissions -> 'auth'
							END
						, 'budget', CASE
								WHEN p.permissions -> 'budget' IS NULL or a_h.permissions -> 'budget' > p.permissions -> 'budget'
								THEN a_h.permissions -> 'budget'
								ELSE p.permissions -> 'budget'
							END
						, 'calendar', CASE
								WHEN p.permissions -> 'calendar' IS NULL or a_h.permissions -> 'calendar' > p.permissions -> 'calendar'
								THEN a_h.permissions -> 'calendar'
								ELSE p.permissions -> 'calendar'
							END
						, 'cook', CASE
								WHEN p.permissions -> 'cook' IS NULL or a_h.permissions -> 'cook' > p.permissions -> 'cook'
								THEN a_h.permissions -> 'cook'
								ELSE p.permissions -> 'cook'
							END
						, 'health', CASE
								WHEN p.permissions -> 'health' IS NULL or a_h.permissions -> 'health' > p.permissions -> 'health'
								THEN a_h.permissions -> 'health'
								ELSE p.permissions -> 'health'
							END
						, 'inventory', CASE
								WHEN p.permissions -> 'inventory' IS NULL or a_h.permissions -> 'inventory' > p.permissions -> 'inventory'
								THEN a_h.permissions -> 'inventory'
								ELSE p.permissions -> 'inventory'
							END
						, 'notes', CASE
								WHEN p.permissions -> 'notes' IS NULL or a_h.permissions -> 'notes' > p.permissions -> 'notes'
								THEN a_h.permissions -> 'notes'
								ELSE p.permissions -> 'notes'
							END
						, 'plan', CASE
								WHEN p.permissions -> 'plan' IS NULL or a_h.permissions -> 'plan' > p.permissions -> 'plan'
								THEN a_h.permissions -> 'plan'
								ELSE p.permissions -> 'plan'
							END
						, 'reward', CASE
								WHEN p.permissions -> 'reward' IS NULL or a_h.permissions -> 'reward' > p.permissions -> 'reward'
								THEN a_h.permissions -> 'reward'
								ELSE p.permissions -> 'reward'
							END
						, 'secrets', CASE
								WHEN p.permissions -> 'secrets' IS NULL or a_h.permissions -> 'secrets' > p.permissions -> 'secrets'
								THEN a_h.permissions -> 'secrets'
								ELSE p.permissions -> 'secrets'
							END
						, 'shop', CASE
								WHEN p.permissions -> 'shop' IS NULL or a_h.permissions -> 'shop' > p.permissions -> 'shop'
								THEN a_h.permissions -> 'shop'
								ELSE p.permissions -> 'shop'
							END
					)
				)
		  ) FILTER (WHERE a_h.id IS NOT NULL)
		, '[]'::jsonb
	) as permissions_households
FROM auth_session a_s
LEFT JOIN
	auth_account a_a ON a_a.id = a_s.auth_account_id
LEFT JOIN
	auth_account_auth_household a_h ON a_h.auth_account_id = a_s.auth_account_id
LEFT JOIN
	JSONB_TO_RECORDSET(a_s.permissions_households) AS p("authHouseholdID" text, permissions jsonb) ON a_h.auth_household_id::text = p."authHouseholdID"
`

const authSessionReadQuery2 = `
GROUP BY
	  a_s.id
	, a_a.id
`

// AuthSessionDeleteWebPush sets web_push to null for an AuthSession with endpoint.
func AuthSessionDeleteWebPush(ctx context.Context, endpoint string) errs.Err {
	ctx = logger.Trace(ctx)

	a := map[string]any{
		"endpoint": endpoint,
	}

	return logger.Error(ctx, db.Exec(ctx, "UPDATE auth_session SET web_push = null WHERE web_push ->> 'endpoint' = :endpoint", a))
}

// Create adds an AuthSession to a database.
func (a *AuthSession) Create(ctx context.Context, keepIDs bool) errs.Err {
	ctx = logger.Trace(ctx)

	// Set fields if not restoring
	if !keepIDs || a.ID == uuid.Nil {
		a.ID = GenerateUUID()
		a.Key = GenerateUUID()
	}

	a.PermissionsHouseholds.Sanitize(ctx, a.AuthAccountID)

	// Add to database
	return logger.Error(ctx, db.Query(ctx, false, a, `
INSERT INTO auth_session (
	  admin
	, auth_account_id
	, expires
	, id
	, key
	, name
	, permissions_account
	, permissions_households
	, user_agent
	, web_push
) VALUES (
	  :admin
	, :auth_account_id
	, :expires
	, :id
	, :key
	, :name
	, :permissions_account
	, :permissions_households
	, :user_agent
	, :web_push
)
RETURNING *
`, a))
}

// Delete deletes an AuthSession record.
func (a *AuthSession) Delete(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Delete session
	return logger.Error(ctx, db.Exec(ctx, "DELETE FROM auth_session WHERE id = :id AND auth_account_id = :auth_account_id", a))
}

// DeleteAll deletes all AuthSession records.
func (a *AuthSession) DeleteAll(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Delete all sessions
	return logger.Error(ctx, db.Exec(ctx, "DELETE FROM auth_session WHERE auth_account_id = :auth_account_id", a))
}

// Read queries a cache for an AuthSession.
func (a *AuthSession) Read(ctx context.Context, idOnly bool) errs.Err {
	ctx = logger.Trace(ctx)

	key := a.Key
	cache := Cache{
		ID:        &a.ID,
		TableName: "auth_session",
		Value:     a,
	}

	err := cache.Get(ctx)
	if err != nil {
		err = db.Query(ctx, false, a, `SELECT a_s.key, `+authSessionReadQuery1+`WHERE a_s.id = $1`+authSessionReadQuery2, nil, a.ID)

		if err == nil {
			cache.AuthAccountID = &a.AuthAccountID
			err := cache.Set(ctx)
			logger.Error(ctx, err) //nolint:errcheck
		}
	}

	if (!idOnly && a.Key != key) || a.Expires.Before(time.Now()) {
		err = errs.ErrSenderNotFound
		*a = AuthSession{}
	}

	return logger.Error(ctx, err)
}

// Renew updates the expiration for an AuthSession.
func (a *AuthSession) Renew(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Error(ctx, db.Query(ctx, false, a, "UPDATE auth_session SET expires = :expires WHERE id = :id RETURNING *", a))
}

// Update updates the an AuthSession using an ID.
func (a *AuthSession) Update(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	a.PermissionsHouseholds.Sanitize(ctx, a.AuthAccountID)

	// Update database
	return logger.Error(ctx, db.Query(ctx, false, a, `
UPDATE auth_session
SET
	  permissions_account = :permissions_account
	, permissions_households = :permissions_households
	, web_push = :web_push
WHERE id = :id
RETURNING *
`, a))
}

// AuthSessions are multiple AuthSession.
type AuthSessions []AuthSession

// AuthSessionsDelete deletes all AuthSessions.
func AuthSessionsDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	logger.Error(ctx, db.Exec(ctx, "DELETE FROM auth_session WHERE expires > '0001-01-01' AND expires < now()", nil)) //nolint:errcheck
}

// AuthSessionsReadAll reads all AuthSessions for an AuthAccountID.
func AuthSessionsReadAll(ctx context.Context, authAccountID uuid.UUID) (AuthSessions, errs.Err) {
	ctx = logger.Trace(ctx)

	var a AuthSessions

	return a, logger.Error(ctx, db.Query(ctx, true, &a, `SELECT `+authSessionReadQuery1+`WHERE a_s.auth_account_id = $1`+authSessionReadQuery2, nil, authAccountID))
}
