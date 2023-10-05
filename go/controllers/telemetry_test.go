package controllers

import (
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

			l := logger.ReadStd()

			assert.Equal(t, strings.Contains(l, "ERROR") && strings.Contains(l, want), tc.want)
		})
	}

	logger.SetFormat(ctx, h.Config.CLI.LogFormat)
}
