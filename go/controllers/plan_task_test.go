package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestPlanTaskCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.PlanTasks[0]
	good.Name = "TestCreate"
	good.ID = uuid.Nil

	var p models.PlanTasks

	noError(t, request{
		data:         good,
		method:       "POST",
		responseType: &p,
		session:      seed.AuthSessions[0],
		uri:          "/plan/tasks",
	}.do())
	assert.Equal(t, p[0].Name, good.Name)
	assert.Equal(t, p[0].AuthHouseholdID, nil)

	models.Delete(ctx, &p[0], models.DeleteOpts{})
}

func TestPlanTaskDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.PlanTasks[0]
	d.ID = uuid.Nil
	d.Name = "TestDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	noError(t, request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/plan/tasks/" + d.ID.String(),
	}.do())
}

func TestPlanTaskRead(t *testing.T) {
	logger.UseTestLogger(t)

	var p models.PlanTasks

	noError(t, request{
		method:       "GET",
		responseType: &p,
		session:      seed.AuthSessions[0],
		uri:          "/plan/tasks/" + seed.PlanTasks[3].ID.String(),
	}.do())
	assert.Equal(t, p[0].Name, seed.PlanTasks[3].Name)
}

func TestPlanTaskUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	p := seed.PlanTasks[0]
	p.ID = uuid.Nil
	p.Name = "TestUpdate"
	models.Create(ctx, &p, models.CreateOpts{})

	newName := p
	newName.Name = "TestUpdate1"

	globalTemplate := newName
	globalTemplate.AuthAccountID = nil
	globalTemplate.AuthHouseholdID = nil

	pt := seed.PlanTasks[0]
	pt.ID = uuid.UUID{}
	pt.AuthAccountID = nil
	pt.AuthHouseholdID = nil
	pt.Template = true
	models.Create(ctx, &pt, models.CreateOpts{
		PermissionsOpts: models.PermissionsOpts{
			Admin: true,
		},
	})

	pt.Name = "testing"

	tests := map[string]struct {
		err  string
		task models.PlanTask
		uri  string
	}{
		"good": {
			task: newName,
			uri:  "/plan/tasks/" + p.ID.String(),
		},
		"non-admin trying to create a template, no changes": {
			err:  errs.ErrClientForbidden.Message(),
			task: globalTemplate,
			uri:  "/plan/tasks/" + p.ID.String(),
		},
		"non-admin trying to update a template, not found": {
			err:  errs.ErrClientForbidden.Message(),
			task: pt,
			uri:  "/plan/tasks/" + pt.ID.String(),
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			var pnew models.PlanTasks

			assert.Equal(t, request{
				data:         tc.task,
				method:       "PUT",
				responseType: &pnew,
				session:      seed.AuthSessions[0],
				uri:          tc.uri,
			}.do().Error(), tc.err)

			if name == "good" {
				pnew[0].Updated = newName.Updated

				assert.Equal(t, pnew[0], newName)
			}
		})
	}

	models.Delete(ctx, &p, models.DeleteOpts{})
	models.Delete(ctx, &p, models.DeleteOpts{})
}

func TestPlanTasksRead(t *testing.T) {
	logger.UseTestLogger(t)

	var p models.PlanTasks

	msg := request{
		method:       "GET",
		responseType: &p,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/plan/tasks",
	}.do()

	noError(t, msg)
	assert.Equal(t, len(p), 0)
	assert.Equal(t, len(msg.DataIDs), 31)
}
