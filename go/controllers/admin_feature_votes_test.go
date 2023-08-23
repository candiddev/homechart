package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestAdminFeatureVotes(t *testing.T) {
	logger.UseTestLogger(t)

	as := seed.AuthSessions[0]
	as.Admin = true
	as.Create(ctx, false)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	features := models.AuthHouseholdFeatureVotes{
		models.AuthHouseholdFeatureVote{
			Amount:  5,
			Feature: 1,
		},
	}

	ah.FeatureVotes = features
	ah.Update(ctx)

	var votes models.AuthHouseholdFeatureVotes

	r := request{
		method:       "GET",
		responseType: &votes,
		session:      as,
		uri:          "/admin/feature-votes",
	}

	noError(t, r.do())
	assert.Equal(t, votes, features)

	r.method = "DELETE"

	noError(t, r.do())

	votes = models.AuthHouseholdFeatureVotes{}

	r.method = "GET"
	r.do()

	assert.Equal(t, len(votes), 0)

	ah.Delete(ctx)
	as.Delete(ctx)
}
