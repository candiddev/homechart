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
			values[strings.ToLower(s[0])] = s[1]
		}
	}

	if err := iterateConfig("", k, v, lookupArg, values); err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrUpdateEnv, err))
	}

	return logger.Error(ctx, nil)
}

func lookupArg(key string, values any) (string, error) {
	n := strings.ToLower(key)

	if val, ok := values.(map[string]string)[n]; ok {
		return val, nil
	}

	return "", nil
}
