//go:build !race
// +build !race

package controllers

import (
	"fmt"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"golang.org/x/net/context"
)

func TestSSE(t *testing.T) {
	logger.UseTestLogger(t)

	ctx, cancel := context.WithCancel(ctx)

	sse := newSSE()

	go sse.Listen(ctx, &h.Config.PostgreSQL)

	closer := make(chan bool)
	realCloser := make(chan bool)
	receiver := make(chan string)

	client := sseClient{
		ID:            models.GenerateUUID(),
		AuthAccountID: models.GenerateUUID(),
		AuthHouseholdIDs: types.UUIDs{
			models.GenerateUUID(),
		},
		Closer:   closer,
		Receiver: receiver,
	}

	go func() {
		for {
			select {
			case <-closer:
				continue
			case <-realCloser:
				return
			}
		}
	}()

	// Test client add
	sse.ClientAdd <- client

	time.Sleep(500 * time.Millisecond)

	assert.Equal(t, sse.Clients, []sseClient{
		client,
	})

	// Test client receive
	h.Config.PostgreSQL.Exec(ctx, fmt.Sprintf(`
notify changes,
'{
	"authAccountID": %[1]q,
	"authHouseholdID": null,
	"id": %[1]q,
	"operation": 1,
	"table": "auth_account"
}'
`, client.AuthAccountID), nil)

	assert.Equal(t, <-receiver, fmt.Sprintf(`{"id":%q,"operation":1,"table":"auth_account","updated":null}`, client.AuthAccountID))

	h.Config.PostgreSQL.Exec(ctx, fmt.Sprintf(`
notify changes,
'{
	"authAccountID": null,
	"authHouseholdID": %[1]q,
	"id": %[1]q,
	"operation": 1,
	"table": "auth_household"
}'
`, client.AuthHouseholdIDs[0]), nil)

	assert.Equal(t, <-receiver, fmt.Sprintf(`{"id":%q,"operation":1,"table":"auth_household","updated":null}`, client.AuthHouseholdIDs[0]))

	h.Config.PostgreSQL.Exec(ctx, fmt.Sprintf(`
notify changes,
'{
	"authAccountID": null,
	"authHouseholdID": null,
	"id": %[1]q,
	"operation": 1,
	"table": "plan_task"
}'
`, client.ID), nil)

	assert.Equal(t, <-receiver, fmt.Sprintf(`{"id":%q,"operation":1,"table":"plan_task","updated":null}`, client.ID))

	// Test client remove
	sse.ClientAdd <- client
	sse.ClientRemove <- client

	time.Sleep(1 * time.Second)

	assert.Equal(t, sse.Clients, []sseClient{
		client,
	})

	sse.ClientRemove <- client

	time.Sleep(1 * time.Second)

	assert.Equal(t, sse.Clients, []sseClient{})

	cancel()
	realCloser <- true

	time.Sleep(1 * time.Second)
}
