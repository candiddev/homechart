package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

func TestRewardCardCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.RewardCards[0]
	good.Name = "TestRewardCardCreate"

	var s models.RewardCards

	noError(t, request{
		data:         good,
		method:       "POST",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/reward/cards",
	}.do())
	assert.Equal(t, s[0].Name, good.Name)

	s[0].AuthHouseholdID = seed.AuthHouseholds[0].ID
	models.Delete(ctx, &s[0], models.DeleteOpts{})
}

func TestRewardCardDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.RewardCards[0]
	d.Name = "TestRewardCardDelete"
	d.Senders = types.SliceString{
		seed.AuthAccounts[4].ID.String(),
	}
	models.Create(ctx, &d, models.CreateOpts{})

	noError(t, request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/reward/cards/" + d.ID.String(),
	}.do())
}

func TestRewardCardRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.RewardCards

	noError(t, request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/reward/cards/" + seed.RewardCards[0].ID.String(),
	}.do())
	assert.Equal(t, s[0].Name, seed.RewardCards[0].Name)
}

func TestRewardCardUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	si := seed.RewardCards[0]
	si.Name = "TestRewardCardUpdate"
	models.Create(ctx, &si, models.CreateOpts{})

	newName := si
	newName.Name = "TestRewardCardUpdate1"

	var s models.RewardCards

	noError(t, request{
		data:         newName,
		method:       "PUT",
		responseType: &s,
		session:      seed.AuthSessions[0],
		uri:          "/reward/cards/" + si.ID.String(),
	}.do())

	s[0].AuthHouseholdID = newName.AuthHouseholdID
	s[0].Updated = newName.Updated

	assert.Equal(t, s[0], newName)

	models.Delete(ctx, &si, models.DeleteOpts{})
}

func TestRewardCardsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var s models.RewardCards

	r := request{
		method:       "GET",
		responseType: &s,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/reward/cards",
	}

	msg := r.do()

	noError(t, msg)
	assert.Equal(t, len(s), 0)
	assert.Equal(t, len(msg.DataIDs), 4)
}
