package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
)

// AdminFeatureVotesDelete deletes all the feature votes.
func (*Handler) AdminFeatureVotesDelete(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	WriteResponse(ctx, w, nil, nil, 0, "", logger.Error(ctx, models.AuthHouseholdsDeleteFeatureVotes(ctx)))
}

// AdminFeatureVotesRead reads all the feature votes.
func (*Handler) AdminFeatureVotesRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	votes, err := models.AuthHouseholdsReadFeatureVotes(ctx)

	WriteResponse(ctx, w, votes, nil, len(votes), "", logger.Error(ctx, err))
}
