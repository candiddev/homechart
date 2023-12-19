package tasks

import (
	"context"
	"os"
	"runtime"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/postgresql"
)

var c *config.Config

var ctx context.Context

var seed *models.Data

func TestMain(m *testing.M) {
	ctx = context.Background()
	c = config.Default()
	c.CLI.ConfigPath = "../../homechart_config.jsonnet"
	c.Parse(ctx, nil)

	if err := models.Setup(ctx, c, true, true); err != nil {
		os.Exit(1)
	}

	var err error

	seed, err = models.Seed(ctx, false)
	if err != nil {
		os.Exit(1)
	}

	ctx = logger.SetLevel(ctx, logger.LevelDebug)

	r := m.Run()
	os.Exit(r)
}

func TestStart(t *testing.T) {
	logger.UseTestLogger(t)

	tctx, cancel := context.WithCancel(ctx)

	tasks := New(tctx, c, true)

	routines := runtime.NumGoroutine()

	go tasks.Start()

	var e bool

	time.Sleep(11 * time.Second)
	c.PostgreSQL.Query(ctx, false, &e, "SELECT EXISTS(SELECT mode FROM pg_locks WHERE objid=$1)", nil, postgresql.LockTasks)

	assert.Equal(t, e, true)
	assert.Equal(t, runtime.NumGoroutine(), routines+2)

	cancel()
	time.Sleep(1 * time.Second)

	c.PostgreSQL.Query(ctx, false, &e, "SELECT EXISTS(SELECT mode FROM pg_locks WHERE objid=$1)", nil, postgresql.LockTasks)

	assert.Equal(t, e, false)
	assert.Equal(t, runtime.NumGoroutine(), routines)
}
