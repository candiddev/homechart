package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestSecretsVaultCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.SecretsVaults[0]
	good.Name = "TestCreate"
	good.ID = uuid.Nil

	var s models.SecretsVaults

	noError(t, request{
		data:         good,
		method:       "POST",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/secrets/vaults",
	}.do())
	assert.Equal(t, s[0].Name, good.Name)
	assert.Equal(t, s[0].AuthHouseholdID, nil)

	models.Delete(ctx, &s[0], models.DeleteOpts{})
}

func TestSecretsVaultDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.SecretsVaults[0]
	d.ID = uuid.Nil
	d.Name = "TestDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	noError(t, request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/secrets/vaults/" + d.ID.String(),
	}.do())
}

func TestSecretsVaultRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.SecretsVaults

	noError(t, request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/secrets/vaults/" + seed.SecretsVaults[1].ID.String(),
	}.do())
	assert.Equal(t, s[0].Name, seed.SecretsVaults[1].Name)
}

func TestSecretsVaultUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.SecretsVaults[0]
	s.ID = uuid.Nil
	s.Name = "TestUpdate"
	models.Create(ctx, &s, models.CreateOpts{})

	newName := s
	newName.Name = "TestUpdate1"

	var snew models.SecretsVaults

	noError(t, request{
		data:         newName,
		method:       "PUT",
		responseType: &snew,
		session:      seed.AuthSessions[0],
		uri:          "/secrets/vaults/" + newName.ID.String(),
	}.do())

	snew[0].Updated = newName.Updated

	assert.Equal(t, snew[0], newName)

	models.Delete(ctx, &s, models.DeleteOpts{})
}

func TestSecretsVaultsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.SecretsVaults

	msg := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/secrets/vaults",
	}.do()

	noError(t, msg)
	assert.Equal(t, len(s), 0)
	assert.Equal(t, len(msg.DataIDs), 2)
}
