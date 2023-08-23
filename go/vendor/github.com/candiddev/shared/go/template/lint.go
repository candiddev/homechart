package template

import (
	"context"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

var ErrLintParse = errors.New("error parsing render error string")

var templateErr = regexp.MustCompile(`render:(?P<line>\d+):(\d+:)?\s(?P<error>.*)`)
var templateBlock = regexp.MustCompile(`{{\s*(?P<block>define|end|if|else|range|template|with)\s`)

// LintResults is a map of line numbers and lint errors associated with each line.
type LintResults map[int][]string

// Show sorts and orders the LintResults for CLI display.
func (r LintResults) Show(path string) []string {
	keys := make([]int, len(r))
	out := make([]string, len(r))

	i := 0

	for a := range r {
		keys[i] = a
		i++
	}

	sort.Ints(keys)

	for i := 0; i < len(keys); i++ {
		for j := range r[keys[i]] {
			if keys[i] == 0 {
				out[i] = fmt.Sprintf("%s: %s", path, r[keys[i]][j])
			} else {
				out[i] = fmt.Sprintf("%s:%d: %s", path, keys[i], r[keys[i]][j])
			}
		}
	}

	return out
}

func findBadBlock(tmpl string) int {
	var blockStart bool

	var lines []int

	for l, s := range strings.Split(tmpl, "\n") {
		if m := templateBlock.FindStringSubmatch(s); len(m) == 2 {
			if m[1] == "end" {
				blockStart = false
				lines = lines[:len(lines)-1]
			} else if !blockStart || m[1] != "else" {
				blockStart = true
				lines = append(lines, l+1)
			}
		}
	}

	if len(lines) > 0 {
		return lines[0]
	}

	return 0
}

// Lint inspects a tmpl for issues.
func Lint(ctx context.Context, tmpl string, data any) (LintResults, errs.Err) {
	r := LintResults{}

	var err error

	_, err = parse(ctx, tmpl, data, nil)

	fixed := tmpl

	for err != nil {
		m := templateErr.FindStringSubmatch(err.Error())
		if len(m) != 4 {
			return nil, logger.Log(ctx, errs.NewCLIErr(ErrLintParse, err))
		}

		var line int

		var msg string

		if m[3] == "unexpected EOF" {
			line = findBadBlock(fixed)
			msg = "missing {{ end }}"
		} else {
			line, err = strconv.Atoi(m[1])
			if err != nil {
				return nil, logger.Log(ctx, errs.NewCLIErr(ErrLintParse, err))
			}

			msg = m[3]
		}

		linesFixed := strings.Split(fixed, "\n")
		linesTmpl := strings.Split(tmpl, "\n")
		fixed = ""

		for l, s := range linesTmpl {
			if linesFixed[line-1] == s {
				r[l+1] = []string{
					msg,
				}

				continue
			} else if len(r[l+1]) > 0 {
				continue
			}

			fixed += s
			if l != len(linesTmpl)-1 {
				fixed += "\n"
			}
		}

		_, err = parse(ctx, fixed, data, nil)
	}

	return r, nil
}
