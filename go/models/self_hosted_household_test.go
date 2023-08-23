package models

import (
	"testing"
	"time"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestSelfHostedHouseholdUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	db.Exec(ctx, "DELETE FROM self_hosted_household", nil)

	input := SelfHostedHousehold{
		ID:            GenerateUUID(),
		LastIPAddress: "127.0.0.1",
	}

	n := time.Now().Add(-5 * time.Minute)

	input.Update(ctx)

	assert.Equal(t, input.LastActivity.After(n), true)

	input2 := input
	input2.Update(ctx)

	assert.Equal(t, input2.LastActivity.After(input.LastActivity), true)

	var sh []SelfHostedHousehold

	db.Query(ctx, true, &sh, "select * from self_hosted_household", nil)

	assert.Equal(t, len(sh), 1)
}
