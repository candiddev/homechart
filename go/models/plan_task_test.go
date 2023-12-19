package models

import (
	"fmt"
	"strings"
	"testing"
	"time"

	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

func TestPlanTaskCreate(t *testing.T) {
	logger.UseTestLogger(t)

	today := types.CivilDateToday()

	p := seed.PlanTasks[0]
	p.Assignees = types.SliceString{
		"test",
	}
	p.DateEnd = &today
	p.Details = "Details!"
	p.Duration = 300
	p.ID = uuid.Nil
	p.InventoryItemID = &seed.InventoryItems[0].ID
	p.Name = "create"
	p.ParentID = &seed.PlanTasks[0].ID
	p.PlanProjectID = &seed.PlanProjects[0].ID

	pp := PlanProject{
		AuthAccountID:   p.AuthAccountID,
		AuthHouseholdID: p.AuthHouseholdID,
		ID:              seed.PlanProjects[2].ID,
	}

	Read(ctx, &pp, ReadOpts{})

	p.AuthAccountID = nil

	assert.Equal[error](t, p.create(ctx, CreateOpts{}), errs.ErrSenderBadRequest)
	assert.Equal(t, p.Assignees, nil)

	p.AuthAccountID = &seed.AuthAccounts[0].ID

	assert.Equal(t, p.create(ctx, CreateOpts{}), nil)

	pt := PlanTask{
		AuthAccountID:   p.AuthAccountID,
		AuthHouseholdID: p.AuthHouseholdID,
		ID:              p.ID,
	}

	Read(ctx, &pt, ReadOpts{})

	assert.Equal(t, pt, p)

	want := pp.PlanTaskCount + 1
	Read(ctx, &pp, ReadOpts{})

	assert.Equal(t, pp.PlanTaskCount, want)

	Delete(ctx, &p, DeleteOpts{})

	want = pp.PlanTaskCount - 1
	Read(ctx, &pp, ReadOpts{})

	assert.Equal(t, pp.PlanTaskCount, want)

	p.Assignees = types.SliceString{
		seed.AuthAccounts[0].ID.String(),
		seed.AuthAccounts[1].ID.String(),
	}
	p.AuthAccountID = &seed.AuthAccounts[0].ID
	p.AuthHouseholdID = &seed.AuthHouseholds[0].ID
	p.ParentID = nil
	p.Template = true
	p.create(ctx, CreateOpts{})

	assert.Equal(t, p.PlanProjectID, nil)
	assert.Equal(t, len(p.Assignees), 2)

	Delete(ctx, &p, DeleteOpts{})

	// Existing short ID
	id := types.NewNanoid()
	p = seed.PlanTasks[0]
	p.ID = uuid.Nil
	p.Name = "create"
	p.ShortID = id

	assert.Equal(t, p.create(ctx, CreateOpts{
		Restore: true,
	}), nil)
	assert.Equal(t, p.ShortID, id)

	Delete(ctx, &p, DeleteOpts{})
}

func TestPlanTaskDelete(t *testing.T) {
	// Test trigger to AuthAccount.PlanTasksCollapsed
	logger.UseTestLogger((t))

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testplantaskdelete@example.com"
	aa.Create(ctx, false)

	aaah := AuthAccountAuthHousehold{
		AuthAccountID:   &aa.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	aaah.create(ctx, CreateOpts{})

	p1 := PlanTask{
		AuthAccountID: &aa.ID,
		Name:          "collapsed1",
	}
	p1.create(ctx, CreateOpts{})

	p2 := PlanTask{
		AuthHouseholdID: &aaah.AuthHouseholdID,
		Name:            "collapsed2",
	}
	p2.create(ctx, CreateOpts{})

	p3 := PlanTask{
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

	assert.Equal(t, len(aa.CollapsedPlanTasks), 0)

	aa.Delete(ctx)
}

func TestPlanTaskUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	p := seed.PlanTasks[0]
	p.ID = uuid.Nil
	p.Name = "update"
	p.create(ctx, CreateOpts{})

	pp1 := PlanProject{
		AuthAccountID: p.AuthAccountID,
		ID:            *p.PlanProjectID,
	}

	Read(ctx, &pp1, ReadOpts{})

	now := time.Now().Add(10000 * time.Minute)
	today := types.CivilDateToday()
	p.Assignees = types.SliceString{
		seed.AuthAccounts[0].ID.String(),
		seed.AuthAccounts[1].ID.String(),
	}
	p.AuthAccountID = nil
	p.AuthHouseholdID = &seed.AuthHouseholds[0].ID
	p.DateEnd = &today
	p.Details = "New details!"
	p.Done = true
	p.DueDate = &now
	p.Duration = 300
	p.InventoryItemID = &seed.InventoryItems[0].ID
	p.LastDoneBy = &seed.AuthAccounts[0].ID
	p.LastDoneDate = types.CivilDateToday()
	p.Name = "update1"
	p.Notify = true
	p.ParentID = &seed.PlanTasks[4].ID
	p.Position = "10:a"
	p.Color = types.ColorBrown
	p.PlanProjectID = &seed.PlanProjects[7].ID
	p.RecurOnDone = true
	p.Recurrence = &types.Recurrence{
		Month: time.February,
	}
	p.Tags = types.Tags{"tags"}

	pp2 := PlanProject{
		AuthHouseholdID: p.AuthHouseholdID,
		ID:              seed.PlanProjects[7].ID,
	}

	Read(ctx, &pp2, ReadOpts{})

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

	task := PlanTask{
		AuthAccountID:   p.AuthAccountID,
		AuthHouseholdID: p.AuthHouseholdID,
		ID:              p.ID,
	}

	Read(ctx, &task, ReadOpts{})

	task.NotifyComplete = true

	assert.Equal(t, task, p)

	want := pp1.PlanTaskCount - 1
	Read(ctx, &pp1, ReadOpts{})

	assert.Equal(t, pp1.PlanTaskCount, want)

	want = pp2.PlanTaskCount
	Read(ctx, &pp2, ReadOpts{})

	assert.Equal(t, pp2.PlanTaskCount, want)

	p.Done = false
	p.ParentID = nil
	p.PlanProjectID = &pp1.ID

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

	want = pp2.PlanTaskCount
	Read(ctx, &pp2, ReadOpts{})

	assert.Equal(t, pp2.PlanTaskCount, want)

	want = pp1.PlanTaskCount + 1
	Read(ctx, &pp1, ReadOpts{})

	assert.Equal(t, pp1.PlanTaskCount, want)

	p.Done = true

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

	want = pp1.PlanTaskCount - 1
	Read(ctx, &pp1, ReadOpts{})

	assert.Equal(t, pp1.PlanTaskCount, want)

	// Test going from parentID and project ID to nothing
	p.ParentID = &seed.PlanTasks[1].ID

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

	p2 := p
	p2.ID = uuid.Nil
	p2.ParentID = &p.ID
	p2.create(ctx, CreateOpts{})

	p.AuthHouseholdID = nil
	p.ParentID = nil
	p.Template = false

	assert.Equal(t, p.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			Admin:         true,
			AuthAccountID: &seed.AuthAccounts[0].ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
				},
			},
		},
	}), nil)

	Read(ctx, &p2, ReadOpts{})

	assert.Equal(t, len(p.Assignees), 0)
	assert.Equal(t, p2.PlanProjectID, p.PlanProjectID)

	Delete(ctx, &p, DeleteOpts{})

	t1 := PlanTask{
		AuthAccountID: &seed.AuthAccounts[0].ID,
		Name:          "a",
	}
	t1.create(ctx, CreateOpts{})

	t2 := PlanTask{
		AuthAccountID: t1.AuthAccountID,
		Name:          "b",
		ParentID:      &t1.ID,
	}
	t2.create(ctx, CreateOpts{})

	t3 := PlanTask{
		AuthAccountID: t2.AuthAccountID,
		Name:          "c",
		ParentID:      &t2.ID,
	}
	t3.create(ctx, CreateOpts{})

	tests := []string{
		"household",
		"account",
		"template",
	}

	for _, name := range tests {
		t.Run(name, func(t *testing.T) {
			switch name {
			case "household":
				t1.AuthAccountID = nil
				t1.AuthHouseholdID = &seed.AuthHouseholds[0].ID
			case "account":
				t1.AuthAccountID = &seed.AuthAccounts[0].ID
				t1.AuthHouseholdID = nil
			case "template":
				t1.AuthAccountID = nil
				t1.AuthHouseholdID = nil
				t1.Template = true
			}

			assert.Equal(t, t1.update(ctx, UpdateOpts{
				PermissionsOpts: PermissionsOpts{
					Admin:         true,
					AuthAccountID: &seed.AuthAccounts[0].ID,
					AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
						{
							AuthHouseholdID: seed.AuthHouseholds[0].ID,
						},
					},
				},
			}), nil)

			t3.AuthAccountID = t1.AuthAccountID
			t3.AuthHouseholdID = t1.AuthHouseholdID

			assert.Equal(t, Read(ctx, &t3, ReadOpts{
				PermissionsOpts: PermissionsOpts{
					AuthAccountID:          &seed.AuthAccounts[0].ID,
					AuthAccountPermissions: &Permissions{},
					AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
						{
							AuthHouseholdID: seed.AuthHouseholds[0].ID,
						},
					},
				},
			}), nil)

			assert.Equal(t, t3.AuthAccountID, t1.AuthAccountID)
			assert.Equal(t, t3.AuthHouseholdID, t1.AuthHouseholdID)
			assert.Equal(t, t3.Template, t1.Template)
		})
	}

	t1.AuthAccountID = &seed.AuthAccounts[0].ID
	t1.update(ctx, UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			Admin: true,
		},
	})

	Delete(ctx, &t1, DeleteOpts{})
}

