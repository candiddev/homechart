package config

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"strconv"
	"strings"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

type lookupFunc func(key string, lookupValues any) (string, error)

// ErrParsingValue means the iterator couldn't determine the correct value.
var ErrParsingValue = errors.New("error parsing value")

func iterateConfig(prefix string, keys reflect.Type, values reflect.Value, lFunc lookupFunc, lValues any) error {
	for i := 0; i < keys.NumField(); i++ {
		key := keys.Field(i)
		value := values.Field(i)

		if key.Type.Kind() == reflect.Struct {
			p := fmt.Sprintf("%s%s", prefix, key.Name)
			err := iterateConfig(p, key.Type, value, lFunc, lValues)

			if err != nil {
				return err
			}

			continue
		}

		if key.Type.Kind() == reflect.Map {
			if err := iterateMap(key.Name, prefix, lFunc, lValues, value); err != nil {
				return err
			}

			continue
		}

		p := fmt.Sprintf("%s_%s", prefix, key.Name)

		v, err := lFunc(p, lValues)
		if err != nil {
			return err
		}

		rv, err := getValueFromString(v, value.Kind())
		if err != nil {
			return err
		}

		if rv.IsValid() {
			value.Set(rv.Convert(value.Type()))
		}
	}

	return nil
}

func iterateMap(keyName, prefix string, lFunc lookupFunc, lValues any, value reflect.Value) error {
	keys := value.MapKeys()

	for i := range keys {
		p := fmt.Sprintf("%s%s_%s", prefix, keyName, keys[i])

		v, err := lFunc(p, lValues)
		if err != nil {
			return err
		}

		k := value.MapIndex(keys[i]).Kind()
		if k == reflect.Interface {
			k = value.MapIndex(keys[i]).Elem().Kind()
		}

		rv, err := getValueFromString(v, k)
		if err != nil {
			return err
		}

		if rv.IsValid() {
			value.SetMapIndex(keys[i], rv)
		}
	}

	return nil
}

func getValueFromString(input string, kind reflect.Kind) (reflect.Value, error) {
	if input != "" {
		switch kind { //nolint:exhaustive
		case reflect.Bool:
			if strings.ToLower(input) == "yes" {
				return reflect.ValueOf(true), nil
			} else if strings.ToLower(input) == "no" {
				return reflect.ValueOf(false), nil
			}

			v, err := strconv.ParseBool(input)
			if err != nil {
				return reflect.Value{}, err
			}

			return reflect.ValueOf(v), nil
		case reflect.Float64:
			v, err := strconv.ParseFloat(input, 64)
			if err != nil {
				return reflect.Value{}, err
			}

			if v != 0 {
				return reflect.ValueOf(v), nil
			}
		case reflect.Int:
			v, err := strconv.ParseInt(input, 10, 64)
			if err != nil {
				return reflect.Value{}, err
			}

			if v != 0 {
				return reflect.ValueOf(int(v)), nil
			}
		case reflect.Slice:
			slice := strings.Split(input, ",")

			return reflect.ValueOf(slice), nil
		case reflect.String:
			return reflect.ValueOf(input), nil
		case reflect.Uint:
			v, err := strconv.ParseUint(input, 10, 64)
			if err != nil {
				return reflect.Value{}, err
			}

			if v != 0 {
				return reflect.ValueOf(v), nil
			}
		}
	}

	return reflect.Value{}, nil
}

// ToMap converts a config to map[string]any.
func ToMap(ctx context.Context, config any) (map[string]any, errs.Err) {
	b, e := json.Marshal(config)
	if e != nil {
		return nil, logger.Log(ctx, errs.NewCLIErr(ErrRendering, e))
	}

	var m map[string]any

	if e := json.Unmarshal(b, &m); e != nil {
		return nil, logger.Log(ctx, errs.NewCLIErr(ErrRendering, e))
	}

	return m, logger.Log(ctx, nil)
}
