package types

import (
	"errors"
	"regexp"
	"sort"
)

var (
	envAllowedCharacters = regexp.MustCompile(`^(\w|_)+$`)
	envStartsWithInt     = regexp.MustCompile(`^\d`)
)

var ErrEnvAllowedCharacters = errors.New("must only contain letters, underscores, and numbers")
var ErrEnvStartsWithInt = errors.New("must not start with a number")

// EnvVars is a map of environment variables.
type EnvVars map[string]string

// EnvValidate checks if a string is a valid environment variable.
func EnvValidate(s string) error {
	switch {
	case envStartsWithInt.MatchString(s):
		return ErrEnvStartsWithInt
	case !envAllowedCharacters.MatchString(s):
		return ErrEnvAllowedCharacters
	}

	return nil
}

// GetEnv returns a list of environment variables in k=v format.
func (e EnvVars) GetEnv() []string {
	keys := []string{}

	for k := range e {
		keys = append(keys, k)
	}

	sort.Strings(keys)

	s := make([]string, len(keys))

	for i := range keys {
		s[i] = keys[i] + "=" + e[keys[i]]
	}

	return s
}
