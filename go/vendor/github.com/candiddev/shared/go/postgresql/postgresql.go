// Package postgresql contains functions for connecting to PostgreSQL.
package postgresql

import (
	"context"
	"database/sql"
	"embed"
	"errors"
	"fmt"
	"net"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
	"time"

	// PostgreSQL driver.
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/metrics"
	"github.com/candiddev/shared/go/types"
	_ "github.com/jackc/pgx/v5/stdlib" // Import PostgreSQL driver
	"github.com/jmoiron/sqlx"
	"github.com/lib/pq"
)

// Config is the config and connection to the PostgreSQL database.
type Config struct {
	Port               int    `json:"port"`
	Database           string `json:"database"`
	Hostname           string `json:"hostname"`
	MaxConnections     int    `json:"maxConnections"`
	MaxIdleConnections int    `json:"maxIdleConnections"`
	MaxLifetimeMinutes int    `json:"maxLifetimeMinutes"`
	Password           string `json:"password"`
	SchemaRole         string `json:"schemaRole,omitempty"`
	SSLMode            string `json:"sslMode"`
	Username           string `json:"username"`
	dsn                string
	db                 *sqlx.DB
}

var ErrPostgreSQLAction = errors.New("error performing PostgreSQL action")

var ErrPostgreSQLConnect = errors.New("error connecting to PostgreSQL")

var ErrPostgreSQLMigrate = errors.New("error migrating database")

// Setup configures a DB pool.
func (c *Config) Setup(ctx context.Context) errs.Err {
	ctx = logger.Trace(ctx)

	var err error

	c.dsn = fmt.Sprintf("postgres://%s:%s@%s/%s?timezone=UTC&sslmode=%s", c.Username, c.Password, net.JoinHostPort(c.Hostname, strconv.Itoa(c.Port)), c.Database, c.SSLMode)

	c.db, err = sqlx.Open("postgres", c.dsn)
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLConnect, err))
	}

	err = c.Health()
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLConnect, err))
	}

	c.db.SetConnMaxLifetime(time.Duration(c.MaxLifetimeMinutes) * time.Minute)
	c.db.SetMaxIdleConns(c.MaxIdleConnections)
	c.db.SetMaxOpenConns(c.MaxConnections)

	return logger.Error(ctx, nil)
}

// BeginTx returns a transaction.
func (c *Config) BeginTx(ctx context.Context) (*sqlx.Tx, errs.Err) {
	ctx = logger.Trace(ctx)

	tx, err := c.db.BeginTxx(ctx, &sql.TxOptions{})
	if err != nil {
		return nil, logger.Error(ctx, decodeErr(ctx, err))
	}

	return tx, logger.Error(ctx, nil)
}

// Exec runs a NamedExec function.  It will return an errs.ErrClientNoContent if no rows were returned.
func (c *Config) Exec(ctx context.Context, query string, argument any) errs.Err {
	ctx = logger.Trace(ctx)

	verb := getVerb(query)
	ctx = logger.SetAttribute(ctx, "verb", verb)

	table := getTable(query)
	ctx = logger.SetAttribute(ctx, "table", table)

	var err error

	var r sql.Result

	t := time.Now()

	if argument != nil {
		r, err = c.db.NamedExec(query, argument)
	} else {
		r, err = c.db.Exec(query)
	}

	if err != nil {
		pErr := decodeErr(ctx, err)

		return logger.Error(ctx, pErr, err.Error())
	}

	a, err := r.RowsAffected()
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err))
	}

	metrics.PostgreSQLQueryDuration.WithLabelValues(table, verb).Observe(time.Since(t).Seconds())

	if a == 0 {
		return logger.Error(ctx, errs.ErrSenderNoContent)
	}

	return logger.Error(ctx, nil)
}

// Conn returns a static connection to Postgres.
func (c *Config) Conn(ctx context.Context) (*sql.Conn, error) {
	return c.db.Conn(ctx)
}

// Health checks the health of Postgres and returns an error.
func (c *Config) Health() error {
	err := c.db.Ping()

	return err
}

// Listen aggregates receivers and notifies them for table changes.
func (c *Config) Listen(ctx context.Context, f func(context.Context, *types.TableNotify)) {
	listener := pq.NewListener(c.dsn, 10*time.Second, time.Minute, func(ev pq.ListenerEventType, err error) {
		if err != nil {
			logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)) //nolint:errcheck
		}
	})

	err := listener.Listen("changes")
	if err != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)) //nolint:errcheck

		return
	}

	logger.Debug(ctx, "Database listener started")

	for {
		select {
		case <-ctx.Done():
			err := listener.Close()
			if err != nil {
				logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)) //nolint:errcheck
			}

			logger.Debug(ctx, "Database listener stopped")

			return
		case notification := <-listener.Notify:
			if notification != nil {
				n, err := types.TableNotifyFromString(notification.Extra)
				if err != nil {
					logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)) //nolint:errcheck

					continue
				}

				go f(ctx, n)
			}
		}
	}
}

