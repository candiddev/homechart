package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/cryptolib"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestSecretsValueCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.SecretsValues[0]
	good.NameEncrypted = cryptolib.EncryptedValue{
		Ciphertext: "testcreate",
		Encryption: cryptolib.EncryptionAES128GCM,
	}

	good.ID = uuid.Nil

	var s models.SecretsValues

	noError(t, request{
		data:         good,
		method:       "POST",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/secrets/values",
	}.do())
	assert.Equal(t, s[0].NameEncrypted, good.NameEncrypted)
	assert.Equal(t, s[0].AuthHouseholdID, nil)

	models.Delete(ctx, &s[0], models.DeleteOpts{})
}

func TestSecretsValueDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.SecretsValues[0]
	d.ID = uuid.Nil
	d.NameEncrypted = cryptolib.EncryptedValue{
		Ciphertext: "testdelete",
		Encryption: cryptolib.EncryptionAES128GCM,
	}
	models.Create(ctx, &d, models.CreateOpts{})

	noError(t, request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/secrets/values/" + d.ID.String(),
	}.do())
}

func TestSecretsValueRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.SecretsValues

	noError(t, request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/secrets/values/" + seed.SecretsValues[3].ID.String(),
	}.do())
	assert.Equal(t, s[0].NameEncrypted, seed.SecretsValues[3].NameEncrypted)
}

func TestSecretsValueUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	s := seed.SecretsValues[0]
	s.ID = uuid.Nil
	s.NameEncrypted = cryptolib.EncryptedValue{
		Ciphertext: "testupdate",
		Encryption: cryptolib.EncryptionAES128GCM,
	}

	models.Create(ctx, &s, models.CreateOpts{})

	newName := s
	newName.NameEncrypted = cryptolib.EncryptedValue{
		Ciphertext: "testupdate1",
		Encryption: cryptolib.EncryptionAES128GCM,
	}

	var snew models.SecretsValues

	noError(t, request{
		data:         newName,
		method:       "PUT",
		responseType: &snew,
		session:      seed.AuthSessions[0],
		uri:          "/secrets/values/" + newName.ID.String(),
	}.do())

	snew[0].Updated = newName.Updated

	assert.Equal(t, snew[0], newName)

	models.Delete(ctx, &s, models.DeleteOpts{})
}

func TestSecretsValuesRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.SecretsValues

	r := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/secrets/values",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(s), 0)
	assert.Equal(t, len(msg.DataIDs), 4)
}
