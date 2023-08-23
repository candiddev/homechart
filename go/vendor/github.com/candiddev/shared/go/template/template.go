// Package template contains helpers for templating files.
package template

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"reflect"
	"strings"
	"text/template"
	"time"

	"github.com/Masterminds/sprig/v3"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/get"
	"github.com/candiddev/shared/go/logger"
	"sigs.k8s.io/yaml"
)

func parse(ctx context.Context, tmpl string, data any, cache map[string]any) (string, errs.Err) {
	var err error

	t, err := template.New("render").Funcs(sprig.FuncMap()).Funcs(template.FuncMap{
		"get": func(path string) string {
			if v, ok := cache["get_"+path]; ok {
				return v.(string)
			}

			b := &bytes.Buffer{}

			_, err = get.File(ctx, path, b, time.Time{})
			if err != nil {
				logger.Log(ctx, errs.NewCLIErr(errors.New("error getting value"), err)) //nolint:errcheck

				return ""
			}

			s := strings.TrimSpace(b.String())

			cache["get_"+path] = s

			return s
		},
		"decode_json": func(s string, arg ...any) (any, error) {
			var j any

			f := fmt.Sprintf(s, arg...)

			err := json.Unmarshal([]byte(f), &j)
			if err != nil {
				err := logger.Log(ctx, errs.NewCLIErr(errors.New("error decoding json"), err))
				logger.LogError("line contents: ", s)

				return nil, err
			}

			return j, nil
		},
		"decode_yaml": func(s string, arg ...any) (any, error) {
			var y any

			f := fmt.Sprintf(s, arg...)

			err := yaml.Unmarshal([]byte(f), &y)
			if err != nil {
				err := logger.Log(ctx, errs.NewCLIErr(errors.New("error decoding yaml"), err))
				logger.LogError("line contents: ", f)

				return nil, err
			}

			return y, nil
		},
		"dns": func(record, address string) (string, error) {
			var err error

			var r []string

			switch strings.ToLower(record) {
			case "a":
				r, err = net.LookupHost(address)
			case "cname":
				var s string

				s, err = net.LookupCNAME(address)
				r = []string{s}
			case "txt":
				r, err = net.LookupTXT(address)
			}

			if err != nil {
				return "", logger.Log(ctx, errs.NewCLIErr(errors.New("error resolving record"), err))
			}

			return strings.Join(r, ""), nil
		},
		"encode_json": func(i any) (string, error) {
			s, err := json.Marshal(i)
			if err != nil {
				return "",
					logger.Log(ctx, errs.NewCLIErr(errors.New("error encoding json"), err))
			}

			return strings.TrimSpace(string(s)), nil
		},
		"encode_yaml": func(i any) (string, error) {
			s, err := yaml.Marshal(i)
			if err != nil {
				return "", logger.Log(ctx, errs.NewCLIErr(errors.New("error encoding yaml"), err))
			}

			return strings.TrimSpace(string(s)), nil
		},
		"try": func(value any, fail ...any) any {
			v := reflect.ValueOf(value)
			if value == nil || v.IsZero() {
				if len(fail) == 0 {
					return ""
				}

				return fail[0]
			}

			return value
		},
	}).Parse(tmpl)
	if err != nil {
		return "", errs.NewCLIErr(errors.New("error parsing template"), err)
	}

	var w bytes.Buffer

	if err := t.Execute(&w, data); err != nil {
		return "", errs.NewCLIErr(errors.New("error executing template"), err)
	}

	return w.String(), logger.Log(ctx, nil)
}

// Render takes a string and a data interface and performs Go text templating against it.
func Render(ctx context.Context, tmpl string, data any) (string, errs.Err) {
	return parse(ctx, tmpl, data, map[string]any{})
}
