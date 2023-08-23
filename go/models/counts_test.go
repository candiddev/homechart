package models

import (
	"regexp"
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/prometheus/client_golang/prometheus"
)

func TestCountsReadReset(t *testing.T) {
	logger.UseTestLogger(t)

	r := regexp.MustCompile("^homechart_model")

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "test@homechart.app"
	aa.Create(ctx, false)

	ah := seed.AuthHouseholds[0]
	ah.Demo = true
	ah.Create(ctx, false)

	n := Notification{
		AuthAccountID: &aa.ID,
	}
	n.create(ctx, CreateOpts{})

	db.Exec(ctx, "analyze", nil)

	CountsRead(ctx)

	metrics, _ := prometheus.DefaultGatherer.Gather()

	for _, metric := range metrics {
		n := metric.GetName()
		v := metric.GetMetric()

		if r.MatchString(n) {
			t.Run(n, func(t *testing.T) {
				assert.Equal(t, v[0].GetGauge().GetValue() != 0, true)
			})
		}

		if n == "homechart_model_auth_household" {
			for _, label := range v {
				switch *label.Label[0].Value {
				case "demo":
					assert.Equal(t, *label.Gauge.Value, float64(1))
				case "all":
					assert.Equal(t, *label.Gauge.Value, float64(2))
				}
			}
		}
	}

	CountsReset(ctx)

	metrics, _ = prometheus.DefaultGatherer.Gather()

	for _, metric := range metrics {
		n := metric.GetName()
		v := metric.GetMetric()

		if r.MatchString(n) {
			t.Run(n, func(t *testing.T) {
				assert.Equal(t, v[0].GetGauge().GetValue(), 0)
			})
		}
	}

	aa.Delete(ctx)
	ah.Delete(ctx)
}
