package jsonnet

import (
	"context"
	"errors"

	"github.com/candiddev/shared/go/diff"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/go-jsonnet/formatter"
)

var ErrFmt = errors.New("files not formatted properly")

// Fmt compares the formatting and prints out a diff if a file isn't formatted properly.
func (r *Render) Fmt(ctx context.Context) errs.Err {
	e := map[string]string{}

	for i := range r.imports.Files {
		s, err := formatter.Format(i, r.imports.Files[i], formatter.DefaultOptions())
		if err != nil {
			return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrFmt, err))
		}

		if s != r.imports.Files[i] {
			e[r.imports.Files[i]] = string(diff.Diff("have "+i, []byte(r.imports.Files[i]), "want "+i, []byte(s)))
		}
	}

	if len(e) > 0 {
		msg := ""
		for i := range e {
			msg += e[i]
		}

		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrFmt), msg)
	}

	return logger.Error(ctx, nil)
}
