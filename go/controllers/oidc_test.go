package controllers

import (
	"testing"

	"github.com/candiddev/homechart/go/oidc"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestOIDCReadProviders(t *testing.T) {
	logger.UseTestLogger(t)

	h.OIDCProviders, _ = oidc.Setup(ctx, h.Config)

	if len(*h.OIDCProviders) == 0 {
		t.Skip("No OIDC providers configured")
	}

	var o OIDCProviders

	noError(t, request{
		method:       "GET",
		responseType: &o,
		uri:          "/oidc",
	}.do())
	assert.Equal(t, len(o), 2)
}
