package controllers

import (
	"testing"
	"time"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/logger"
	"github.com/google/uuid"
)

func TestPlanProjectCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.PlanProjects[0]
	good.Name = "TestCreate"
	good.ID = uuid.Nil

	var p models.PlanProjects

	noError(t, request{
		data:         good,
		method:       "POST",
		responseType: &p,
		session:      seed.AuthSessions[0],
		uri:          "/plan/projects",
	}.do())
	assert.Equal(t, p[0].Name, good.Name)
	assert.Equal(t, p[0].AuthHouseholdID, nil)

	models.Delete(ctx, &p[0], models.DeleteOpts{})
}

func TestPlanProjectDelete(t *testing.T) {
	logger.UseTestLogger(t)

	d := seed.PlanProjects[0]
	d.ID = uuid.Nil
	d.Name = "TestDelete"
	models.Create(ctx, &d, models.CreateOpts{})

	noError(t, request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/plan/projects/" + d.ID.String(),
	}.do())
}

func TestPlanProjectRead(t *testing.T) {
	logger.UseTestLogger(t)

	var p models.PlanProjects

	noError(t, request{
		method:       "GET",
		responseType: &p,
		session:      seed.AuthSessions[0],
		uri:          "/plan/projects/" + seed.PlanProjects[5].ID.String(),
	}.do())
	assert.Equal(t, p[0].Name, seed.PlanProjects[5].Name)
}

func TestPlanProjectUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	p := seed.PlanProjects[0]
	p.ID = uuid.Nil
	p.Name = "TestUpdate"
	models.Create(ctx, &p, models.CreateOpts{})

	newName := p
	newName.Name = "TestUpdate1"

	var pnew models.PlanProjects

	noError(t, request{
		data:         newName,
		method:       "PUT",
		responseType: &pnew,
		session:      seed.AuthSessions[0],
		uri:          "/plan/projects/" + newName.ID.String(),
	}.do())

	pnew[0].Updated = newName.Updated

	assert.Equal(t, pnew[0], newName)

	models.Delete(ctx, &p, models.DeleteOpts{})
}

func TestPlanProjectsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var p models.PlanProjects

	msg := request{
		method:       "GET",
		responseType: &p,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp().Add(100 * time.Minute),
		uri:          "/plan/projects",
	}.do()

	noError(t, msg)
	assert.Equal(t, len(p), 0)
	assert.Equal(t, len(msg.DataIDs), 11)
}
