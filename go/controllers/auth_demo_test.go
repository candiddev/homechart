package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestAuthDemoRead(t *testing.T) {
	logger.UseTestLogger(t)

	demo := h.Config.App.Demo

	tests := map[string]struct {
		input bool
		want  int
	}{
		"demo disabled": {
			input: false,
			want:  0,
		},
		"demo enabled": {
			input: true,
			want:  1,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			h.Config.App.Demo = tc.input

			var a models.AuthSessions

			r := request{
				method:       "GET",
				responseType: &a,
				uri:          "/auth/demo",
			}

			noError(t, r.do())
			assert.Equal(t, len(a), tc.want)

			if len(a) > 0 {
				aa, _, _ := models.AuthAccountsRead(ctx, "demo.example.com", uuid.UUID{}, 0)

				for i := range aa {
					ah := models.AuthHousehold{
						ID: aa[i].PrimaryAuthHouseholdID.UUID,
					}
					ah.Delete(ctx)

					assert.Equal(t, aa[i].Delete(ctx), nil)
				}
			}
		})
	}

	h.Config.App.Demo = demo
}
