package config

import (
	"errors"
	"fmt"
	"reflect"
	"strconv"
	"strings"
)

// HasParser is an interface for types to import strings intelligently.
type HasParser interface {
	ParseString(string) error
}

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

		if value.CanInterface() {
			if i, ok := value.Interface().(HasParser); ok {
				err := i.ParseString(v)
				if err != nil {
					return err
				}

				continue
			}
		}

		rv, err := getValueFromString(v, value)
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

		k := value.MapIndex(keys[i])
		if k.Kind() == reflect.Interface {
			k = value.MapIndex(keys[i]).Elem()
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

func getValueFromString(input string, value reflect.Value) (reflect.Value, error) {
	if input != "" {
		switch value.Kind() { //nolint:exhaustive
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
			v := strings.Split(input, ",")

			return reflect.ValueOf(v), nil
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
