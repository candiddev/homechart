package models

import (
	"context"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// CookMealTime defines meal fields.
type CookMealTime struct {
	Created         time.Time         `db:"created" format:"date-time" json:"created"`
	Updated         time.Time         `db:"updated" format:"date-time" json:"updated"`
	AuthHouseholdID uuid.UUID         `db:"auth_household_id" json:"authHouseholdID"`
	ID              uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Time            types.CivilTime   `db:"time" format:"time" json:"time" swaggertype:"string"`
	Name            types.StringLimit `db:"name" json:"name"`
} // @Name CookMealTime

func (c *CookMealTime) SetID(id uuid.UUID) {
	c.ID = id
}

func (c *CookMealTime) create(ctx context.Context, _ CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	c.ID = GenerateUUID()

	return logger.Log(ctx, db.Query(ctx, false, c, `
INSERT INTO cook_meal_time (
	  auth_household_id
	, id
	, name
	, time
) VALUES (
	  :auth_household_id
	, :id
	, :name
	, :time
)
RETURNING *
`, c))
}

func (c *CookMealTime) getChange(_ context.Context) string {
	return string(c.Name)
}

func (c *CookMealTime) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return nil, &c.AuthHouseholdID, &c.ID
}

func (*CookMealTime) getType() modelType {
	return modelCookMealTime
}

func (c *CookMealTime) setIDs(_, authHouseholdID *uuid.UUID) {
	if authHouseholdID != nil {
		c.AuthHouseholdID = *authHouseholdID
	}
}

func (c *CookMealTime) update(ctx context.Context, _ UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	// Update database
	return logger.Log(ctx, db.Query(ctx, false, c, `
UPDATE cook_meal_time SET
	  name = :name
	, time = :time
WHERE id = :id
AND auth_household_id = :auth_household_id
RETURNING *
`, c))
}

// CookMealTimes is multiple CookMealTime.
type CookMealTimes []CookMealTime

func (*CookMealTimes) getType() modelType {
	return modelCookMealTime
}

// CookMealTimesInit adds default meals to a database for an AuthHouseholdID.
func CookMealTimesInit(ctx context.Context, authHouseholdID uuid.UUID, _ uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	data := []struct {
		Name types.StringLimit
		Time types.CivilTime
	}{
		{
			Name: "Breakfast",
			Time: types.CivilTime{
				Hour:   7,
				Minute: 0,
			},
		},
		{
			Name: "Lunch",
			Time: types.CivilTime{
				Hour:   12,
				Minute: 0,
			},
		},
		{
			Name: "Dinner",
			Time: types.CivilTime{
				Hour:   17,
				Minute: 0,
			},
		},
	}

	for _, meal := range data {
		m := CookMealTime{
			AuthHouseholdID: authHouseholdID,
			Name:            meal.Name,
			Time:            meal.Time,
		}

		if err := m.create(ctx, CreateOpts{}); err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}
