package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestHealthRead(t *testing.T) {
	logger.UseTestLogger(t)

	var h Health

	h.Read(ctx)

	assert.Equal(t, h.Status, 200)
}
