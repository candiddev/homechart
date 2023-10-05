// Package config provides functions for maanging configuration-like files.
package config

import (
	"context"
	"errors"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

var ErrGetTemplate = errors.New("error getting template")

var ErrPostTemplate = errors.New("error running post template")

// Parse reads a config from envPrefix and paths.  If envPrefix is an empty string, env will not be parsed.
func Parse(ctx context.Context, c any, envPrefix, extension, configArgs, paths string) errs.Err { //nolint:revive
	if err := getFiles(ctx, c, paths); err != nil {
		return logger.Error(ctx, err)
	}

	if envPrefix != "" {
		if err := getEnv(ctx, c, envPrefix); err != nil {
			return logger.Error(ctx, err)
		}
	}

	if configArgs != "" {
		if err := getArgs(ctx, c, configArgs); err != nil {
			return logger.Error(ctx, err)
		}
	}

	return logger.Error(ctx, nil)
}
