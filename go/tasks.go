package main

import (
	"context"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/homechart/go/tasks"
	"github.com/candiddev/shared/go/errs"
)

func tasksRun(ctx context.Context, args []string, c *config.Config) errs.Err {
	ctx, _, cloud, err := setup(ctx, c)
	if err != nil {
		return err
	}

	t := tasks.New(ctx, c, cloud)

	switch args[0] {
	case "tasks-day":
		t.EveryDay(ctx)
	case "tasks-hour":
		t.EveryHour(ctx)
	case "tasks-minute":
		tasks.EveryMinute(ctx)
	case "tasks-minute-five":
		tasks.EveryFiveMinutes(ctx)
	}

	return nil
}
