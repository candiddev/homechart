package models

import (
	"context"
	"errors"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

// ErrHealth means the health check failed.
var ErrHealth = errors.New("health check failed")

// Health contains health check information.
type Health struct {
	DB     bool `json:"db"`
	Status int  `json:"-"`
}

// Read checks the health of various services.
func (h *Health) Read(ctx context.Context) {
	if err := db.Health(); err != nil {
		logger.Log(ctx, errs.NewServerErr(ErrHealth, err)) //nolint:errcheck
	} else {
		h.DB = true
	}

	if h.DB {
		h.Status = 200
	} else {
		h.Status = 500
	}
}
