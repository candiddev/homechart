package main

import (
	"context"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/errs"
)

func seed(ctx context.Context, args []string, c *config.Config) errs.Err {
	ctx, _, _, err := setup(ctx, c)
	if err != nil {
		return err
	}

	seed, err := models.Seed(ctx, false)
	if err != nil {
		return err
	}

	if len(args) == 2 {
		seed.ExportDisk(ctx, args[1]) //nolint:errcheck
	}

	return nil
}