// LockAcquire gets a database lock.
func (*Config) LockAcquire(ctx context.Context, lockID int, conn *sql.Conn) bool {
	stmt := fmt.Sprintf("SELECT pg_try_advisory_lock(%d)", lockID)

	var l bool

	rows, err := conn.QueryContext(ctx, stmt)
	if err != nil || rows.Err() != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)) //nolint:errcheck

		return false
	}
	defer rows.Close()

	rows.Next()

	err = rows.Scan(&l)
	if err != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)) //nolint:errcheck

		return false
	}

	return l
}

// LockExists checks if a database lock exists.
func (*Config) LockExists(ctx context.Context, lockID int, conn *sql.Conn) bool {
	stmt := fmt.Sprintf("SELECT EXISTS(SELECT * FROM pg_locks WHERE pid=pg_backend_pid() AND objid=%d)", lockID)

	var l bool

	rows, err := conn.QueryContext(ctx, stmt)
	if err != nil || rows.Err() != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)) //nolint:errcheck

		return false
	}
	defer rows.Close()

	rows.Next()

	err = rows.Scan(&l)
	if err != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)) //nolint:errcheck

		return false
	}

	return l
}

// LockRelease releases a database lock.
func (*Config) LockRelease(ctx context.Context, lockID int, conn *sql.Conn) bool {
	stmt := fmt.Sprintf("SELECT pg_advisory_unlock(%d)", lockID)

	var l bool

	rows, err := conn.QueryContext(ctx, stmt)
	if err != nil || rows.Err() != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)) //nolint:errcheck

		return false
	}
	defer rows.Close()

	rows.Next()

	err = rows.Scan(&l)
	if err != nil {
		logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)) //nolint:errcheck

		return false
	}

	return l
}

func readAndExec(fs embed.FS, exec func(filename, contents string) error) error {
	path := "."

	files, err := fs.ReadDir(path)
	if err != nil {
		return err
	}

	if len(files) == 1 && files[0].IsDir() {
		path = files[0].Name()

		files, err = fs.ReadDir(path)
		if err != nil {
			return err
		}
	}

	for i := range files {
		if files[i].IsDir() {
			continue
		}

		contents, err := fs.ReadFile(filepath.Join(path, files[i].Name()))
		if err != nil {
			return err
		}

		if err := exec(files[i].Name(), string(contents)); err != nil {
			return err
		}
	}

	return nil
}

// Migrate runs database migrations and returns an error.
// Triggers should be a go:embed of a directory named triggers, i.e. triggers/*.sql
// Migrations should be a go:embed of a directory named migrations, i.e. migrations/*.sql.
func (c *Config) Migrate(ctx context.Context, app string, triggers, migrations embed.FS) errs.Err { //nolint:gocognit
	ctx = logger.Trace(ctx)

	var migrationCount int

	// Attempt to get a lock
	conn, err := c.db.Conn(ctx)
	if err != nil {
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLMigrate, err))
	}
	defer conn.Close()

	if c.LockAcquire(ctx, LockMigrations, conn) {
		logger.Debug(ctx, "Acquired migration lock")

		tx := c.db.MustBegin()
		defer tx.Rollback() //nolint: errcheck

		if c.SchemaRole != "" {
			tx.MustExecContext(ctx, fmt.Sprintf(`SET SESSION ROLE "%s"`, c.SchemaRole))
		}

		query := `
CREATE TABLE IF NOT EXISTS migration (
	  app text primary key
	, version int
)
`
		if _, err := tx.ExecContext(ctx, query); err != nil {
			return logger.Error(ctx, decodeErr(ctx, err))
		}

		var version int

		rows, err := tx.QueryContext(ctx, `
SELECT
	version
FROM migration
WHERE app = $1`, app)
		if err != nil && !decodeErr(ctx, err).Like(errs.ErrSenderNotFound) {
			return logger.Error(ctx, decodeErr(ctx, err))
		}

		if rows.Err() != nil {
			return logger.Error(ctx, decodeErr(ctx, rows.Err()))
		}

		if rows.Next() {
			if err := rows.Scan(&version); err != nil {
				return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLMigrate, err))
			}
		}

		if err := rows.Close(); err != nil {
			return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLMigrate, err))
		}

		var lastMigration int

		if err := readAndExec(migrations, func(filename, contents string) error {
			v, err := strconv.Atoi(strings.Split(filename, ".")[0])
			if err != nil {
				return err
			}

			if v > version {
				if _, err := tx.ExecContext(ctx, fmt.Sprintf(`--%d
%s`, v, contents)); err != nil {
					err := decodeErr(ctx, err)

					return logger.Error(ctx, err)
				}

				migrationCount++
			}

			lastMigration = v

			return nil
		}); err != nil {
			return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLMigrate, err))
		}

		if _, err := tx.ExecContext(ctx, `
INSERT INTO migration (
	  app
	, version
)
VALUES (
	  $1
	, $2
)
ON CONFLICT (
	app
) DO UPDATE SET version = $2
`, app, lastMigration); err != nil {
			return logger.Error(ctx, decodeErr(ctx, err))
		}

		if err := readAndExec(triggers, func(filename, contents string) error {
			if _, err := tx.ExecContext(ctx, fmt.Sprintf(`--%s
%s`, filename, contents)); err != nil {
				return logger.Error(ctx, decodeErr(ctx, err))
			}

			return nil
		}); err != nil {
			return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLMigrate, err))
		}

		if err := tx.Commit(); err != nil {
			return logger.Error(ctx, decodeErr(ctx, err))
		}

		if !c.LockRelease(ctx, LockMigrations, conn) {
			return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLMigrate, err))
		}

		logger.Debug(ctx, "Released migration lock")
	}

	return logger.Error(ctx, nil, fmt.Sprintf("%d migrations", migrationCount))
}

