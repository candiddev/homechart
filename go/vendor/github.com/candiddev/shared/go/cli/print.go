package cli

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"sigs.k8s.io/yaml"
)

var ErrPrint = errors.New("error printing config")

// Print outputs the config to stdout.
func (c *Config) Print(i any) {
	var err error

	var out []byte

	if c.OutputJSON {
		out, err = json.MarshalIndent(i, "", "  ")
	} else {
		out, err = yaml.Marshal(i)
	}

	if err == nil {
		fmt.Printf("%s", out) //nolint:forbidigo

		if c.OutputJSON {
			fmt.Println() //nolint:forbidigo
		}
	}
}

func printConfig[T AppConfig[any]](ctx context.Context, a App[T]) errs.Err {
	var out map[string]any

	j, err := json.Marshal(a.Config)
	if err != nil {
		return logger.Log(ctx, errs.NewCLIErr(ErrPrint, err))
	}

	err = json.Unmarshal(j, &out)
	if err != nil {
		return logger.Log(ctx, errs.NewCLIErr(ErrPrint, err))
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

	a.Config.CLIConfig().Print(out)

	return logger.Log(ctx, nil)
}
