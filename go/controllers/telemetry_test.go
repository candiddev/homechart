package controllers

import (
	"fmt"
	"strings"
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestTelemetryErrorCreate(t *testing.T) {
	h.Info.Version = "1.0.0"
	want := "Something bad happened!"

	tests := map[string]struct {
		input string
		want  bool
	}{
		"invalid": {
			input: "1",
		},
		"valid": {
			input: h.Info.Version,
			want:  true,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			logger.SetStd()
			r := request{
				data: telemetryError{
					Error:   want,
					Path:    "/home",
					Version: tc.input,
				},
				method: "POST",
				uri:    "/telemetry/errors",
			}

			noError(t, r.do())

			assert.Equal(t, strings.Contains(logger.ReadStd(), fmt.Sprintf("debug='%s'", want)), tc.want)
		})
	}
}