// Query runs a Get or Select function.  This will throw an errs.ErrClientNoContent if the query includes update values and returns no rows.
func (c *Config) Query(ctx context.Context, multi bool, destination any, query string, argument any, args ...any) errs.Err { //nolint:revive
	var err error

	t := time.Now()

	ctx = logger.Trace(ctx)

	verb := getVerb(query)
	ctx = logger.SetAttribute(ctx, "verb", verb)

	table := getTable(query)
	ctx = logger.SetAttribute(ctx, "table", table)

	if argument != nil {
		var stmt *sqlx.NamedStmt

		stmt, err = c.db.PrepareNamed(query)
		if err != nil {
			return logger.Error(ctx, decodeErr(ctx, err))
		}

		if multi {
			err = stmt.Select(destination, argument)
		} else {
			err = stmt.Get(destination, argument)
		}
	} else {
		if multi {
			err = c.db.Select(destination, query, args...)
		} else {
			err = c.db.Get(destination, query, args...)
		}
	}

	metrics.PostgreSQLQueryDuration.WithLabelValues(table, verb).Observe(time.Since(t).Seconds())

	if err != nil {
		pErr := decodeErr(ctx, err)
		if pErr.Like(errs.ErrSenderNotFound) && (strings.Contains(query, "updated >") || verb == "UPDATE") {
			pErr = errs.ErrSenderNoContent
		}

		return logger.Error(ctx, pErr)
	}

	return logger.Error(ctx, nil)
}

func decodeErr(ctx context.Context, err error) errs.Err {
	var e errs.Err

	var pgerr *pq.Error

	if errors.As(err, &pgerr) {
		switch pgerr.Code {
		case "23514": // Check/constraint violation
			fallthrough
		case "23502": // Null constraint
			fallthrough
		case "23503": // Foreign key doesn't exist
			e = errs.ErrSenderBadRequest.Wrap(err)
		case "23505": // Duplicate key
			e = errs.ErrSenderConflict.Wrap(err)
		default:
			e = errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err)
		}

		return logger.Error(ctx, e)
	}

	switch err.Error() {
	case "sql: no rows in result set":
		return errs.ErrSenderNotFound.Wrap(err)
	default:
		return logger.Error(ctx, errs.ErrReceiver.Wrap(ErrPostgreSQLAction, err))
	}
}

func getVerb(query string) string {
	verbs := regexp.MustCompile(`^\n?(\w+)`).FindStringSubmatch(query)
	if len(verbs) == 2 {
		if verbs[1] == "WITH" {
			return "SELECT"
		}

		return verbs[1]
	}

	return ""
}

func getTable(query string) string {
	tables := regexp.MustCompile(`(?P<Action>FROM|INTO|UPDATE)\ (?P<Table>\w+)`).FindStringSubmatch(query)
	if len(tables) == 3 {
		return tables[2]
	}

	return ""
}
