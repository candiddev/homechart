package models

import (
	"bytes"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestDataFromDatabase(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]

	assert.Equal(t, ah.Create(ctx, false), nil)

	pt := seed.PlanTasks[0]
	pt.AuthAccountID = nil
	pt.AuthHouseholdID = &ah.ID
	pt.ID = uuid.Nil
	pt.Name = "MUST BE MISSING"
	pt.PlanProjectID = nil

	assert.Equal(t, pt.create(ctx, CreateOpts{}), nil)

	data, err := DataFromDatabase(ctx, seed.AuthHouseholds[0].ID)

	assert.Equal(t, err, nil)

	got := false

	for i := range data.PlanTasks {
		if data.PlanTasks[i].ID == pt.ID {
			got = true
		}
	}

	assert.Equal(t, got, false)
	assert.Equal(t, len(data.PlanTasks), len(seed.PlanTasks)+2*20)
}

func TestExportReadDataFromByte(t *testing.T) {
	logger.UseTestLogger(t)

	var out1 []byte

	out1, err := seed.ExportByte(ctx, "")

	assert.Equal(t, err, nil)
	assert.Equal(t, len(out1) != 0, true)

	var out2 []byte

	out2, err = seed.ExportByte(ctx, "secret")

	assert.Equal(t, err, nil)
	assert.Equal(t, bytes.Equal(out1, out2), false)

	var in *Data

	in, err = DataFromByte(ctx, out1, "")

	assert.Equal(t, err, nil)
	assert.Equal(t, len(in.CookRecipes), len(seed.CookRecipes))

	in, err = DataFromByte(ctx, out2, "secret")

	assert.Equal(t, err, nil)
	assert.Equal(t, len(in.CookRecipes), len(seed.CookRecipes))
}

func TestDataRestore(t *testing.T) {
	logger.UseTestLogger(t)

	input, _ := DataFromDatabase(ctx, seed.AuthHouseholds[1].ID)

	seed.AuthAccounts[3].Delete(ctx)
	seed.AuthAccounts[4].Delete(ctx)
	seed.AuthHouseholds[1].Delete(ctx)

	err := input.Restore(ctx, false)

	assert.Equal(t, err, nil)

	output, _ := DataFromDatabase(ctx, input.AuthHouseholds[0].ID)

	assert.Equal(t, len(input.AuthAccounts), len(output.AuthAccounts))
	assert.Equal(t, len(input.CookMealTimes), len(output.CookMealTimes))
	assert.Equal(t, len(input.PlanTasks), len(output.PlanTasks))
}

func TestDataSend(t *testing.T) {
	logger.UseTestLogger(t)

	input, _ := DataFromDatabase(ctx, seed.AuthHouseholds[1].ID)

	var got ShopItems

	srv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		output, _ := io.ReadAll(r.Body)
		data, _ := DataFromByte(ctx, output, "secret")
		got = data.ShopItems
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	}))

	defer srv.Close()

	endpoint := c.App.CloudEndpoint
	c.App.CloudEndpoint = srv.URL

	err := input.Send(ctx, seed.AuthHouseholds[0].ID, "secret")

	assert.Equal(t, err, nil)
	assert.Equal(t, got, input.ShopItems)

	c.App.CloudEndpoint = endpoint
}
