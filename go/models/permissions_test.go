package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
)

func TestPermissionsIsPermitted(t *testing.T) {
	p := Permissions{
		Auth:      1,
		Budget:    1,
		Calendar:  1,
		Cook:      1,
		Health:    1,
		Inventory: 1,
		Notes:     1,
		Plan:      1,
		Reward:    1,
		Shop:      1,
	}

	for _, c := range []PermissionComponent{
		PermissionComponentAuth,
		PermissionComponentBudget,
		PermissionComponentCalendar,
		PermissionComponentCook,
		PermissionComponentHealth,
		PermissionComponentInventory,
		PermissionComponentNotes,
		PermissionComponentPlan,
		PermissionComponentReward,
		PermissionComponentShop,
	} {
		assert.Equal(t, p.IsPermitted(c, PermissionEdit, false), false)
	}

	p.Health = 0

	assert.Equal(t, p.IsPermitted(PermissionComponentHealth, PermissionEdit, true), true)

	p.Auth = 0

	assert.Equal(t, p.IsPermitted(PermissionComponentHealth, PermissionEdit, false), true)
	assert.Equal(t, p.IsPermitted(PermissionComponentReward, PermissionEdit, false), true)
}

func TestPermissionsScan(t *testing.T) {
	var p Permissions

	assert.Equal(t, p.Scan([]byte(`
{
	"auth": null,
	"health": 1
}
`)), nil)
	assert.Equal(t, p, Permissions{
		Health: 1,
	})
}

func TestPermissionsValue(t *testing.T) {
	permissions := Permissions{
		Auth: 2,
	}

	got, err := permissions.Value()

	assert.Equal(t, err, nil)
	assert.Equal(t, string(got.([]byte)), `{"auth":1,"budget":0,"calendar":0,"cook":0,"health":0,"inventory":0,"notes":0,"plan":0,"reward":0,"secrets":0,"shop":0}`)
}
