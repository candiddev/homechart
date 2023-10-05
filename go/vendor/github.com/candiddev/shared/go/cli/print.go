package cli

import (
	"context"
	"encoding/json"
	"errors"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

var ErrPrint = errors.New("error printing config")

func printConfig[T AppConfig[any]](ctx context.Context, a App[T]) errs.Err {
	var out map[string]any

	j, err := json.Marshal(a.Config)
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPrint, err))
	}

	err = json.Unmarshal(j, &out)
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPrint, err))
	}

	for _, field := range a.HideConfigFields {
		f1 := field
		f2 := ""

		if strings.Contains(field, ".") {
			str := strings.Split(field, ".")
			f1 = str[0]
			f2 = str[1]
		}

		if f2 == "" {
			if out[field] != nil && len(out[field].(map[string]any)) == 0 {
				delete(out, field)
			}
		} else {
			delete(out[f1].(map[string]any), f2)
		}
	}

	logger.Info(logger.SetFormat(ctx, logger.FormatRaw), types.JSONToString(out))

	return logger.Error(ctx, nil)
}
