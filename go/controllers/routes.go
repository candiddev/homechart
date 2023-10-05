package controllers

import (
	"context"
	"fmt"
	"net/http"
	"net/http/pprof"

	"github.com/candiddev/shared/go/logger"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// ServeStatic returns static files.
func (h *Handler) ServeStatic(w http.ResponseWriter, r *http.Request) {
	switch r.URL.Path {
	case "/robots.txt":
		w.Write([]byte("User-agent: *\nAllow: /.well-known/*\nDisallow: /")) //nolint:errcheck
	case "/swagger.yaml":
		fsSwagger := http.FileServer(http.FS(staticSwagger))
		fsSwagger.ServeHTTP(w, r)
	default:
		h.serveUI(w, r)
	}
}

// Routes registers routes on a handler.
func (h *Handler) Routes(ctx context.Context) {
	ctx = logger.Trace(ctx)

	h.InitRateLimiter(ctx)

	h.Router.Use(middleware.Recoverer)
	h.Router.Use(h.SetCORS)
	h.Router.Use(h.SetRequestContext)
	h.Router.Use(h.SetCacheControl)
	h.Router.Use(middleware.Compress(5, "gzip"))
	h.Router.Get("/*", h.ServeStatic)
	h.Router.Post("/oidc", func(w http.ResponseWriter, r *http.Request) {
		// This is a hack because Apple's OIDC response is a post instead of query values
		http.Redirect(w, r, r.RequestURI+"&code="+r.FormValue("code")+"&state="+r.FormValue("state"), http.StatusFound)
	})
	h.Router.Route("/api", func(r chi.Router) {
		r.Use(h.SetTracingContext)
		r.Use(h.SessionMetrics)
		r.Get("/", h.SystemInfoRead)
		r.Get("/docs", func(w http.ResponseWriter, r *http.Request) {
			//nolint:forbidigo
			fmt.Fprint(w, `
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
	<meta charset="UTF-8">
	<title>API Reference - Homechart</title>
	<link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@3.37.0/swagger-ui.css">
	<script src="https://unpkg.com/swagger-ui-dist@3.37.0/swagger-ui-standalone-preset.js"></script>
	<script src="https://unpkg.com/swagger-ui-dist@3.37.0/swagger-ui-bundle.js"></script>
</head>
<body>
</body>
<script>
	SwaggerUIBundle({
		dom_id: "body",
		filter: true,
		layout: "StandaloneLayout",
    presets: [
      SwaggerUIBundle.presets.apis,
			SwaggerUIStandalonePreset,
    ],
		url: "/swagger.yaml",
	})
</script>
`)
		})
		r.Route("/v1", func(r chi.Router) {
			r.Route("/admin", func(r chi.Router) {
				r.Use(h.CheckSession)
				r.Use(h.CheckAdmin)
				r.Get("/feature-votes", h.AdminFeatureVotesRead)
				r.Delete("/feature-votes", h.AdminFeatureVotesDelete)
			})
			r.Route("/assistants", func(r chi.Router) {
				r.Use(h.CheckSession)
			})
			r.Route("/auth", func(r chi.Router) {
				r.Route("/accounts", func(r chi.Router) {
					r.With(h.CheckSession).With(h.GetFilter).With(h.GetOffset).Get("/", h.AuthAccountsRead)
					r.With(h.CheckRateLimiter).With(h.GetSession).Post("/", h.AuthAccountCreate)
					r.Route("/{auth_account_id}", func(r chi.Router) {
						r.With(h.CheckSession).With(h.GetCacheHeaders).Get("/", h.AuthAccountRead)
						r.With(h.CheckSession).Delete("/", h.AuthAccountDelete)
						r.With(h.CheckSession).Put("/", h.AuthAccountUpdate)
						r.With(h.CheckSession).Put("/keys", h.AuthAccountKeysUpdate)
						r.With(h.CheckSession).With(h.CheckAdmin).Delete("/sessions", h.AuthSessionDeleteAll)
						r.Route("/totp", func(r chi.Router) {
							r.Use(h.CheckSession)
							r.Get("/", h.AuthAccountTOTPRead)
							r.Post("/", h.AuthAccountTOTPCreate)
							r.Put("/", h.AuthAccountTOTPUpdate)
						})
					})
				})
				r.With(h.CheckRateLimiter).Get("/demo", h.AuthDemoRead)
				r.Route("/households", func(r chi.Router) {
					r.With(h.CheckSession).With(h.GetFilter).With(h.GetOffset).Get("/", h.AuthHouseholdsRead)
					r.With(h.CheckSession).Post("/", h.AuthHouseholdCreate)
					r.Route("/{auth_household_id}", func(r chi.Router) {
						r.Use(h.CheckSession)
						r.With(h.GetCacheHeaders).Get("/", h.AuthHouseholdRead)
						r.Delete("/", h.AuthHouseholdDelete)
						r.Put("/", h.AuthHouseholdUpdate)
						r.Get("/export", h.AuthHouseholdExport)
						r.Post("/import", h.AuthHouseholdImport)
						r.With(h.CheckRateLimiter).Post("/invites", h.AuthHouseholdInviteCreate)
						r.With(h.CheckRateLimiter).Delete("/invites/{invite_token}", h.AuthHouseholdInviteDelete)
						r.With(h.CheckRateLimiter).Get("/invites/{invite_token}", h.AuthHouseholdInviteAccept)
						r.Route("/members", func(r chi.Router) {
							r.Route("/{auth_account_id}", func(r chi.Router) {
								r.Delete("/", h.AuthHouseholdMemberDelete)
								r.Put("/", h.AuthHouseholdMemberUpdate)
							})
						})
					})
				})

				r.With(h.CheckRateLimiter).Post("/reset", h.AuthResetCreate)
				r.With(h.CheckRateLimiter).Put("/reset", h.AuthResetUpdate)
				r.Route("/sessions", func(r chi.Router) {
					r.With(h.CheckSession).Delete("/", h.AuthSessionDeleteAll)
					r.With(h.CheckSession).Get("/", h.AuthSessionsRead)
					r.With(h.CheckSession).Post("/", h.AuthSessionCreate)
					r.Route("/{auth_session_id}", func(r chi.Router) {
						r.Use(h.CheckSession)
						r.Delete("/", h.AuthSessionDelete)
						r.Put("/", h.AuthSessionUpdate)
					})
				})
				r.With(h.CheckRateLimiter).Post("/signin", h.AuthSignInCreate)
				r.With(h.CheckRateLimiter).With(h.CheckSession).Get("/signin", h.AuthSignInRead)
				r.With(h.CheckSession).Get("/verify", h.AuthAccountVerifyRead)
				r.Put("/verify", h.AuthAccountVerifyUpdate)
			})
			r.Route("/bookmarks", func(r chi.Router) {
				r.Use(h.CheckSession)
				r.With(h.GetCacheHeaders).Get("/", h.BookmarksRead)
				r.Post("/", h.BookmarkCreate)
				r.Route("/{id}", func(r chi.Router) {
					r.Delete("/", h.BookmarkDelete)
					r.Get("/", h.BookmarkRead)
					r.Put("/", h.BookmarkUpdate)
				})
			})
			r.Route("/budget", func(r chi.Router) {
				r.Use(h.CheckSession)
				r.Route("/accounts", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.BudgetAccountsRead)
					r.Post("/", h.BudgetAccountCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.BudgetAccountDelete)
						r.Get("/", h.BudgetAccountRead)
						r.Put("/", h.BudgetAccountUpdate)
						r.Post("/reconcile", h.BudgetAccountReconcile)
						r.With(h.GetOffset).Get("/transactions", h.BudgetTransactionsRead)
					})
				})
				r.Route("/categories", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.BudgetCategoriesRead)
					r.Post("/", h.BudgetCategoryCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.BudgetCategoryDelete)
						r.Get("/", h.BudgetCategoryRead)
						r.Put("/", h.BudgetCategoryUpdate)
						r.With(h.GetOffset).Get("/transactions", h.BudgetTransactionsRead)
						r.With(h.GetOffset).Get("/transactions/{year_month}", h.BudgetTransactionsRead)
					})
				})
				r.Get("/months/{auth_household_id}/{year_month}", h.BudgetMonthRead)
				r.Route("/month-categories", func(r chi.Router) {
					r.Post("/", h.BudgetMonthCategoryCreate)
					r.Put("/", h.BudgetMonthCategoryUpdate)
				})
				r.Route("/payees", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.BudgetPayeesRead)
					r.Post("/", h.BudgetPayeeCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.BudgetPayeeDelete)
						r.Get("/", h.BudgetPayeeRead)
						r.Put("/", h.BudgetPayeeUpdate)
						r.With(h.GetOffset).Get("/transactions", h.BudgetTransactionsRead)
					})
				})
				r.Route("/recurrences", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.BudgetRecurrencesRead)
					r.Post("/", h.BudgetRecurrenceCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.BudgetRecurrenceDelete)
						r.Get("/", h.BudgetRecurrenceRead)
						r.Put("/", h.BudgetRecurrenceUpdate)
					})
				})
				r.Route("/transactions", func(r chi.Router) {
					r.Post("/", h.BudgetTransactionCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.BudgetTransactionDelete)
						r.Put("/", h.BudgetTransactionUpdate)
					})
				})
			})
			r.Route("/calendar", func(r chi.Router) {
				r.Use(h.CheckSession)
				r.Route("/events", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.CalendarEventsRead)
					r.Post("/", h.CalendarEventCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.CalendarEventDelete)
						r.Get("/", h.CalendarEventRead)
						r.Put("/", h.CalendarEventUpdate)
					})
				})
				r.Route("/icalendars", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.CalendarICalendarsRead)
					r.Post("/", h.CalendarICalendarCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.CalendarICalendarDelete)
						r.Get("/", h.CalendarICalendarRead)
						r.Put("/", h.CalendarICalendarUpdate)
					})
				})
			})
			r.With(h.CheckSession).With(h.GetCacheHeaders).Get("/changes", h.ChangesRead)
			r.With(h.CheckSession).Get("/changes/{id}", h.ChangeRead)
			r.With(h.CheckSession).Get("/charts/datasets/{auth_household_id}/{chart_type}", h.ChartDatasetsRead)
			r.Route("/cloud/{self_hosted_id}", func(r chi.Router) {
				if h.Info.Cloud {
					r.Use(h.CheckRateLimiter)
				} else { // These endpoints require auth for non-cloud, cloud uses self_hosted_id
					r.Use(h.CheckSession)
				}

				r.Get("/", h.CloudHouseholdRead)
				r.Post("/", h.CloudHouseholdCreate)
				r.Put("/", h.CloudHouseholdUpdate)
				r.Get("/backups", h.CloudBackupsRead)
				r.Post("/backups", h.CloudBackupCreate)
				r.Get("/backups/{cloud_backup_id}", h.CloudBackupRead)
				r.Delete("/backups/{cloud_backup_id}", h.CloudBackupDelete)
				r.Get("/jwt", h.CloudHouseholdReadJWT)
			})
			r.Post("/contact", h.Contact)
			r.Route("/cook", func(r chi.Router) {
				r.Route("/meal-plans", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.CookMealPlansRead)
					r.Post("/", h.CookMealPlanCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.CookMealPlanDelete)
						r.Get("/", h.CookMealPlanRead)
						r.Put("/", h.CookMealPlanUpdate)
					})
				})
				r.Route("/meal-times", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.CookMealTimesRead)
					r.Post("/", h.CookMealTimeCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.CookMealTimeDelete)
						r.Get("/", h.CookMealTimeRead)
						r.Put("/", h.CookMealTimeUpdate)
					})
				})
				r.Route("/recipes", func(r chi.Router) {
					r.With(h.CheckSession).With(h.GetCacheHeaders).Get("/", h.CookRecipesRead)
					r.With(h.CheckSession).Post("/", h.CookRecipeCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.With(h.CheckSession).Delete("/", h.CookRecipeDelete)
						r.With(h.SetPublic).With(h.GetSession).With(h.GetCacheHeaders).Get("/", h.CookRecipeRead)
						r.With(h.CheckSession).Put("/", h.CookRecipeUpdate)
					})
				})
			})
			r.With(h.CheckSession).Post("/import/recipe", h.ImportCookRecipe)
			/* TODO remove this */
			r.Get("/ical/{icalendar_id}.ics", h.ICalendarRead)
			r.Route("/icalendar", func(r chi.Router) {
				r.With(h.CheckSession).Delete("/", h.ICalendarUpdate)
				r.With(h.CheckSession).Put("/", h.ICalendarUpdate)
				r.Get("/{icalendar_id}.ics", h.ICalendarRead)
			})
			r.Route("/health", func(r chi.Router) {
				r.Use(h.CheckSession)
				r.Route("/items", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.HealthItemsRead)
					r.Put("/", h.HealthItemsInit)
					r.Post("/", h.HealthItemCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.HealthItemDelete)
						r.Get("/", h.HealthItemRead)
						r.Put("/", h.HealthItemUpdate)
					})
				})
				r.Route("/logs", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.HealthLogsRead)
					r.Post("/", h.HealthLogCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.HealthLogDelete)
						r.Get("/", h.HealthLogRead)
						r.Put("/", h.HealthLogUpdate)
					})
				})
			})
			r.Route("/inventory", func(r chi.Router) {
				r.Use(h.CheckSession)
				r.Route("/items", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.InventoryItemsRead)
					r.Post("/", h.InventoryItemCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.InventoryItemDelete)
						r.Get("/", h.InventoryItemRead)
						r.Put("/", h.InventoryItemUpdate)
					})
				})
				r.Route("/collections", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.InventoryCollectionsRead)
					r.Post("/", h.InventoryCollectionCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.InventoryCollectionDelete)
						r.Get("/", h.InventoryCollectionRead)
						r.Put("/", h.InventoryCollectionUpdate)
					})
				})
			})
			r.Route("/notes", func(r chi.Router) {
				r.Route("/page-versions", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.NotesPageVersionsRead)
					r.Post("/", h.NotesPageVersionCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.NotesPageVersionDelete)
						r.Get("/", h.NotesPageVersionRead)
					})
				})
				r.Route("/pages", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.NotesPagesRead)
					r.Post("/", h.NotesPageCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.NotesPageDelete)
						r.Get("/", h.NotesPageRead)
						r.Put("/", h.NotesPageUpdate)
					})
				})
			})
			r.Route("/notifications", func(r chi.Router) {
				r.Use(h.CheckSession)
				r.Use(h.CheckAdmin)
				r.Get("/", h.NotificationsRead)
				r.Post("/", h.NotificationCreate)
				r.Route("/{id}", func(r chi.Router) {
					r.Delete("/", h.NotificationDelete)
					r.Put("/", h.NotificationUpdate)
				})
			})
			r.Get("/oidc", h.OIDCReadProviders)
			r.With(h.CheckRateLimiter).Get("/oidc/{provider}", h.OIDCReadRedirect)
			r.Route("/payments", func(r chi.Router) {
				r.Use(h.CheckRateLimiter)
				r.Delete("/", h.PaymentsDelete)
				r.Post("/", h.PaymentsCreate)
				r.Put("/", h.PaymentsUpdate)
				r.Get("/paddle", h.PaymentsPaddleRead)
				r.Post("/paddle", h.PaymentsPaddleCreate)
			})
			r.Route("/plan", func(r chi.Router) {
				r.Route("/projects", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.PlanProjectsRead)
					r.Post("/", h.PlanProjectCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.PlanProjectDelete)
						r.Get("/", h.PlanProjectRead)
						r.Put("/", h.PlanProjectUpdate)
					})
				})
				r.Route("/tasks", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.PlanTasksRead)
					r.Post("/", h.PlanTaskCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.PlanTaskDelete)
						r.Get("/", h.PlanTaskRead)
						r.Put("/", h.PlanTaskUpdate)
					})
				})
			})
			r.Route("/secrets", func(r chi.Router) {
				r.Route("/values", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.SecretsValuesRead)
					r.Post("/", h.SecretsValueCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.SecretsValueDelete)
						r.Get("/", h.SecretsValueRead)
						r.Put("/", h.SecretsValueUpdate)
					})
				})
				r.Route("/vaults", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.SecretsVaultsRead)
					r.Post("/", h.SecretsVaultCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.SecretsVaultDelete)
						r.Get("/", h.SecretsVaultRead)
						r.Put("/", h.SecretsVaultUpdate)
					})
				})
			})
			r.Route("/reward", func(r chi.Router) {
				r.Use(h.CheckSession)
				r.Route("/cards", func(r chi.Router) {
					r.With(h.GetCacheHeaders).Get("/", h.RewardCardsRead)
					r.Post("/", h.RewardCardCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.RewardCardDelete)
						r.Get("/", h.RewardCardRead)
						r.Put("/", h.RewardCardUpdate)
					})
				})
			})
			r.Route("/shop", func(r chi.Router) {
				r.Route("/categories", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.ShopCategoriesRead)
					r.Post("/", h.ShopCategoryCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.ShopCategoryDelete)
						r.Get("/", h.ShopCategoryRead)
						r.Put("/", h.ShopCategoryUpdate)
					})
				})
				r.Route("/items", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.ShopItemsRead)
					r.Post("/", h.ShopItemCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.ShopItemDelete)
						r.Get("/", h.ShopItemRead)
						r.Put("/", h.ShopItemUpdate)
					})
				})
				r.Route("/lists", func(r chi.Router) {
					r.Use(h.CheckSession)
					r.With(h.GetCacheHeaders).Get("/", h.ShopListsRead)
					r.Post("/", h.ShopListCreate)
					r.Route("/{id}", func(r chi.Router) {
						r.Delete("/", h.ShopListDelete)
						r.Get("/", h.ShopListRead)
						r.Put("/", h.ShopListUpdate)
					})
				})
			})
			r.With(h.CheckRateLimiter).Get("/sse/{auth_session_id}", h.SSERead)
			r.Route("/system", func(r chi.Router) {
				r.Use(h.CheckRateLimiter)
				r.Use(h.CheckSystemAuth)
				r.With(h.SetContentType).Get("/health", h.SystemHealthRead)
				r.Head("/health", h.SystemHealthRead)
				r.Handle("/pprof/goroutine", pprof.Handler("goroutine"))
				r.Handle("/pprof/heap", pprof.Handler("heap"))
				r.Handle("/metrics", promhttp.Handler())
			})
			r.Route("/telemetry", func(r chi.Router) {
				r.Post("/errors", h.TelemetryErrorCreate)
				r.Post("/traces", h.TelemetryTraceCreate)
			})
		})
	})

	logger.Error(ctx, nil) //nolint:errcheck
}
