// Package config contains configuration structs for Homechart.
package config

import (
	"context"

	"github.com/candiddev/shared/go/cli"
	"github.com/candiddev/shared/go/config"
	"github.com/candiddev/shared/go/cryptolib"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/paddle"
	"github.com/candiddev/shared/go/postgresql"
)

// Config contains all of the application configuration settings.
type Config struct {
	App        App                  `json:"app"`
	CLI        cli.Config           `json:"cli"`
	OAuth      OAuth                `json:"oauth,omitempty"`
	OIDC       OIDC                 `json:"oidc,omitempty"`
	Paddle     paddle.Config        `json:"paddle,omitempty"`
	PostgreSQL postgresql.Config    `json:"postgresql"`
	SMTP       notify.SMTP          `json:"smtp"`
	Tracing    logger.TracingConfig `json:"tracing,omitempty"`
	WebPush    notify.WebPush       `json:"webPush"`
}

// App contains config options.
type App struct {
	DisableTasks                          bool                `json:"disableTasks,omitempty"`
	IgnorePaymentFailures                 bool                `json:"ignorePaymentFailures,omitempty"`
	Demo                                  bool                `json:"demo,omitempty"`
	SignupDisabled                        bool                `json:"signupDisabled"`
	TestNotifier                          bool                `json:"-"`
	CacheTTLMinutes                       int                 `json:"cacheTTLMinutes"`
	KeepCalendarEventDays                 int                 `json:"keepCalendarEventDays"`
	KeepCookMealPlanDays                  int                 `json:"keepCookMealPlanDays"`
	KeepDeletedDays                       int                 `json:"keepDeletedDays"`
	KeepExpiredAuthHouseholdDays          int                 `json:"keepExpiredAuthHouseholdDays,omitempty"`
	KeepHealthLogDays                     int                 `json:"keepHealthLogDays"`
	KeepInactiveAuthAccountDays           int                 `json:"keepInactiveAuthAccountDays,omitempty"`
	KeepNotesPageVersions                 int                 `json:"keepNotesPageVersions"`
	KeepPlanTaskDays                      int                 `json:"keepPlanTaskDays"`
	Port                                  int                 `json:"port"`
	RollupBudgetTransactionsBalanceMonths int                 `json:"rollupBudgetTransactionsBalanceMonths"`
	RollupBudgetTransactionsSummaryMonths int                 `json:"rollupBudgetTransactionsSummaryMonths"`
	SessionExpirationDefaultSeconds       int                 `json:"sessionExpirationDefaultSeconds"`
	SessionExpirationRememberSeconds      int                 `json:"sessionExpirationRememberSeconds"`
	TrialDays                             int                 `json:"trialDays,omitempty"`
	BaseURL                               string              `json:"baseURL"`
	CacheControl                          string              `json:"cacheControl,omitempty"`
	ContactFeedback                       string              `json:"contactFeedback,omitempty"`
	ContactSupport                        string              `json:"contactSupport,omitempty"`
	CounterTimeZone                       string              `json:"counterTimeZone,omitempty"`
	CloudEndpoint                         string              `json:"cloudEndpoint"`
	CloudJWT                              string              `json:"cloudJWT,omitempty"`        //nolint: tagliatelle
	CloudPrivateKey                       cryptolib.KeySign   `json:"cloudPrivateKey,omitempty"` //nolint: tagliatelle
	CloudPublicKey                        cryptolib.KeyVerify `json:"-"`
	GTMID                                 string              `json:"gtmID,omitempty"`
	MOTD                                  string              `json:"motd"`
	RateLimiterKey                        string              `json:"rateLimiterKey,omitempty"`
	RateLimiterRate                       string              `json:"rateLimiterRate"`
	ProxyHeaderEmail                      string              `json:"proxyHeaderEmail"`
	ProxyHeaderName                       string              `json:"proxyHeaderName"`
	ProxyAddress                          string              `json:"proxyAddress"`
	SystemConfigKey                       string              `json:"systemConfigKey,omitempty"`
	SystemHealthKey                       string              `json:"systemHealthKey,omitempty"`
	SystemMetricsKey                      string              `json:"systemMetricsKey,omitempty"`
	SystemPprofKey                        string              `json:"systemPprofKey,omitempty"`
	SystemStopKey                         string              `json:"systemStopKey,omitempty"`
	TLSCertificate                        string              `json:"tlsCertificate"`
	TLSKey                                string              `json:"tlsKey"`
	UIDir                                 string              `json:"uiDir,omitempty"`
	UIHost                                string              `json:"uiHost,omitempty"`
	AdminEmailAddresses                   []string            `json:"adminEmailAddresses"`
	FeatureVotes                          []string            `json:"featureVotes,omitempty"`
}

// OAuth contains config options.
type OAuth struct {
	TestID  string `json:"testID,omitempty"`
	TestKey string `json:"testKey,omitempty"`
}

// OIDC contains config options.
type OIDC struct {
	AppleClientID string `json:"appleClientID,omitempty"` // AppleClientID is used for web-based sign ins and should have the right URL for the environment
	AppleKeyID    string `json:"appleKeyID,omitempty"`
	//nolint:tagliatelle
	AppleKeyPEMBase64  string `json:"appleKeyPEMBase64,omitempty"` // openssl pkcs8 -nocrypt -in <key>.p8 | base64 -w0
	AppleTeamID        string `json:"appleTeamID,omitempty"`
	GoogleClientID     string `json:"googleClientID,omitempty"`
	GoogleClientSecret string `json:"googleClientSecret,omitempty"`
}

// Default generates a default configuration.
func Default() *Config {
	return &Config{
		App: App{
			BaseURL:                               "https://web.homechart.app",
			CacheControl:                          "public, max-age=31536000, immutable",
			CacheTTLMinutes:                       15,
			CloudEndpoint:                         "https://web.homechart.app",
			KeepExpiredAuthHouseholdDays:          180,
			KeepInactiveAuthAccountDays:           180,
			KeepCalendarEventDays:                 180,
			KeepCookMealPlanDays:                  180,
			KeepDeletedDays:                       30,
			KeepHealthLogDays:                     180,
			KeepNotesPageVersions:                 10,
			KeepPlanTaskDays:                      180,
			Port:                                  3000,
			RateLimiterRate:                       "10-M",
			RollupBudgetTransactionsBalanceMonths: 48,
			RollupBudgetTransactionsSummaryMonths: 12,
			SessionExpirationDefaultSeconds:       3600,
			SessionExpirationRememberSeconds:      7776000,
			TrialDays:                             14,
		},
		PostgreSQL: postgresql.Config{
			Hostname:           "localhost",
			MaxConnections:     25,
			MaxIdleConnections: 5,
			MaxLifetimeMinutes: 5,
			Port:               5432,
			SSLMode:            "disable",
		},
		SMTP: notify.SMTP{
			NoEmailDomains: []string{"example.com"},
			Port:           587,
		},
	}
}

func (c *Config) CLIConfig() *cli.Config {
	return &c.CLI
}

func (c *Config) Parse(ctx context.Context, configArgs []string, paths string) errs.Err {
	return config.Parse(ctx, c, configArgs, "HOMECHART", "", paths)
}
