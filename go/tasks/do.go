package tasks

import (
	"context"
	"sync"

	"github.com/candiddev/homechart/go/metrics"
	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

// EveryHour runs hourly tasks.
func (t *Tasks) EveryHour(ctx context.Context) {
	if t.Cloud {
		models.CountsRead(ctx)
	} else {
		ah, _, err := models.AuthHouseholdsRead(ctx, types.UUIDs{}, 0)
		if err != nil {
			logger.Error(ctx, err) //nolint:errcheck

			return
		}

		for _, a := range ah {
			if a.BackupEncryptionKey != "" {
				d, err := models.DataFromDatabase(ctx, a.ID)
				if err != nil {
					logger.Error(ctx, err) //nolint:errcheck

					return
				}

				err = d.Send(ctx, a.ID, string(a.BackupEncryptionKey))
				logger.Error(ctx, err) //nolint:errcheck
			}
		}
	}

	models.CacheDeleteExpired(ctx)

	n, err := models.AuthAccountsReadAgendaNotify(ctx)
	if err == nil && len(n) > 0 {
		wg := sync.WaitGroup{}
		for i := range n {
			wg.Add(1)

			go n[i].Send(ctx, &wg) //nolint:errcheck
		}

		wg.Wait()
	}

	logger.Error(ctx, nil, "EveryHour") //nolint:errcheck
}

// EveryMinute runs tasks every minute.
func EveryMinute(ctx context.Context) {
	wg := sync.WaitGroup{}

	wg.Add(1)

	go func() {
		n, err := models.CalendarEventsReadNotifications(ctx)
		if err == nil && len(n) > 0 {
			for i := range n {
				wg.Add(1)

				go n[i].Send(ctx, &wg) //nolint:errcheck
			}
		}

		wg.Done()
	}()

	wg.Add(1)

	go func() {
		n, err := models.CookMealPlansReadNotifications(ctx)
		if err == nil && len(n) > 0 {
			for i := range n {
				wg.Add(1)

				go n[i].Send(ctx, &wg) //nolint:errcheck
			}
		}

		wg.Done()
	}()

	wg.Add(1)

	go func() {
		n, err := models.PlanTasksReadNotifications(ctx)
		if err == nil && len(n) > 0 {
			for i := range n {
				wg.Add(1)

				go n[i].Send(ctx, &wg) //nolint:errcheck
			}
		}

		wg.Done()
	}()

	wg.Wait()

	logger.Error(ctx, nil, "EveryMinute") //nolint:errcheck
}

// EveryDay runs daily tasks.
func (t *Tasks) EveryDay(ctx context.Context) {
	if t.Cloud {
		models.AuthAccountsDeleteInactive(ctx)
		models.AuthHouseholdsDeleteEmptyAndExpired(ctx)

		n, err := models.AuthHouseholdsReadNotifiedExpiring(ctx)
		if err == nil && len(n) > 0 {
			for i := range n {
				go n[i].Send(ctx, nil) //nolint:errcheck
			}
		}

		n, err = models.AuthHouseholdsReadNotifiedExpired(ctx)
		if err == nil && len(n) > 0 {
			for i := range n {
				go n[i].Send(ctx, nil) //nolint:errcheck
			}
		}
	} else {
		t.CheckUpdate(ctx)
	}

	models.AuthSessionsDelete(ctx)
	models.CalendarEventsDelete(ctx)
	models.CookRecipesDelete(ctx)
	models.CookMealPlansDelete(ctx)
	models.HealthLogsDelete(ctx)
	models.NotesPagesDelete(ctx)
	models.NotesPageVersionsDelete(ctx)
	models.PlanTasksDelete(ctx)
	models.SecretsValuesDelete(ctx)

	models.BudgetTransactionsRollupSummary(ctx)
	models.BudgetTransactionsRollupBalance(ctx)
	models.BudgetMonthCategoriesRollup(ctx)
	models.BudgetMonthsDelete(ctx)
	models.BudgetPayeesDelete(ctx)

	logger.Error(ctx, nil, "EveryDay") //nolint:errcheck
}

// EveryFiveMinutes retries notifications.
func EveryFiveMinutes(ctx context.Context) {
	n, err := models.NotificationsReadQueue(ctx)
	metrics.ModelNotification.WithLabelValues("queue").Set(float64(len(*n)))

	if err == nil && len(*n) > 0 {
		for _, notification := range *n {
			if err := notification.Send(ctx, nil); err == nil {
				_ = notification.Delete(ctx)
			}
		}
	}

	logger.Error(ctx, nil, "EveryFiveMinutes") //nolint:errcheck
}
