// Package logger contains functions for logging.
package logger

import (
	"context"
	"fmt"
	"io"
	"log"
	"os"
	"runtime"
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

// Level to produce logs for.
type Level string

// Levels for various logging levels.
const (
	LevelDebug Level = "debug"
	LevelInfo  Level = "info"
	LevelError Level = "error"
	LevelNone  Level = "none"
)

// Format for logs.
type Format string

// Formats for logs.
const (
	FormatHuman Format = "human"
	FormatKV    Format = "kv"
	FormatRaw   Format = "raw"
)

// Stderr is a the current stderr path.
var Stderr *os.File = os.Stderr //nolint:gochecknoglobals

// Stdout is a the current stdout path.
var Stdout *os.File = os.Stdout //nolint:gochecknoglobals

var loggerOut logger = log.New(Stdout, "", 0) //nolint:gochecknoglobals
var loggerErr logger = log.New(Stderr, "", 0) //nolint:gochecknoglobals

var noColor = false //nolint:gochecknoglobals

var r *os.File //nolint: gochecknoglobals
var w *os.File //nolint: gochecknoglobals

// NoColor disables colored output.
func NoColor() {
	noColor = true
}

// ReadStd returns what was sent to stdout.
func ReadStd() string {
	w.Close()

	out, _ := io.ReadAll(r)

	Stdout = os.Stdout
	Stderr = os.Stderr

	loggerOut.SetOutput(Stdout)
	loggerErr.SetOutput(Stderr)

	return string(out)
}

// SetStd captures stdout to be used by ReadStd.
func SetStd() {
	r, w, _ = os.Pipe()

	Stdout = w
	Stderr = w
	loggerOut = log.New(Stdout, "", 0)
	loggerErr = log.New(Stderr, "", 0)

	loggerOut.SetOutput(w)
	loggerErr.SetOutput(w)
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

func writeLog(ctx context.Context, level Level, err errs.Err, message string) { //nolint:gocognit
	span := trace.SpanFromContext(ctx)
	f, line := getFunc(3)
	f = fmt.Sprintf("%s:%d", f, line)
	format := GetFormat(ctx)
	e := ""
	status := 200

	if err != nil {
		status = err.Status()

		e = err.Error()

		if err.Logged() {
			level = LevelDebug
		}
	}

	msg := message

	if (err == nil && level == LevelError) || (err != nil && !err.Like(errs.ErrReceiver)) {
		level = LevelDebug
	}

	if level == LevelError && span.SpanContext().IsValid() {
		span.SetAttributes(attribute.Int("http.status_code", status))
		span.SetAttributes(attribute.String("level", string(level)))
		span.SetAttributes(attribute.String("line", f))
		span.SetAttributes(attribute.String("message", msg))
		span.SetStatus(codes.Ok, "")
		span.SetAttributes(attribute.Bool("success", status == 200))

		if err != nil {
			span.SetStatus(codes.Error, err.Error())
			span.RecordError(err)
		}

		defer span.End()
	}

	var out string

	switch format {
	case FormatHuman:
		out = fmt.Sprintf("%-5s %s", strings.ToUpper(string(level)), f)
		if e != "" {
			out += "\n" + e
		}

		if msg != "" {
			out += "\n" + msg
		}
	case FormatKV:
		out = fmt.Sprintf("level=%#v function=%#v status=%#v success=%#v", strings.ToUpper(string(level)), f, status, status == 200)
		if e != "" {
			out += fmt.Sprintf(` error="%s"`, e)
		}

		if span.SpanContext().HasTraceID() {
			out += fmt.Sprintf(" traceID=%#v", span.SpanContext().TraceID())
		}

		out += " " + GetAttributes(ctx)

		if msg != "" {
			out += fmt.Sprintf(` message="%s"`, msg)
		}
	case FormatRaw:
		if e != "" {
			out += e + "\n"
		}

		out += msg
	}

	m := GetLevel(ctx)

	switch {
	case m == LevelNone:
	case level == LevelError:
		if !noColor {
			out = ColorRed + out + ColorReset
		}

		loggerErr.Print(out)
	case level == LevelDebug && m == LevelDebug:
		if !noColor {
			out = ColorBlue + out + ColorReset
		}

		loggerOut.Print(out)
	case level == LevelInfo && m != LevelError:
		loggerOut.Print(out)
	}
}

// Debug writes a debug message.
func Debug(ctx context.Context, message ...string) {
	writeLog(ctx, LevelDebug, nil, strings.Join(message, ""))
}

// Error writes an error message.
func Error(ctx context.Context, err errs.Err, message ...string) errs.Err {
	writeLog(ctx, LevelError, err, strings.Join(message, ""))

	return err
}

// Info writes an info message.
func Info(ctx context.Context, message ...string) {
	writeLog(ctx, LevelInfo, nil, strings.Join(message, ""))
}

// UseTestLogger sets the logging output to the test logger.
func UseTestLogger(tb testing.TB) {
	tb.Helper()

	t := testLogger{TB: tb}

	noColor = true
	loggerErr = t
	loggerOut = t
}

func getFunc(depth int) (string, int) {
	_, file, line, _ := runtime.Caller(depth)
	n := strings.Split(file, "/")
	f := strings.Join(n[len(n)-4:], "/")

	return f, line
}
