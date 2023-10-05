package config

import (
	"context"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/jsonnet"
	"github.com/candiddev/shared/go/logger"
)

func getFiles(ctx context.Context, config any, path string) errs.Err {
	if path != "" {
		for _, p := range strings.Split(path, ",") {
			r := jsonnet.NewRender(ctx, config)

			i, err := r.GetPath(ctx, p)
			if err != nil {
				return logger.Error(ctx, err)
			}

			r.Import(i)

			if err := r.Render(ctx, config); err != nil {
				return logger.Error(ctx, err)
			}
		}
	}

	return logger.Error(ctx, nil)
}
