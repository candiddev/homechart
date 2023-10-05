package jsonnet

import (
	"context"
	"errors"
	"io/fs"
	"os"
	"path/filepath"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

// LintImports is a map of imports returned by each lint path.
type LintImports map[string]*Imports

// Lint checks a path for Jsonnet errors and optionally format errors.
func Lint(ctx context.Context, config any, path string, checkFormat bool) (types.Results, LintImports, errs.Err) { //nolint:gocognit
	i := LintImports{}
	l := types.Results{}

	f, e := os.Stat(path)
	if e != nil {
		return nil, nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("error opening path"), e))
	}

	if f.IsDir() {
		if err := filepath.WalkDir(path, func(path string, d fs.DirEntry, err error) error {
			if err == nil && !d.Type().IsDir() {
				if p := filepath.Ext(path); p != ".jsonnet" && p != ".libsonnet" {
					return nil
				}

				r := NewRender(ctx, config)
				ii, err := r.GetPath(ctx, path)
				if err != nil {
					l[path] = append(l[path], err.Error())

					return nil
				}

				r.Import(ii)
				i[path] = ii

				if checkFormat {
					if err := r.Fmt(ctx); err != nil {
						l[path] = append(l[path], err.Error())
					}
				}

				return nil
			}

			return err
		}); err != nil {
			return l, i, logger.Error(ctx, errs.ErrReceiver.Wrap(err))
		}
	} else {
		r := NewRender(ctx, config)
		ii, err := r.GetPath(ctx, path)
		if err != nil {
			l[path] = append(l[path], err.Error())

			return l, i, logger.Error(ctx, nil)
		}

		r.Import(ii)
		i[path] = ii

		if checkFormat {
			if err := r.Fmt(ctx); err != nil {
				l[path] = append(l[path], err.Error())
			}
		}
	}

	return l, i, logger.Error(ctx, nil)
}