func TestPlanTasksDelete(t *testing.T) {
	logger.UseTestLogger(t)

	date := GenerateTimestamp().Add(time.Duration(-24) * time.Hour * time.Duration(c.App.KeepPlanTaskDays+1))

	for i := 1; i <= 10; i++ {
		pt := seed.PlanTasks[0]
		pt.Done = true
		pt.DueDate = &date
		pt.ID = uuid.Nil
		pt.Name = types.StringLimit(fmt.Sprintf("%s-%d", pt.Name, i))
		pt.create(ctx, CreateOpts{})
	}

	var tasks PlanTasks

	ReadAll(ctx, &tasks, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
		},
	})

	want := len(tasks) - 10

	PlanTasksDelete(ctx)

	tasks = PlanTasks{}

	ReadAll(ctx, &tasks, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &seed.AuthAccounts[0].ID,
		},
	})

	assert.Equal(t, len(tasks), want)
}

func TestPlanTasksInit(t *testing.T) {
	logger.UseTestLogger(t)

	aa := AuthAccount{
		EmailAddress: "plantasksinit@example.com",
		Name:         "plantasksinit",
		Password:     "a",
	}
	aa.Create(ctx, false)

	assert.Equal(t, PlanTasksInit(ctx, aa.ID), nil)

	var projects PlanProjects

	ReadAll(ctx, &projects, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &aa.ID,
		},
	})

	assert.Equal(t, len(projects), 1)

	var tasks PlanTasks

	ReadAll(ctx, &tasks, ReadAllOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &aa.ID,
		},
	})

	assert.Equal(t, len(tasks), 20)

	aa.Delete(ctx)
}

