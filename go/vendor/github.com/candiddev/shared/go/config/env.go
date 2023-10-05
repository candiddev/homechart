package config

import (
	"context"
	"errors"
	"os"
	"reflect"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/jsonnet"
	"github.com/candiddev/shared/go/logger"
)

var ErrUpdateEnv = errors.New("error updating config from environment variable")

func getEnv(ctx context.Context, config any, prefix string) errs.Err {
	if c := os.Getenv(strings.ToUpper(prefix) + "_CONFIG"); c != "" {
		r := jsonnet.NewRender(ctx, config)
		r.Import(r.GetString(c))

		if err := r.Render(ctx, config); err != nil {
			return logger.Error(ctx, err)
		}
	}

	k := reflect.TypeOf(config).Elem()
	v := reflect.ValueOf(config).Elem()

	if err := iterateConfig(prefix+"_", k, v, lookupEnv, nil); err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrUpdateEnv, err))
	}

	return logger.Error(ctx, nil)
}

func lookupEnv(key string, _ any) (string, error) {
	n := strings.ToUpper(key)
	e := os.Getenv(n)

	return e, os.Setenv(n, "")
}
