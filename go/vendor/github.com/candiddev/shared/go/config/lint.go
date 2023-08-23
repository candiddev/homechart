package config

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/template"
)

// LintResults maps paths to the template.LintResults.
type LintResults map[string]template.LintResults

// LintOutputs maps paths to LintOutput.
type LintOutputs[T any] map[string]*LintOutput[T]

// LintOutput contains renderings from linting that can be used by other linters.
type LintOutput[T any] struct {
	Config T
	Text   string
}

// Show sorts and combines the messages from LintResults.
func (l LintResults) Show() []string {
	keys := make([]string, len(l))
	out := []string{}

	i := 0

	for a := range l {
		keys[i] = a
		i++
	}

	sort.Strings(keys)

	for i := range keys {
		out = append(out, l[keys[i]].Show(keys[i])...)
	}

	return out
}

// Print runs LintResults.Show using logger.LogError.
func (l LintResults) Print() {
	logger.LogError(fmt.Sprintf("Found linter errors:\n\n%s\n", strings.Join(l.Show(), "\n")))
}

var ErrLinter = errors.New("linter errors found")

// Lint will lint a path using a config and output the results.
func Lint[T any](ctx context.Context, extension, paths string, config any, getDest func() T) (LintResults, LintOutputs[T], errs.Err) {
	p, err := GetPathsText(ctx, false, extension, paths)
	if err != nil {
		return nil, nil, logger.Log(ctx, err)
	}

	m, err := ToMap(ctx, config)
	if err != nil {
		return nil, nil, logger.Log(ctx, err)
	}

	lr := LintResults{}
	lo := LintOutputs[T]{}

	for i := range p {
		lrr := template.LintResults{}

		r, err := template.Lint(ctx, p[i].Text, m)
		if err != nil {
			return nil, nil, logger.Log(ctx, err)
		}

		lo[p[i].Path] = &LintOutput[T]{
			Text: p[i].Text,
		}

		dest := getDest()

		if err := Render(ctx, config, dest, p[i].Text); err != nil {
			lrr[0] = append(lrr[0], err.Error())
		}

		lo[p[i].Path].Config = dest

		for j := range r {
			lrr[j] = append(lrr[j], r[j]...)
		}

		if len(lrr) > 0 {
			lr[p[i].Path] = lrr
		}
	}

	return lr, lo, nil
}
