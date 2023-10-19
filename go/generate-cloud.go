package main

import (
	"context"
	"time"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/jwt"
	"github.com/candiddev/shared/go/logger"
)

type jwtCloud struct {
	Cloud bool `json:"cloud"`
	jwt.RegisteredClaims
}

func (j *jwtCloud) GetRegisteredClaims() *jwt.RegisteredClaims {
	return &j.RegisteredClaims
}

func (*jwtCloud) Valid() error {
	return nil
}

func generateCloud(ctx context.Context, _ []string, c *config.Config) errs.Err {
	t, err := jwt.New(&jwtCloud{
		Cloud: true,
	}, time.Time{}, []string{"Homechart"}, "", c.App.BaseURL, "Cloud")
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	if err := t.Sign(c.App.CloudPrivateKey); err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(err))
	}

	logger.Raw(t.String() + "\n")

	return nil
}
