package controllers

import (
	"encoding/json"
	"net/http"
	"strings"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

// SystemInfoRead returns information for the api endpoint.
func (h *Handler) SystemInfoRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	if p := r.URL.Query().Get("p"); p != "" {
		h.sendAnalytics(analyticsEventInit, types.UserAgent(strings.ToLower(p)), r)
	}

	WriteResponse(ctx, w, *h.Info, nil, 1, "", logger.Log(ctx, nil))
}

// SystemHealthRead checks application health and returns JSON.
func (*Handler) SystemHealthRead(w http.ResponseWriter, r *http.Request) {
	ctx := logger.Trace(r.Context())

	var health models.Health

	health.Read(ctx)
	w.WriteHeader(health.Status)

	if err := json.NewEncoder(w).Encode(&health); err != nil {
		logger.Log(ctx, errs.NewServerErr(err)) //nolint:errcheck
	}
}
