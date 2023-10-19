package oidc

import (
	"context"
	"os"
	"testing"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

var c *config.Config

var ctx context.Context

func TestMain(m *testing.M) {
	ctx = context.Background()
	c = config.Default()
	c.Parse(ctx, nil, "../../../homechart_config.json")

	ctx = logger.SetLevel(ctx, logger.LevelDebug)
	r := m.Run()
	os.Exit(r)
}

func TestSetup(t *testing.T) {
	if c.OIDC.GoogleClientID == "" {
		t.Skip("no google OIDC ID specified")

		return
	}

	logger.UseTestLogger(t)

	tests := map[string]struct {
		config *config.Config
		want   int
	}{
		"none": {
			config: config.Default(),
			want:   0,
		},
		"all": {
			config: c,
			want:   2,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			got, err := Setup(ctx, tc.config)
			assert.Equal(t, err, nil)
			assert.Equal(t, len(*got), tc.want)
		})
	}
}
