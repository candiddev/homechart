package main

import (
	"context"
	"fmt"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/cli"
	"github.com/candiddev/shared/go/crypto"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/jwt"
	"github.com/candiddev/shared/go/logger"
)

func setup(ctx context.Context, config *config.Config) (outCtx context.Context, cancel context.CancelFunc, cloud bool, err errs.Err) { //nolint:revive
	ctx, cancel = context.WithCancel(ctx)

	config.App.CloudPublicKey = crypto.Ed25519PublicKey(appCloudPublicKey)

	// Check if cloud
	if config.App.CloudJWT != "" {
		var c jwtCloud

		_, err := jwt.VerifyJWT(config.App.CloudPublicKey, &c, config.App.CloudJWT)
		if err != nil {
			err = fmt.Errorf("invalid cloud JWT: %w", err)

			return ctx, cancel, false, logger.Log(ctx, errs.NewCLIErr(err))
		}

		cloud = c.Cloud
	}

	// Setup jaeger
	tracer, err := logger.SetupTracing(ctx, config.Tracing, config.App.BaseURL, cli.BuildVersion)
	if err != nil {
		return ctx, cancel, cloud, err
	}

	defer tracer.Shutdown(ctx) //nolint: errcheck

	// Setup models
	return ctx, cancel, cloud, logger.Log(ctx, models.Setup(ctx, config, cloud, false))
}
