// Package tasks contains the Homechart task runner.
package tasks

import (
	"context"
	"fmt"
	"net/http"
	"time"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/homechart/go/controllers"
	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/cli"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/metrics"
	"github.com/candiddev/shared/go/postgresql"
)

// Tasks contains task scheduling and DB data.
type Tasks struct {
	Config  *config.Config
	Context context.Context //nolint:containedctx
	Cloud   bool
}

// New creates a task runner.
func New(ctx context.Context, c *config.Config, cloud bool) *Tasks {
	t := Tasks{
		Cloud:   cloud,
		Config:  c,
		Context: ctx,
	}

	return &t
}

// Runner runs tasks.
func (t *Tasks) Runner(ctx context.Context) {
	metrics.TaskRunner.WithLabelValues().Set(1)

	// Sync to the next minute
	time.Sleep(time.Duration(59 - time.Now().Second()))

	everyDayTick := time.NewTicker(time.Hour * 24)
	defer everyDayTick.Stop()

	everyHourTick := time.NewTicker(time.Hour)

	defer everyHourTick.Stop()

	everyFiveMinutesTick := time.NewTicker(5 * time.Minute)
	defer everyFiveMinutesTick.Stop()

	everyMinuteTick := time.NewTicker(time.Minute)
	defer everyMinuteTick.Stop()

	for {
		select {
		case <-ctx.Done():
			return
		case <-everyDayTick.C:
			ctx = logger.Trace(ctx)

			go t.EveryDay(ctx)
		case <-everyHourTick.C:
			ctx = logger.Trace(ctx)

			go t.EveryHour(ctx)
		case <-everyFiveMinutesTick.C:
			ctx = logger.Trace(ctx)

			go EveryFiveMinutes(ctx)
		case <-everyMinuteTick.C:
			ctx = logger.Trace(ctx)

			go EveryMinute(ctx)
		}
	}
}

// Start runs a task runner.
func (t *Tasks) Start() { //nolint:gocognit
	var cancelRunner context.CancelFunc

	var ctxRunner context.Context

	metrics.TaskRunner.WithLabelValues().Set(0)

	conn, err := t.Config.PostgreSQL.Conn(t.Context)
	if err != nil {
		logger.Error(t.Context, errs.ErrReceiver.Wrap(err)) //nolint:errcheck

		return
	}

	defer conn.Close()

	runner := false

	for {
		select {
		case <-t.Context.Done():
			if cancelRunner != nil {
				cancelRunner()
				t.Config.PostgreSQL.LockRelease(t.Context, postgresql.LockTasks, conn)
			}

			return
		case <-time.After(10 * time.Second):
			if conn == nil {
				conn, err = t.Config.PostgreSQL.Conn(t.Context)
				if err != nil {
					logger.Error(t.Context, errs.ErrReceiver.Wrap(err)) //nolint:errcheck

					continue
				}
			}

			err = conn.PingContext(t.Context)

			if (runner && !t.Config.PostgreSQL.LockExists(t.Context, postgresql.LockTasks, conn)) || err != nil {
				err = conn.Close()
				if err != nil {
					logger.Error(t.Context, errs.ErrReceiver.Wrap(err)) //nolint:errcheck
				}

				conn, err = t.Config.PostgreSQL.Conn(t.Context)
				if err != nil {
					logger.Error(t.Context, errs.ErrReceiver.Wrap(err)) //nolint:errcheck
				}

				if runner {
					runner = false

					logger.Debug(t.Context, "Stepping down as task runner")

					cancelRunner()

					models.CountsReset(t.Context)
					metrics.TaskRunner.WithLabelValues().Set(0)
				}
			} else if !runner && t.Config.PostgreSQL.LockAcquire(t.Context, postgresql.LockTasks, conn) {
				ctxRunner, cancelRunner = context.WithCancel(t.Context)
				logger.Debug(t.Context, "Became task runner")

				runner = true

				go t.Runner(ctxRunner)
			}
		}
	}
}

// CheckUpdate checks if there is a new update available.
func (t *Tasks) CheckUpdate(ctx context.Context) {
	r, err := http.NewRequestWithContext(ctx, http.MethodGet, fmt.Sprintf("%s/api?p=server", t.Config.App.CloudEndpoint), nil)
	if err != nil {
		logger.Error(t.Context, errs.ErrReceiver.Wrap(err)) //nolint:errcheck

		return
	}

	r.Header.Add("x-homechart-version", cli.BuildVersion)

	client := &http.Client{}

	res, err := client.Do(r)
	if err != nil {
		logger.Error(t.Context, errs.ErrReceiver.Wrap(err)) //nolint:errcheck

		return
	}

	defer res.Body.Close()

	var infos []controllers.Info

	_, err = controllers.DecodeResponse(res.Body, &infos)
	if err != nil {
		return
	}

	if infos[0].Version != cli.BuildVersion {
		logger.Info(ctx, fmt.Sprintf("A new version of Homechart is available: %s", infos[0].Version))
	}
}
