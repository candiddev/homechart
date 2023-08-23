// Package assert contains functions for doing test assertions.
package assert

import (
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"strings"

	"github.com/google/go-cmp/cmp"
	"github.com/google/go-cmp/cmp/cmpopts"
)

const colorFail = "\033[31m"
const colorReset = "\033[0m"

type testState interface {
	Errorf(format string, args ...any)
	Helper()
}

func logErrorf(t testState, format string, args ...any) {
	t.Helper()
	t.Errorf("%s%s%s", colorFail, fmt.Sprintf(format, args...), colorReset)
}

// Contains asserts got will contain contains.
func Contains(t testState, got, contains string) {
	t.Helper()

	if !strings.Contains(got, contains) {
		logErrorf(t, "%s does not contain %s", got, contains)
	}
}

// Equal asserts got equals want.
func Equal[T any](t testState, got T, want T) {
	t.Helper()

	gv := reflect.ValueOf(got).IsValid()
	wv := reflect.ValueOf(want).IsValid()

	if gv != wv {
		logErrorf(t, "got %v, want %v", got, want)

		return
	} else if !gv && !wv {
		return
	}

	if diff := cmp.Diff(got, want, cmpopts.EquateErrors()); diff != "" {
		logErrorf(t, "not equal (-got +want):\n%s", diff)
	}
}

// EqualJSON asserts got equals want after rendering to JSON.
func EqualJSON[T any](t testState, got T, want T) {
	t.Helper()

	gotJ, err := json.MarshalIndent(got, "", "  ")
	if err != nil {
		logErrorf(t, "unable to marshal got: %s", err)

		return
	}

	wantJ, err := json.MarshalIndent(want, "", "  ")
	if err != nil {
		logErrorf(t, "unable to marshal want: %s", err)

		return
	}

	if diff := cmp.Diff(string(gotJ), string(wantJ)); diff != "" {
		logErrorf(t, "not equal (-want +got):%s", diff)
	}
}

// HasErr asserts got is the same err as want.
func HasErr(t testState, got error, want error) {
	t.Helper()

	if (got == nil && want != nil) || (got != nil && want == nil) || (got != nil && want != nil && !errors.Is(got, want)) {
		logErrorf(t, "got %s, want %s", got, want)
	}
}