func TestPlanTasksReadAssistant(t *testing.T) {
	logger.UseTestLogger(t)

	got, _, list := PlanTasksReadAssistant(ctx, PermissionsOpts{
		AuthAccountID:          &seed.AuthAccounts[0].ID,
		AuthAccountPermissions: &Permissions{},
		AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
			},
		},
	}, types.CivilDateToday(), "today", "America/Chicago", false)

	assert.Contains(t, got, "I found 5 tasks due today: Setup Budgeting, Setup Cooking, Setup Inventory, Setup Notes, and Setup Shopping.")
	assert.Equal(t, len(list), 5)
}

func TestPlanTasksReadICal(t *testing.T) {
	logger.UseTestLogger(t)

	aa1 := seed.AuthAccounts[0]
	aa1.EmailAddress = "plantasksical1@example.com"
	aa1.Create(ctx, false)
	aa1.UpdateICalendarID(ctx, false)

	got, err := PlanTasksReadICalendar(ctx, aa1.ICalendarID)
	assert.Equal(t, err, nil)
	assert.Equal(t, got, types.ICalendarEvents{})

	// Test valid
	aa2 := seed.AuthAccounts[0]
	aa2.EmailAddress = "plantasksical2@example.com"
	aa2.Create(ctx, false)
	aa2.UpdateICalendarID(ctx, false)

	aaah1 := AuthAccountAuthHousehold{
		AuthAccountID:   &aa2.ID,
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
	}
	aaah1.create(ctx, CreateOpts{})

	aaah2 := AuthAccountAuthHousehold{
		AuthAccountID:   &aa2.ID,
		AuthHouseholdID: seed.AuthHouseholds[1].ID,
		Permissions: Permissions{
			Plan: PermissionNone,
		},
	}
	aaah2.create(ctx, CreateOpts{})

	got, err = PlanTasksReadICalendar(ctx, aa2.ICalendarID)
	assert.Equal(t, err, nil)
	assert.Equal(t, got, types.ICalendarEvents{
		{
			Created:        &seed.PlanTasks[4].Created,
			Details:        seed.PlanTasks[4].Details,
			Duration:       seed.PlanTasks[4].Duration,
			ID:             types.StringLimit(seed.PlanTasks[4].ID.String()),
			Name:           types.StringLimit("Task: " + string(seed.PlanTasks[4].Name)),
			Recurrence:     seed.PlanTasks[4].Recurrence,
			TimestampStart: seed.PlanTasks[4].DueDate,
			Updated:        &seed.PlanTasks[4].Updated,
		},
		{
			Created:        &seed.PlanTasks[5].Created,
			Duration:       seed.PlanTasks[5].Duration,
			ID:             types.StringLimit(seed.PlanTasks[5].ID.String()),
			Name:           types.StringLimit("Task: " + string(seed.PlanTasks[5].Name)),
			TimestampStart: seed.PlanTasks[5].DueDate,
			Updated:        &seed.PlanTasks[5].Updated,
		},
		{
			Created:        &seed.PlanTasks[7].Created,
			Duration:       seed.PlanTasks[7].Duration,
			ID:             types.StringLimit(seed.PlanTasks[7].ID.String()),
			Name:           types.StringLimit("Task: " + string(seed.PlanTasks[7].Name)),
			TimestampStart: seed.PlanTasks[7].DueDate,
			Updated:        &seed.PlanTasks[7].Updated,
		},
		{
			Created:        &seed.PlanTasks[8].Created,
			Duration:       seed.PlanTasks[8].Duration,
			ID:             types.StringLimit(seed.PlanTasks[8].ID.String()),
			Name:           types.StringLimit("Task: " + string(seed.PlanTasks[8].Name)),
			TimestampStart: seed.PlanTasks[8].DueDate,
			Updated:        &seed.PlanTasks[8].Updated,
		},
	})

	aa1.Delete(ctx)
	aa2.Delete(ctx)
}

