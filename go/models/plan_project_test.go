package models

import (
	"testing"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestPlanProjectCreate(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.Read(ctx)

	ah := seed.AuthHouseholds[0]
	ah.Read(ctx)

	p := seed.PlanProjects[5]
	p.AuthAccountID = &seed.AuthAccounts[0].ID
	p.AuthHouseholdID = nil
	p.BudgetCategoryID = &seed.BudgetCategories[0].ID
	p.ID = uuid.Nil
	p.Icon = "icon"
	p.Name = "create"
	p.ParentID = &seed.PlanProjects[5].ID
	p.Tags = types.Tags{
		"test",
		"test1",
	}

	assert.Equal(t, p.create(ctx, CreateOpts{}), nil)
	assert.Equal(t, p.AuthHouseholdID, &seed.AuthHouseholds[0].ID)
	assert.Equal(t, p.AuthAccountID, nil)

	Delete(ctx, &p, DeleteOpts{})

	// Existing ShortID
	pn := p

	assert.Equal(t, pn.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, pn.ShortID, p.ShortID)

	Delete(ctx, &pn, DeleteOpts{})
}

func TestPlanProjectDelete(t *testing.T) {
	// Test trigger to AuthAccount.PlanProjectsCollapsed
	logger.UseTestLogger((t))

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testplantaskdelete@example.com"
	aa.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	aaah.create(ctx, CreateOpts{})

	p1 := PlanProject{
		AuthAccountID: &aa.ID,
		Name:          "collapsed1",
	}
	p1.create(ctx, CreateOpts{})

	p2 := PlanProject{
		AuthHouseholdID: &aaah.AuthHouseholdID,
		Name:            "collapsed2",
	}
	p2.create(ctx, CreateOpts{})

	p3 := PlanProject{
		AuthHouseholdID: &aaah.AuthHouseholdID,
		Name:            "collapsed3",
	}
	p3.create(ctx, CreateOpts{})

	aa.CollapsedPlanTasks = types.SliceString{
		p1.ID.String(),
		p2.ID.String(),
	}

	aa.Update(ctx)

	Delete(ctx, &p1, DeleteOpts{})
	Delete(ctx, &p2, DeleteOpts{})

	assert.Equal(t, Delete(ctx, &p3, DeleteOpts{}), nil)
	aa.Read(ctx)

	assert.Equal(t, len(aa.CollapsedPlanProjects), 0)

	aa.Delete(ctx)
}

func TestPlanProjectUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	p := seed.PlanProjects[0]
	p.ID = uuid.Nil
	p.Icon = "icon"
	p.Name = "update"
	p.create(ctx, CreateOpts{})

	aa := seed.AuthAccounts[0]
	aa.Read(ctx)

	ah := seed.AuthHouseholds[0]
	ah.Read(ctx)

	p.BudgetCategoryID = &seed.BudgetCategories[0].ID
	p.Color = types.ColorRed
	p.Name = "update1"
	p.ParentID = &seed.PlanProjects[5].ID
	p.Position = "0:aaaaaa"
	p.Tags = types.Tags{
		"test",
		"test1",
	}

	assert.Equal(t, p.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}), nil)

	project := PlanProject{
		AuthAccountID:   p.AuthAccountID,
		AuthHouseholdID: p.AuthHouseholdID,
		ID:              p.ID,
	}

	Read(ctx, &project, ReadOpts{})

	p.AuthHouseholdID = &seed.AuthHouseholds[0].ID

	assert.Equal(t, project, p)

	Delete(ctx, &p, DeleteOpts{})

	p1 := PlanProject{
		AuthHouseholdID: &seed.AuthHouseholds[0].ID,
		Name:            "a",
	}
	p1.create(ctx, CreateOpts{})

	p2 := PlanProject{
		Name:     "b",
		ParentID: &p1.ID,
	}
	p2.create(ctx, CreateOpts{})

	p3 := PlanProject{
		Name:     "c",
		ParentID: &p2.ID,
	}
	p3.create(ctx, CreateOpts{})

	t1 := PlanTask{
		AuthAccountID:   p3.AuthAccountID,
		AuthHouseholdID: p3.AuthHouseholdID,
		Name:            "d",
		PlanProjectID:   &p3.ID,
	}
	t1.create(ctx, CreateOpts{})

	s1 := ShopItem{
		AuthHouseholdID: p3.AuthHouseholdID,
		Name:            "s",
		PlanProjectID:   &p3.ID,
	}
	s1.create(ctx, CreateOpts{})

	p1.AuthAccountID = &seed.AuthAccounts[0].ID
	p1.AuthHouseholdID = nil
	p1.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	})

	p3.AuthAccountID = p1.AuthAccountID
	p3.AuthHouseholdID = nil

	assert.Equal(t, Read(ctx, &p3, ReadOpts{}), nil)
	assert.Equal(t, p3.AuthAccountID, &seed.AuthAccounts[0].ID)
	assert.Equal(t, p3.AuthHouseholdID, nil)

	s1.AuthAccountID = p1.AuthAccountID

	assert.Equal(t, Read(ctx, &s1, ReadOpts{}), nil)
	assert.Equal(t, s1.AuthAccountID, &seed.AuthAccounts[0].ID)
	assert.Equal(t, s1.AuthHouseholdID, nil)

	t1.AuthAccountID = p1.AuthAccountID
	t1.AuthHouseholdID = nil

	assert.Equal(t, Read(ctx, &t1, ReadOpts{}), nil)
	assert.Equal(t, t1.AuthAccountID, &seed.AuthAccounts[0].ID)
	assert.Equal(t, t1.AuthHouseholdID, nil)

	p1.AuthAccountID = nil
	p1.AuthHouseholdID = &seed.AuthHouseholds[0].ID
	p1.ParentID = nil
	p1.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	})

	p3.AuthAccountID = p1.AuthAccountID
	p3.AuthHouseholdID = p1.AuthHouseholdID

	assert.Equal(t, Read(ctx, &p3, ReadOpts{}), nil)
	assert.Equal(t, p3.AuthAccountID, nil)
	assert.Equal(t, p3.AuthHouseholdID, &seed.AuthHouseholds[0].ID)

	t1.AuthAccountID = nil
	t1.AuthHouseholdID = p1.AuthHouseholdID

	assert.Equal(t, Read(ctx, &t1, ReadOpts{}), nil)
	assert.Equal(t, t1.AuthAccountID, nil)
	assert.Equal(t, t1.AuthHouseholdID, &seed.AuthHouseholds[0].ID)

	Delete(ctx, &p1, DeleteOpts{})
	Delete(ctx, &s1, DeleteOpts{})
}
