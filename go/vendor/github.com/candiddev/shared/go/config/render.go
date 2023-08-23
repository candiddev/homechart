package config

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/template"
	"sigs.k8s.io/yaml"
)

var ErrRendering = errors.New("error rendering config")

// Render runs templates against a config.
func Render(ctx context.Context, config any, dest any, content string) errs.Err {
	m, err := ToMap(ctx, config)
	if err != nil {
		return logger.Log(ctx, err)
	}

	s, err := template.Render(ctx, content, m)
	if err != nil {
		err := logger.Log(ctx, errs.NewCLIErr(ErrRendering, err))

		logger.LogError("Content: \n")

		for i, l := range strings.Split(content, "\n") {
			logger.LogError(fmt.Sprintf("%d: %s", i+1, l))
		}

		return err
	}

	if e := yaml.UnmarshalStrict([]byte(s), dest); e != nil {
		err := logger.Log(ctx, errs.NewCLIErr(ErrRendering, e))
		logger.LogError("Rendered value: \n")

		for i, l := range strings.Split(s, "\n") {
			logger.LogError(fmt.Sprintf("%d: %s", i+1, l))
		}

		return err
	}

	return logger.Log(ctx, nil)
}
