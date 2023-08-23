package models

import (
	"context"
	"fmt"
	"time"

	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// RewardCard defines a stamp card.
type RewardCard struct {
	Created         time.Time         `db:"created" format:"date-time" json:"created"`
	Updated         time.Time         `db:"updated" format:"date-time" json:"updated"`
	AuthHouseholdID uuid.UUID         `db:"auth_household_id" json:"authHouseholdID"`
	ID              uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Invert          bool              `db:"invert" json:"invert"`
	StampCount      int               `db:"stamp_count" json:"stampCount"`
	StampGoal       int               `db:"stamp_goal" json:"stampGoal"`
	ShortID         types.Nanoid      `db:"short_id" json:"shortID"`
	Details         types.StringLimit `db:"details" json:"details"`
	Name            types.StringLimit `db:"name" json:"name"`
	Reward          types.StringLimit `db:"reward" json:"reward"`
	Senders         types.SliceString `db:"senders" json:"senders"`
	Recipients      types.SliceString `db:"recipients" json:"recipients"`
} // @Name RewardCard

// RewardCardRequestType is types of RewardCard requests.
type RewardCardRequestType int

// RewardCardRequestType is types of RewardCard requests.
const (
	RewardCardRequestStamp RewardCardRequestType = iota
	RewardCardRequestRedeem
	RewardCardStamped
	RewardCardRedeemed
)

func (r *RewardCard) SetID(id uuid.UUID) {
	r.ID = id
}

func (r *RewardCard) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	r.ID = GenerateUUID()

	if !opts.Restore || r.ShortID == "" {
		r.ShortID = types.NewNanoid()
	}

	return logger.Log(ctx, db.Query(ctx, false, r, `
INSERT INTO reward_card (
	  auth_household_id
	, details
	, id
	, invert
	, name
	, short_id
	, stamp_count
	, stamp_goal
	, reward
	, senders
	, recipients
) VALUES (
	  :auth_household_id
	, :details
	, :id
	, :invert
	, :name
	, :short_id
	, :stamp_count
	, :stamp_goal
	, :reward
	, :senders
	, :recipients
)
RETURNING *
`, r))
}

func (r *RewardCard) getChange(_ context.Context) string {
	return string(r.Name)
}

func (r *RewardCard) getIDs() (_, authHouseholdID, id *uuid.UUID) {
	return nil, &r.AuthHouseholdID, &r.ID
}

func (*RewardCard) getType() modelType {
	return modelRewardCard
}

func (r *RewardCard) setIDs(_, authHouseholdID *uuid.UUID) {
	switch {
	case r.AuthHouseholdID != uuid.Nil && authHouseholdID != nil:
		r.AuthHouseholdID = *authHouseholdID
	default:
		if authHouseholdID != nil {
			r.AuthHouseholdID = *authHouseholdID
		}
	}
}

func (r *RewardCard) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	return logger.Log(ctx, db.Query(ctx, false, r, fmt.Sprintf(`
UPDATE reward_card
SET
	  details = :details
	, invert = :invert
	, name = :name
	, stamp_count = :stamp_count
	, stamp_goal = :stamp_goal
	, reward = :reward
	, senders = :senders
	, recipients = :recipients
FROM reward_card old
WHERE reward_card.id = old.id
AND reward_card.auth_household_id = ANY('%[2]s')
AND reward_card.id = :id
AND (
	'%[1]s'=ANY(old.senders)
	OR '%[1]s'=ANY(old.recipients)
)
RETURNING reward_card.*`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs()), r))
}

// RewardCards is multiple RewardCard.
type RewardCards []RewardCard

func (*RewardCards) getType() modelType {
	return modelRewardCard
}

// RewardCardsInit adds default cards to database for an AuthHouseholdID.
func RewardCardsInit(ctx context.Context, authHouseholdID, authAccountID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	cards := RewardCards{
		{
			Details:   "Plan five meals in Homechart",
			Name:      "Meal Planner",
			Reward:    "An easy way to plan meals!",
			StampGoal: 5,
		},
	}

	for _, card := range cards {
		card.AuthHouseholdID = authHouseholdID
		card.Senders = types.SliceString{
			authAccountID.String(),
		}

		if err := card.create(ctx, CreateOpts{}); err != nil {
			return logger.Log(ctx, err)
		}
	}

	return logger.Log(ctx, nil)
}
