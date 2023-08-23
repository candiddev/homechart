package postgresql

const (
	// LockMigrations is used when performing migrations.
	LockMigrations = 1
	// LockTasks is used when becoming the task runner.
	LockTasks = 2
)
