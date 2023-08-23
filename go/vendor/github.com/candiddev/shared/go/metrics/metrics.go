// Package metrics contains helpers for prometheus metrics.
package metrics

import (
	"github.com/prometheus/client_golang/prometheus"
)

//nolint:gochecknoglobals
var (
	CacheRequestTotal         *prometheus.CounterVec
	ControllerEventTotal      *prometheus.CounterVec
	ControllerRequestTotal    *prometheus.CounterVec
	ControllerRequestDuration *prometheus.HistogramVec
	ControllerRequestSize     *prometheus.HistogramVec
	ControllerResponseSize    *prometheus.HistogramVec
	ControllerSSEClients      *prometheus.GaugeVec
	ControllerUserAgentTotal  *prometheus.CounterVec
	Notifications             *prometheus.CounterVec
	PostgreSQLQueryDuration   *prometheus.HistogramVec
	TaskRunner                *prometheus.GaugeVec
	TelemetryErrorTotal       *prometheus.CounterVec
)

// Setup creates new metric counters.
func Setup(appName string) {
	CacheRequestTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Help: "Cache requests",
			Name: appName + "_cache_request_total",
		},
		[]string{"type", "result"},
	)
	prometheus.MustRegister(CacheRequestTotal)

	ControllerEventTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Help: "Notable controller events",
			Name: appName + "_controller_event_total",
		},
		[]string{"event", "platform", "version"},
	)
	prometheus.MustRegister(ControllerEventTotal)

	ControllerRequestTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Help: "Count of each request--path, method, status",
			Name: appName + "_controller_request_total",
		},
		[]string{"path", "method", "status"},
	)
	prometheus.MustRegister(ControllerRequestTotal)

	ControllerRequestDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Buckets: []float64{.1, .5, 1.0},
			Help:    "Duration of the client requests in seconds labeled with HTTP path",
			Name:    appName + "_controller_request_duration",
		},
		[]string{"path", "method"},
	)
	prometheus.MustRegister(ControllerRequestDuration)

	ControllerRequestSize = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Buckets: prometheus.ExponentialBuckets(1000, 10, 4),
			Help:    "Size of the client requests in bytes labeled with HTTP path",
			Name:    appName + "_controller_request_size",
		},
		[]string{"path", "method"},
	)
	prometheus.MustRegister(ControllerRequestSize)

	ControllerResponseSize = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Buckets: prometheus.ExponentialBuckets(1000, 10, 4),
			Help:    "Size of the server responses in bytes labeled with HTTP path",
			Name:    appName + "_controller_response_size",
		},
		[]string{"path", "method"},
	)
	prometheus.MustRegister(ControllerResponseSize)

	ControllerSSEClients = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Count of SSE clients",
			Name: "homechart_controller_sse_clients",
		},
		[]string{},
	)
	prometheus.MustRegister(ControllerSSEClients)

	ControllerUserAgentTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Help: "User agent accessing API",
			Name: appName + "_controller_user_agent_total",
		},
		[]string{"user_agent"},
	)
	prometheus.MustRegister(ControllerUserAgentTotal)

	Notifications = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Help: "Gauge of Notifications",
			Name: appName + "_notifications_total",
		},
		[]string{"type", "status"},
	)
	prometheus.MustRegister(Notifications)

	PostgreSQLQueryDuration = prometheus.NewHistogramVec(
		prometheus.HistogramOpts{
			Buckets: []float64{.1, .5, 1.0},
			Name:    appName + "_postgresql_query_duration",
			Help:    "Duration of the postgresql queries in seconds labeled with table and verb",
		},
		[]string{"table", "verb"},
	)
	prometheus.MustRegister(PostgreSQLQueryDuration)

	TaskRunner = prometheus.NewGaugeVec(
		prometheus.GaugeOpts{
			Help: "Machine is running tasks (0 = no, 1 = yes)",
			Name: "homechart_task_runner",
		},
		[]string{},
	)
	prometheus.MustRegister(TaskRunner)

	TelemetryErrorTotal = prometheus.NewCounterVec(
		prometheus.CounterOpts{
			Help: "Count of client errors--path, version",
			Name: appName + "_telemetry_error_total",
		},
		[]string{"path", "version"},
	)
	prometheus.MustRegister(TelemetryErrorTotal)
}
