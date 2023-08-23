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

func generateCloud(ctx context.Context, _ []string, c *config.Config) errs.Err {
	t, err := jwt.SignJWT(c.App.CloudPrivateKey, &jwtCloud{
		Cloud: true,
	}, time.Now().Add(24*time.Hour*365*5), "Homechart", c.App.BaseURL, "Cloud")
	if err != nil {
		return logger.Log(ctx, errs.NewCLIErr(err))
	}

	c.CLIConfig().Print(t)

	return nil
}
