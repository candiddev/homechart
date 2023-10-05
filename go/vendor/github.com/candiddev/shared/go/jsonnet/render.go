package jsonnet

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net"
	"os"
	"regexp"
	"strings"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/get"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/go-jsonnet"
	"github.com/google/go-jsonnet/ast"
)

var ErrRender = errors.New("error rendering jsonnet")

// Render is a jsonnet renderer.
type Render struct {
	imports *Imports
	vm      *jsonnet.VM
}

// NewRender returns a jsonnet renderer.
func NewRender(ctx context.Context, config any) *Render {
	cache := map[string]any{}
	vm := jsonnet.MakeVM()

	vm.NativeFunction(&jsonnet.NativeFunction{
		Func: func(params []any) (any, error) {
			out, err := json.Marshal(config)
			if err != nil {
				return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("error marshaling config"), err))
			}

			var m map[string]any

			if err := json.Unmarshal(out, &m); err != nil {
				return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("error unmarshaling config"), err))
			}

			return m, nil
		},
		Name: "getConfig",
	})
	vm.NativeFunction(&jsonnet.NativeFunction{
		Func: func(params []any) (any, error) {
			if key, ok := params[0].(string); ok {
				return os.Getenv(key), nil
			}

			return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("no key provided")))
		},
		Name:   "getEnv",
		Params: ast.Identifiers{"key"},
	})
	vm.NativeFunction(&jsonnet.NativeFunction{
		Func: func(params []any) (any, error) {
			if path, ok := params[0].(string); ok {
				if v, ok := cache["getPath"+path]; ok {
					return v, nil
				}

				b := &bytes.Buffer{}

				_, err := get.File(ctx, path, b, time.Time{})
				if err != nil {
					return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("error getting value"), err))
				}

				s := strings.TrimSpace(b.String())

				cache["getPath"+path] = s

				return s, nil
			}

			return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("no path provided")))
		},
		Name:   "getPath",
		Params: ast.Identifiers{"path"},
	})
	vm.NativeFunction(&jsonnet.NativeFunction{
		Func: func(params []any) (any, error) {
			t, ok := params[0].(string)
			if !ok {
				return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("no type provided")))
			}

			n, ok := params[1].(string)
			if !ok {
				return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("no hostname provided")))
			}

			var err error

			var r []string

			switch strings.ToLower(t) {
			case "a":
				r, err = net.LookupHost(n)
			case "cname":
				var s string

				s, err = net.LookupCNAME(n)
				r = []string{s}
			case "txt":
				r, err = net.LookupTXT(n)
			default:
				err = fmt.Errorf("unknown type: %s", strings.ToLower(t))
			}

			if err != nil {
				return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("error resolving record"), err))
			}

			return strings.Join(r, ""), nil
		},
		Name:   "getRecord",
		Params: ast.Identifiers{"type", "name"},
	})
	vm.NativeFunction(&jsonnet.NativeFunction{
		Func: func(params []any) (any, error) {
			reg, ok := params[0].(string)
			if !ok {
				return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("no regex provided")))
			}

			s, ok := params[1].(string)
			if !ok {
				return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(errors.New("no string provided")))
			}

			rx, e := regexp.Compile(reg)
			if e != nil {
				return nil, logger.Error(ctx, errs.ErrReceiver.Wrap(e))
			}

			return rx.MatchString(s), nil
		},
		Name:   "regexMatch",
		Params: ast.Identifiers{"regex", "string"},
	})

	return &Render{
		vm: vm,
	}
}

// Render evaluates the main.jsonnet file onto a dest.
func (r *Render) Render(ctx context.Context, dest any) errs.Err {
	if r.imports == nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrRender, fmt.Errorf("render doesn't have any imports, call Import() first")))
	}

	s, err := r.vm.EvaluateFile(r.imports.Entrypoint)
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrRender), err.Error())
	}

	if err := json.Unmarshal([]byte(s), dest); err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrRender), err.Error())
	}

	return nil
}
