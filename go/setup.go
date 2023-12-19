package main

import (
	"context"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/cli"
	"github.com/candiddev/shared/go/cryptolib"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/jwt"
	"github.com/candiddev/shared/go/logger"
)

func setup(ctx context.Context, config *config.Config) (outCtx context.Context, cancel context.CancelFunc, cloud bool, err errs.Err) { //nolint:revive
	ctx, cancel = context.WithCancel(ctx)

	if e := config.App.CloudPublicKey.UnmarshalText([]byte(appCloudPublicKey)); e != nil {
		return ctx, cancel, false, logger.Error(ctx, errs.ErrReceiver.Wrap(e))
	}

	// Check if cloud
	if config.App.CloudJWT != "" {
		var c jwtCloud

		t, _, err := jwt.Parse(config.App.CloudJWT, cryptolib.Keys[cryptolib.KeyProviderPublic]{config.App.CloudPublicKey})
		if err != nil {
			return ctx, cancel, false, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
		}

		if err := t.ParsePayload(&c, "", "", ""); err != nil {
			return ctx, cancel, false, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
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
	return ctx, cancel, cloud, logger.Error(ctx, models.Setup(ctx, config, cloud, false))
}
