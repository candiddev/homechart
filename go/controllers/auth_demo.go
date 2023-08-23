package controllers

import (
	"net/http"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

// AuthDemoRead generates a temporary seed account to use.
func (h *Handler) AuthDemoRead(w http.ResponseWriter, r *http.Request) {
	if !h.Config.App.Demo {
		w.WriteHeader(http.StatusNotFound)

		return
	}

	ctx := logger.Trace(r.Context())

	if code := r.URL.Query().Get("code"); code != "" {
		ctx = models.SetISO639Code(ctx, yaml8n.ISO639Code(code))
	}

	seed, err := models.Seed(ctx, true)
	if err != nil {
		WriteResponse(ctx, w, nil, nil, 0, "", logger.Log(ctx, err))

		return
	}

	if tz := r.URL.Query().Get("timezone"); tz != "" {
		seed.AuthAccounts[0].TimeZone = types.TimeZone(tz)
	}

	err = seed.AuthAccounts[0].Update(ctx)

	WriteResponse(ctx, w, seed.AuthSessions[0], nil, 1, "", logger.Log(ctx, err))
}
