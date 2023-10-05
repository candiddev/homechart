package controllers

import (
	"fmt"
	"testing"

	"github.com/candiddev/homechart/go/models"
	"github.com/candiddev/shared/go/assert"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
)

func TestHealthItemCreate(t *testing.T) {
	logger.UseTestLogger(t)

	good := seed.HealthItems[0]
	good.Name = "TestCreate"

	var i models.HealthItems

	r := request{
		data:         good,
		method:       "POST",
		responseType: &i,
		session:      seed.AuthSessions[0],
		uri:          "/health/items",
	}

	noError(t, r.do())
	assert.Equal(t, i[0].Name, good.Name)

	models.Delete(ctx, &i[0], models.DeleteOpts{})
}

func TestHealthItemDelete(t *testing.T) {
	logger.UseTestLogger(t)

	i := seed.HealthItems[0]
	i.Name = "TestDelete"
	models.Create(ctx, &i, models.CreateOpts{})

	r := request{
		method:  "DELETE",
		session: seed.AuthSessions[0],
		uri:     "/health/items/" + i.ID.String(),
	}

	noError(t, r.do())
}

func TestHealthItemRead(t *testing.T) {
	logger.UseTestLogger(t)

	var i models.HealthItems

	r := request{
		method:       "GET",
		responseType: &i,
		session:      seed.AuthSessions[0],
		uri:          "/health/items/" + seed.HealthItems[2].ID.String(),
	}

	noError(t, r.do())
	assert.Equal(t, i[0].Name, seed.HealthItems[2].Name)
}

func TestHealthItemUpdate(t *testing.T) {
	logger.UseTestLogger(t)

	i := seed.HealthItems[0]
	i.Name = "TestUpdate"
	models.Create(ctx, &i, models.CreateOpts{})

	newName := i
	newName.Name = "TestUpdate1"

	var inew models.HealthItems

	r := request{
		data:         newName,
		method:       "PUT",
		responseType: &inew,
		session:      seed.AuthSessions[0],
		uri:          "/health/items/" + newName.ID.String(),
	}

	noError(t, r.do())

	inew[0].Updated = newName.Updated

	assert.Equal(t, inew[0], newName)

	models.Delete(ctx, &i, models.DeleteOpts{})
}

func TestHealthItemsInit(t *testing.T) {
	logger.UseTestLogger(t)

	aa := seed.AuthAccounts[0]
	aa.EmailAddress = "testinit@example.com"
	aa.Create(ctx, false)

	as := seed.AuthSessions[0]
	as.AuthAccountID = aa.ID
	as.Create(ctx, false)

	tests := map[string]struct {
		err     string
		session models.AuthSession
		want    int
	}{
		"no access": {
			err:     errs.ErrSenderForbidden.Message(),
			session: seed.AuthSessions[2],
			want:    41,
		},
		"init": {
			session: as,
			want:    38,
		},
	}

	for name, tc := range tests {
		t.Run(name, func(t *testing.T) {
			r := request{
				method:  "PUT",
				session: tc.session,
				uri:     fmt.Sprintf("/health/items?authAccountID=%s", tc.session.AuthAccountID),
			}

			assert.Equal(t, r.do().Error(), tc.err)

			var s models.HealthItems

			models.ReadAll(ctx, &s, models.ReadAllOpts{
				PermissionsOpts: models.PermissionsOpts{
					AuthAccountID: &tc.session.AuthAccountID,
				},
			})

			assert.Equal(t, len(s), tc.want)
		})
	}

	aa.Delete(ctx)
}

func TestHealthItemsRead(t *testing.T) {
	logger.UseTestLogger(t)

	var i models.HealthItems

	r := request{
		method:       "GET",
		responseType: &i,
		session:      seed.AuthSessions[0],
		updated:      models.GenerateTimestamp(),
		uri:          "/health/items",
	}

	msg := r.do()

	noError(t, msg)

	assert.Equal(t, len(i), 0)
	assert.Equal(t, len(msg.DataIDs), 81)
}
