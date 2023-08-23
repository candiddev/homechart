package controllers

import (
	"context"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/notify"
)

func TestAuthAccountName(t *testing.T) {
	tests := map[string]struct {
		input context.Context //nolint: containedctx
		want  string
	}{
		"good name": {
			input: setAuthAccountName(context.Background(), "test"),
			want:  "test",
		},
		"no string": {
			input: context.Background(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, getAuthAccountName(tc.input), tc.want)
		})
	}
}

func TestChild(t *testing.T) {
	tests := map[string]struct {
		input context.Context //nolint: containedctx
		want  bool
	}{
		"valid": {
			input: setChild(context.Background(), true),
			want:  true,
		},
		"invalid": {
			input: context.Background(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, getChild(tc.input), tc.want)
		})
	}
}

func TestFilter(t *testing.T) {
	tests := map[string]struct {
		input context.Context //nolint: containedctx
		want  string
	}{
		"valid": {
			input: setFilter(context.Background(), "filter"),
			want:  "filter",
		},
		"invalid": {
			input: context.Background(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, getFilter(tc.input), tc.want)
		})
	}
}

func TestHash(t *testing.T) {
	tests := map[string]struct {
		input context.Context //nolint: containedctx
		want  string
	}{
		"valid": {
			input: setHash(context.Background(), "test"),
			want:  "test",
		},
		"invalid": {
			input: context.Background(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, getHash(tc.input), tc.want)
		})
	}
}

func TestOffset(t *testing.T) {
	tests := map[string]struct {
		input context.Context //nolint: containedctx
		want  int
	}{
		"valid": {
			input: setOffset(context.Background(), 10),
			want:  10,
		},
		"invalid": {
			input: context.Background(),
			want:  0,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, getOffset(tc.input), tc.want)
		})
	}
}

func TestPermissions(t *testing.T) {
	tests := map[string]struct {
		input context.Context //nolint: containedctx
		want  models.PermissionsOpts
	}{
		"good permissions": {
			input: setPermissions(context.Background(), models.PermissionsOpts{
				AuthAccountID: &seed.AuthAccounts[0].ID,
			}),
			want: models.PermissionsOpts{
				AuthAccountID: &seed.AuthAccounts[0].ID,
			},
		},
		"no permissions": {
			input: context.Background(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, getPermissions(tc.input), tc.want)
		})
	}
}

func TestPublic(t *testing.T) {
	tests := map[string]struct {
		input context.Context //nolint: containedctx
		want  bool
	}{
		"public": {
			input: setPublic(context.Background()),
			want:  true,
		},
		"not public": {
			input: context.Background(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, getPublic(tc.input), tc.want)
		})
	}
}

func TestSubscriptionTrial(t *testing.T) {
	tests := map[string]struct {
		input context.Context //nolint: containedctx
		want  bool
	}{
		"valid": {
			input: setSubscriptionTrial(context.Background(), true),
			want:  true,
		},
		"invalid": {
			input: context.Background(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, getSubscriptionTrial(tc.input), tc.want)
		})
	}
}

func TestUpdated(t *testing.T) {
	tests := map[string]struct {
		input context.Context //nolint: containedctx
		want  bool
	}{
		"good time": {
			input: setUpdated(context.Background(), time.Now()),
		},
		"bad time": {
			input: context.Background(),
			want:  true,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, getUpdated(tc.input).IsZero(), tc.want)
		})
	}
}

func TestWebPush(t *testing.T) {
	tests := map[string]struct {
		input context.Context //nolint: containedctx
		want  *notify.WebPushClient
	}{
		"valid": {
			input: setWebPush(context.Background(), &notify.WebPushClient{
				Auth: "1",
			}),
			want: &notify.WebPushClient{
				Auth: "1",
			},
		},
		"invalid": {
			input: context.Background(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			assert.Equal(t, getWebPush(tc.input), tc.want)
		})
	}
}
