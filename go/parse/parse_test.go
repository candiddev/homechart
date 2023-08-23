package parse

import (
	"context"
	"os"
	"testing"

	"github.com/candiddev/shared/go/logger"
)

var ctx context.Context

func TestMain(m *testing.M) {
	ctx = context.Background()

	ctx = logger.SetDebug(ctx, true)
	r := m.Run()
	os.Exit(r)
}
