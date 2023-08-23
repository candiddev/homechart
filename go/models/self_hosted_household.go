package models

import (
	"context"
	"time"

	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

// SelfHostedHousehold is a cofniguration for a self hosted household.
type SelfHostedHousehold struct {
	ID            uuid.UUID `db:"id"`
	Households    int       `db:"households"`
	LastIPAddress string    `db:"last_ip_address"`
	Created       time.Time `db:"created"`
	LastActivity  time.Time `db:"last_activity"`
}

// Update performs an upsert on a SelfHostedHousehold.
func (s *SelfHostedHousehold) Update(ctx context.Context) {
	ctx = logger.Trace(ctx)

	s.LastActivity = time.Now()

	err := db.Query(ctx, false, s, `
INSERT INTO self_hosted_household (
	  id
	, last_activity
	, last_ip_address
) VALUES (
	  :id
	, :last_activity
	, :last_ip_address
)
ON CONFLICT (id)
DO UPDATE
SET
	  last_activity = :last_activity
	, last_ip_address = :last_ip_address
RETURNING *
`, s)

	logger.Log(ctx, err) //nolint:errcheck
}
