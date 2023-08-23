package cli

import (
	"io"
	"os"
	"strings"
)

// ReadStdin returns the current value of os.Stdin.
func ReadStdin() string {
	b, e := io.ReadAll(os.Stdin)
	if e == nil {
		return strings.TrimSpace(string(b))
	}

	return ""
}

// SetStdin sets a value to be passed to stdin.
func SetStdin(in string) {
	r, w, _ := os.Pipe()
	os.Stdin = r

	w.WriteString(strings.TrimSpace(in)) //nolint:errcheck
	w.Close()
}
