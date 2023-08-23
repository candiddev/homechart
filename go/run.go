package main

import (
	"context"
	"os"
	"os/signal"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/homechart/go/controllers"
	"github.com/candiddev/homechart/go/oidc"
	"github.com/candiddev/homechart/go/tasks"
	"github.com/candiddev/shared/go/cli"
	"github.com/candiddev/shared/go/errs"
	"github.com/go-chi/chi/v5"
)

func run(ctx context.Context, _ []string, c *config.Config) errs.Err {
	ctx, cancel, cloud, err := setup(ctx, c)
	if err != nil {
		return err
	}

	if !c.App.DisableTasks {
		t := tasks.New(ctx, c, cloud)

		go t.Start()
	}

	// Setup OIDC, if any
	p, err := oidc.Setup(ctx, c)
	if err != nil {
		return err
	}

	// Setup handler
	h := controllers.Handler{
		Config: c,
		Info: &controllers.Info{
			Cloud:        cloud,
			Demo:         c.App.Demo,
			FeatureVotes: c.App.FeatureVotes,
			GTMID:        c.App.GTMID,
			MOTD:         c.App.MOTD,
			VAPID:        c.WebPush.VAPIDPublicKey,
			Version:      cli.BuildVersion,
		},
		OIDCProviders: p,
		Router:        chi.NewMux(),
	}

	srv := controllers.NewServer(c.App.Port, h.Router)
	h.Routes(ctx)

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, os.Interrupt)

	go controllers.ShutdownServer(ctx, srv, quit, cancel)

	return h.Listen(ctx, srv)
}
