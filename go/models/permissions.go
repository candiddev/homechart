package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
)

// Permission is the level of access for a module.
type Permission int

// Permission is the level of access for a module.
const (
	PermissionEdit Permission = iota
	PermissionView
	PermissionNone
)

// PermissionComponent is a component that has permissions.
type PermissionComponent int

// PermissionComponent is a component that has permissions.
const (
	PermissionComponentAuth PermissionComponent = iota
	PermissionComponentBudget
	PermissionComponentCalendar
	PermissionComponentCook
	PermissionComponentHealth
	PermissionComponentInventory
	PermissionComponentNotes
	PermissionComponentPlan
	PermissionComponentReward
	PermissionComponentSecrets
	PermissionComponentShop
)

// Permissions is the level of access for an account to modules.
type Permissions struct {
	Auth      Permission `json:"auth"`
	Budget    Permission `json:"budget"`
	Calendar  Permission `json:"calendar"`
	Cook      Permission `json:"cook"`
	Health    Permission `json:"health"`
	Inventory Permission `json:"inventory"`
	Notes     Permission `json:"notes"`
	Plan      Permission `json:"plan"`
	Reward    Permission `json:"reward"`
	Secrets   Permission `json:"secrets"`
	Shop      Permission `json:"shop"`
} // @Name Permissions

// Value returns a JSON marshal of permissions.
func (p Permissions) Value() (driver.Value, error) {
	if p.Auth > 1 {
		p.Auth = 1 //nolint:revive
	}

	j, err := json.Marshal(p)

	return j, err
}

// IsEscalated compares old and new permissions to see if they are trying to exceed the current ones.
func (p *Permissions) IsEscalated(newPermissions Permissions) bool {
	return p.Auth > newPermissions.Auth ||
		p.Budget > newPermissions.Budget ||
		p.Calendar > newPermissions.Calendar ||
		p.Cook > newPermissions.Cook ||
		p.Health > newPermissions.Health ||
		p.Notes > newPermissions.Notes ||
		p.Plan > newPermissions.Plan ||
		p.Secrets > newPermissions.Secrets ||
		p.Shop > newPermissions.Shop
}

// IsPermitted looks up a permission component and checks a permission.
func (p *Permissions) IsPermitted(cmp PermissionComponent, n Permission, personal bool) bool {
	switch cmp {
	case PermissionComponentAuth:
		return p.Auth <= n
	case PermissionComponentBudget:
		return p.Budget <= n
	case PermissionComponentCalendar:
		return p.Calendar <= n
	case PermissionComponentCook:
		return p.Cook <= n
	case PermissionComponentHealth:
		if personal {
			return p.Health <= n
		}

		return p.Auth == PermissionEdit
	case PermissionComponentInventory:
		return p.Inventory <= n
	case PermissionComponentNotes:
		return p.Notes <= n
	case PermissionComponentPlan:
		return p.Plan <= n
	case PermissionComponentReward:
		return p.Reward <= n || p.Auth == PermissionEdit
	case PermissionComponentSecrets:
		return p.Secrets <= n
	case PermissionComponentShop:
		return p.Shop <= n
	}

	return false
}

// Scan reads in a byte slice and unmarshals into permissions.
func (p *Permissions) Scan(src any) error {
	source, ok := src.([]byte)
	if !ok {
		return errors.New("type assertion .([]byte) failed")
	}

	err := json.Unmarshal(source, &p)
	if err != nil {
		return err
	}

	return nil
}
