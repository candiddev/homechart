// Package logger contains functions for logging.
package logger

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"runtime"
	"sort"
	"strings"
	"testing"

	"github.com/candiddev/shared/go/errs"
	"go.opentelemetry.io/otel/attribute"
	"go.opentelemetry.io/otel/codes"
	"go.opentelemetry.io/otel/trace"
)

// CLI formatting helpers.
const (
	FontBold    = "\033[1m"
	ColorBlue   = "\033[34m"
	ColorGreen  = "\033[32m"
	ColorOrange = "\033[33m"
	ColorRed    = "\033[31m"
	ColorReset  = "\033[0m"
)

var noColor = false                                 //nolint:gochecknoglobals
var loggerDebug logger = log.New(os.Stdout, "", 0)  //nolint:gochecknoglobals
var loggerError logger = log.New(os.Stderr, "", 0)  //nolint:gochecknoglobals
var loggerNotice logger = log.New(os.Stdout, "", 0) //nolint:gochecknoglobals
var r *os.File                                      //nolint: gochecknoglobals
var stderr = os.Stderr                              //nolint: gochecknoglobals
var stdout = os.Stdout                              //nolint: gochecknoglobals
var w *os.File                                      //nolint: gochecknoglobals

// NoColor disables colored output.
func NoColor() {
	noColor = true
}

// ReadStd returns what was sent to stdout.
func ReadStd() string {
	w.Close()

	out, _ := io.ReadAll(r)
	os.Stderr = stderr
	os.Stdout = stdout

	loggerDebug.SetOutput(stdout)
	loggerError.SetOutput(stderr)
	loggerNotice.SetOutput(stdout)

	return string(out)
}

// SetStd captures stdout to be used by ReadStd.
func SetStd() {
	r, w, _ = os.Pipe()
	loggerDebug = log.New(os.Stdout, "", 0)
	loggerDebug.SetOutput(w)

	loggerError = log.New(os.Stderr, "", 0)
	loggerError.SetOutput(w)

	loggerNotice = log.New(os.Stderr, "", 0)
	loggerNotice.SetOutput(w)
	os.Stdout = w
	os.Stderr = w
}

type logger interface {
	Print(v ...any)
	SetOutput(w io.Writer)
}

type testLogger struct {
	testing.TB
}

func (testLogger) SetOutput(_ io.Writer) {}

func (t testLogger) Print(v ...any) {
	t.Helper()
	t.Log(fmt.Sprint(v...))
}

// Log will log an err with debug data.
func Log(ctx context.Context, err errs.Err, debug ...string) errs.Err {
	span := trace.SpanFromContext(ctx)

	if span.SpanContext().IsValid() {
		defer span.End()
	}

	fn, line := getFunc()

	l := fmt.Sprintf(`function='%s:%d`, fn, line)
	span.SetAttributes(attribute.String("line", l))
	span.SetStatus(codes.Ok, "")

	status := 200

	if err != nil {
		status = err.Status()

		if err.Error() != "" {
			l += fmt.Sprintf(" error='%s'", err.Error())
		}
	}

	if status != 0 && status != errs.ErrStatusCLI {
		l += fmt.Sprintf(" success=%t", status < errs.ErrStatusBadRequest)
		span.SetAttributes(attribute.Bool("success", status < errs.ErrStatusBadRequest))

		l += fmt.Sprintf(" status=%d", status)
		span.SetAttributes(attribute.Int("http.status_code", status))
	}

	if debug != nil {
		l += fmt.Sprintf(" debug='%s'", strings.TrimSpace(strings.Join(debug, " ")))
		span.SetAttributes(attribute.String("debug", strings.Join(debug, " ")))
	}

	if span.SpanContext().HasTraceID() {
		l += fmt.Sprintf(" requestID='%s'", span.SpanContext().TraceID())
	}

	attributes := []string{}

	if s, ok := ctx.Value(contextKey("keys")).(string); ok && s != "" {
		for _, k := range strings.Split(s, ",") {
			v := GetAttribute(ctx, k)
			attributes = append(attributes, fmt.Sprintf(" %s='%s'", k, v))
			span.SetAttributes(attribute.String(k, v))
		}
	}

	sort.Strings(attributes)

	l += strings.Join(attributes, "")

	if status == 0 {
		LogNotice(l)

		return err
	} else if status == errs.ErrStatusInternalServerError || status == errs.ErrStatusUI || status == errs.ErrStatusCLI {
		LogError(l)
		span.RecordError(err)
		span.SetStatus(codes.Error, err.Error())

		return err
	}

	if GetDebug(ctx) {
		LogDebug(l)
	}

	return err
}

// LogDebug logs a message to the debug logger.
func LogDebug(message ...string) {
	msg := strings.Join(append([]string{"[DEBUG] "}, message...), "")

	if noColor {
		loggerDebug.Print(msg)
	} else {
		loggerDebug.Print(ColorBlue, msg, ColorReset)
	}
}

// LogError prints a message to the Error logger.
func LogError(message ...string) {
	msg := strings.Join(append([]string{"[ERROR] "}, message...), "")

	if noColor {
		loggerError.Print(msg)
	} else {
		loggerError.Print(ColorRed, msg, ColorReset)
	}
}

// LogNotice prints a message to the Notice logger.
func LogNotice(message ...string) {
	n := "[NOTICE]"

	if noColor {
		loggerNotice.Print(strings.Join(append([]string{n, " "}, message...), ""))
	} else {
		loggerNotice.Print(ColorGreen, strings.Join(append([]string{FontBold, n, " "}, message...), ""), ColorReset)
	}
}

// UseTestLogger sets the logging output to the test logger.
func UseTestLogger(tb testing.TB) {
	tb.Helper()

	t := testLogger{TB: tb}

	noColor = true
	loggerDebug = t
	loggerError = t
	loggerNotice = t
}

func getFunc() (string, int) {
	function, _, line, _ := runtime.Caller(2)
	n := strings.Split(runtime.FuncForPC(function).Name(), "/")
	f := n[len(n)-1]

	return f, line
}
