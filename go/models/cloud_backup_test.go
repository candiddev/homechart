package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
)

func TestCloudBackups(t *testing.T) {
	logger.UseTestLogger(t)

	backups := CloudBackups{
		{
			Data: []byte("a"),
		},
		{
			Data: []byte("b"),
		},
		{
			Data: []byte("c"),
		},
		{
			Data: []byte("d"),
		},
		{
			Data: []byte("e"),
		},
		{
			Data: []byte("f"),
		},
	}

	// Test Create
	for i := range backups {
		backups[i].AuthHouseholdID = seed.AuthHouseholds[0].ID
		assert.Equal(t, backups[i].Create(ctx), nil)
	}

	// Test ReadAll
	b, err := CloudBackupsRead(ctx, backups[0].AuthHouseholdID)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(b), 5)

	// Test Read
	assert.Equal(t, CloudBackupRead(ctx, seed.AuthHouseholds[0].ID, b[0].ID), backups[1].Data)
}
