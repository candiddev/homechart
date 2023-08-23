package models

import (
	"bytes"
	"context"
	"encoding/gob"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/metrics"
	"github.com/google/uuid"
)

// Cache stores data for future use.
type Cache struct {
	AuthAccountID   *uuid.UUID `db:"auth_account_id"`
	AuthHouseholdID *uuid.UUID `db:"auth_household_id"`
	Expires         time.Time  `db:"expires"`
	ID              *uuid.UUID `db:"id"`
	TableName       string     `db:"table_name"`
	Value           any        `db:"value"`
}

func decode(value []byte, destination any) error {
	buffer := bytes.NewReader(value)
	decoder := gob.NewDecoder(buffer)

	return decoder.Decode(destination)
}

func encode(value any) ([]byte, error) {
	buffer := bytes.Buffer{}
	encoder := gob.NewEncoder(&buffer)

	if err := encoder.Encode(value); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

// CacheDeleteExpired deletes expired cache records.
func CacheDeleteExpired(ctx context.Context) {
	ctx = logger.Trace(ctx)

	// Delete records
	err := db.Exec(ctx, `
DELETE FROM cache
WHERE
	expires < now()
`, nil)

	logger.Log(ctx, err) //nolint:errcheck
}

// Get returns a cached value from a table.
func (ca *Cache) Get(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	var value []byte

	err := db.Query(ctx, false, &value, `
SELECT value
FROM cache
WHERE
	expires > now()
	AND (
		(
			auth_account_id IS NOT NULL
			AND auth_account_id = :auth_account_id
		) OR (
			auth_household_id IS NOT NULL
			AND auth_household_id = :auth_household_id
		) OR (
			id IS NOT NULL
			AND id = :id
		)
	)
	AND table_name = :table_name
`, ca)

	if err == nil {
		err := decode(value, ca.Value)
		if err != nil {
			metrics.CacheRequestTotal.WithLabelValues(ca.TableName, "miss").Add(1)

			return logger.Log(ctx, errs.ErrClientBadRequestMissing, err.Error())
		}

		metrics.CacheRequestTotal.WithLabelValues(ca.TableName, "hit").Add(1)
	} else {
		metrics.CacheRequestTotal.WithLabelValues(ca.TableName, "miss").Add(1)
	}

	return logger.Log(ctx, err)
}

// Set adds a cached value to the DB.
func (ca *Cache) Set(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	ca.Expires = time.Now().Add(time.Minute * time.Duration(c.App.CacheTTLMinutes))

	b, err := encode(ca.Value)
	if err != nil {
		return logger.Log(ctx, errs.NewServerErr(err))
	}

	if ca.ID == nil {
		id := GenerateUUID()
		ca.ID = &id
	}

	ca.Value = b

	return logger.Log(ctx, db.Exec(ctx, `
INSERT INTO cache (
	  auth_account_id
	, auth_household_id
	, expires
	, id
	, table_name
	, value
) VALUES (
	  :auth_account_id
	, :auth_household_id
	, :expires
	, :id
	, :table_name
	, :value
)
ON CONFLICT (id, table_name)
DO UPDATE
SET
	  expires = :expires
	, value = :value
`, ca))
}
