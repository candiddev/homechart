package config

import (
	"context"
	"reflect"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

func getArgs(ctx context.Context, config any, args string) errs.Err {
	k := reflect.TypeOf(config).Elem()
	v := reflect.ValueOf(config).Elem()

	values := map[string]string{}

	for _, kv := range strings.Split(args, ",") {
		if s := strings.Split(kv, "="); len(s) == 2 {
			if s[0] == "config" {
				if err := Render(ctx, config, config, s[1]); err != nil {
					return logger.Log(ctx, err)
				}
			} else {
				values[strings.ToLower(s[0])] = s[1]
			}
		}
	}

	if err := iterateConfig("", k, v, iteratorArgs, values); err != nil {
		return logger.Log(ctx, errs.NewCLIErr(ErrUpdateEnv, err))
	}

	return logger.Log(ctx, nil)
}

func iteratorArgs(key string, values any) (string, error) {
	n := strings.ToLower(key)

	if val, ok := values.(map[string]string)[n]; ok {
		return val, nil
	}

	return "", nil
}