func TestPlanTasksReadNotifications(t *testing.T) {
	logger.UseTestLogger(t)

	ah := seed.AuthHouseholds[0]
	ah.Create(ctx, false)

	aa1 := seed.AuthAccounts[0]
	aa1.EmailAddress = "testplantasksreadnotifications1@example.com"
	aa1.Create(ctx, false)
	aa1.Preferences.IgnoreEmailPlanTask = false
	aa1.Preferences.NotificationsHouseholds = []AuthAccountPreferencesNotificationsHousehold{
		{
			AuthHouseholdID:     ah.ID,
			IgnoreEmailPlanTask: true,
		},
	}
	aa1.Update(ctx)

	aaah1 := AuthAccountAuthHousehold{
		AuthAccountID:   &aa1.ID,
		AuthHouseholdID: ah.ID,
	}
	aaah1.create(ctx, CreateOpts{})

	aa2 := seed.AuthAccounts[0]
	aa2.EmailAddress = "testplantasksreadnotifications2@example.com"
	aa2.Create(ctx, false)
	aa2.Update(ctx)

	aaah2 := AuthAccountAuthHousehold{
		AuthAccountID:   &aa2.ID,
		AuthHouseholdID: ah.ID,
	}
	aaah2.create(ctx, CreateOpts{})

	as1 := AuthSession{
		AuthAccountID: aa1.ID,
		Expires:       GenerateTimestamp().Add(4 * time.Hour),
		WebPush: &notify.WebPushClient{
			Endpoint: "test",
		},
	}
	as1.Create(ctx, false)

	tn := GenerateTimestamp().Add(-5 * time.Minute)
	t1 := seed.PlanTasks[0]
	t1.AuthAccountID = &aa1.ID
	t1.AuthHouseholdID = &ah.ID
	t1.Name = "test1"
	t1.DueDate = &tn
	t1.PlanProjectID = nil
	t1.Notify = true
	t1.create(ctx, CreateOpts{})

	t2 := t1
	t2.AuthAccountID = nil
	t2.Name = "test2"
	tn = tn.Add(-60 * time.Minute)
	t2.DueDate = &tn
	t2.Notify = true
	t2.create(ctx, CreateOpts{})

	t3 := t1
	t3.Name = "test3"
	tn = tn.Add(300 * time.Minute)
	t3.DueDate = &tn
	t3.Notify = true
	t3.create(ctx, CreateOpts{})

	t4 := t1
	t4.Name = "test4"
	t4.DueDate = nil
	t4.create(ctx, CreateOpts{})

	got, err := PlanTasksReadNotifications(ctx)

	assert.Equal(t, err, nil)
	assert.Equal(t, len(got), 3)

	tests := 0

	for _, notification := range got {
		if strings.Contains(notification.SubjectSMTP, "test1") {
			assert.Equal(t, len(notification.ToWebPush), 1)
			assert.Equal(t, notification.Actions.Default, "/plan/tasks?filter=upcoming")
			assert.Equal(t, notification.BodyWebPush, "test1\nPress here to view task")
			assert.Contains(t, notification.BodySMTP, "This is your reminder to complete")
			assert.Equal(t, notification.Actions, notify.WebPushActions{
				Default:    "/plan/tasks?filter=upcoming",
				Target:     t1.ID.String(),
				TargetType: tableNames[modelPlanTask],
				Types: []notify.WebPushActionType{
					NotificationActionsTypesMarkComplete,
					NotificationActionsTypesSnooze,
				},
			})

			tests++

			continue
		}

		if strings.Contains(notification.SubjectSMTP, "test2") {
			assert.Equal(t, notification.ToSMTP == aa1.EmailAddress.String() || notification.ToSMTP == aa2.EmailAddress.String(), true)

			tests++

			continue
		}
	}

	assert.Equal(t, tests, 3)

	got, err = PlanTasksReadNotifications(ctx)
	assert.Equal(t, err, nil)
	assert.Equal(t, len(got), 0)

	assert.Equal(t, tests, 3)
	// Test notified database trigger
	Read(ctx, &t1, ReadOpts{})

	assert.Equal(t, t1.Notified, true)

	opts := UpdateOpts{
		PermissionsOpts: PermissionsOpts{
			AuthAccountID: &aa1.ID,
			AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
				{
					AuthHouseholdID: ah.ID,
				},
			},
		},
	}

	t1.Notify = false
	t1.update(ctx, opts)

	t1.Notify = true
	t1.update(ctx, opts)

	assert.Equal(t, t1.Notified, false)

	aa1.Delete(ctx)
	aa2.Delete(ctx)
	ah.Delete(ctx)
}
