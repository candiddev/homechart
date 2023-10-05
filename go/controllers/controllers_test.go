package controllers

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"testing"
	"time"

	"github.com/candiddev/homechart/go/config"
	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
)

type request struct {
	data         any
	from         string
	form         url.Values
	hash         string
	headers      http.Header
	method       string
	offset       int
	responseType any
	session      models.AuthSession
	to           string
	updated      time.Time
	uri          string
}

var info = Info{
	Cloud:   true,
	Version: "1",
}

var ctx context.Context

var h Handler

var seed *models.Data

var ts *httptest.Server

func noError(t *testing.T, r *Response) {
	t.Helper()
	assert.Equal(t, r.Error(), "")
}

func (t request) do() *Response {
	var j []byte

	var r *http.Request

	var u string

	if strings.HasPrefix(t.uri, "/api") {
		u = fmt.Sprintf("%s%s", ts.URL, t.uri)
	} else {
		u = fmt.Sprintf("%s/api/v1%s", ts.URL, t.uri)
	}

	if t.data != nil {
		j, _ = json.Marshal(t.data)
		r, _ = http.NewRequest(t.method, u, bytes.NewBuffer(j))
	} else {
		r, _ = http.NewRequest(t.method, u, nil)
	}

	if t.headers != nil {
		r.Header = t.headers
	}

	if t.method != "GET" {
		r.Header.Add("content-type", "application/json")
	}

	if len(t.form) != 0 {
		r, _ = http.NewRequest(t.method, u, strings.NewReader(t.form.Encode()))
		r.Header.Add("content-type", "application/x-www-form-urlencoded")
	}

	if t.hash != "" {
		r.Header.Add("x-homechart-hash", t.hash)
	}

	if !t.updated.IsZero() {
		r.Header.Add("x-homechart-updated", t.updated.Format(time.RFC3339Nano))
	}

	q := r.URL.Query()

	if t.from != "" {
		q.Add("from", t.from)
	}

	if t.offset != 0 {
		q.Add("offset", strconv.Itoa(t.offset))
	}

	if t.to != "" {
		q.Add("to", t.to)
	}

	r.URL.RawQuery = q.Encode()

	if t.session.ID != uuid.Nil && t.session.Key != uuid.Nil {
		r.Header.Add("x-homechart-id", t.session.ID.String())
		r.Header.Add("x-homechart-key", t.session.Key.String())
	}

	r.Header.Add("x-homechart-ratelimiterkey", h.Config.App.RateLimiterKey)

	logger.Info(ctx, fmt.Sprintf(`"%s" method="%s" data="%s"`, t.uri, t.method, j))

	client := &http.Client{
		CheckRedirect: func(req *http.Request, via []*http.Request) error {
			return http.ErrUseLastResponse
		},
	}
	res, _ := client.Do(r)

	resp, _ := DecodeResponse(res.Body, t.responseType)

	resp.Status = res.StatusCode

	return resp
}

func TestMain(m *testing.M) {
	tz, _ := time.LoadLocation("US/Central")
	time.Local = tz

	ctx = context.Background()
	c := config.Default()
	c.Parse(ctx, "", "../../homechart_config.jsonnet")

	c.SMTP.FromAddress = "testing@homechart.app"
	if err := models.Setup(ctx, c, true, true); err != nil {
		os.Exit(1)
	}

	var err error

	seed, err = models.Seed(ctx, false)
	if err != nil {
		os.Exit(1)
	}

	c.App.AdminEmailAddresses = []string{seed.AuthAccounts[1].EmailAddress.String()}
	c.App.SystemConfigKey = "config"
	c.App.SystemHealthKey = "health"
	c.App.SystemStopKey = "stop"
	c.SMTP.NoEmailDomains = []string{}

	ctx = logger.SetLevel(ctx, logger.LevelDebug)
	c.CLI.LogLevel = logger.LevelDebug
	c.App.RateLimiterKey = "limiter"
	c.App.TestNotifier = true
	h = Handler{
		Config: c,
		Info:   &info,
		Router: chi.NewRouter(),
	}
	h.Routes(ctx)
	ts = httptest.NewServer(h.Router)
	r := m.Run()
	os.Exit(r)
}

func TestNewServer(t *testing.T) {
	logger.UseTestLogger(t)

	s := NewServer(3000, h.Router)

	assert.Equal(t, s.Addr, ":3000")
}

func TestShutdownServer(t *testing.T) {
	logger.UseTestLogger(t)

	ctx, cancel := context.WithCancel(ctx)

	quit := make(chan os.Signal)
	signal.Notify(quit, os.Interrupt) //nolint:govet,staticcheck

	srv := NewServer(3000, h.Router)

	go ShutdownServer(ctx, srv, quit, cancel)

	quit <- os.Interrupt

	time.Sleep(500 * time.Millisecond)

	assert.Equal(t, ctx.Err(), context.Canceled)
}
