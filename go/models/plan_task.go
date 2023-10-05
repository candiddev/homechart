package models

import (
	"context"
	"fmt"
	"time"

	"github.com/candiddev/homechart/go/templates"
	"github.com/candiddev/homechart/go/yaml8n"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/notify"
	"github.com/candiddev/shared/go/types"
	"github.com/google/uuid"
)

// PlanTask defines task fields.
type PlanTask struct {
	DateEnd         *types.CivilDate  `db:"date_end" format:"date" json:"dateEnd" swaggertype:"string"` // end of event or recurrence
	DateStart       *types.CivilDate  `db:"date_start" json:"-"`                                        // Used by ICal reads to determine if task is all day
	Recurrence      *types.Recurrence `db:"recurrence" json:"recurrence"`
	DueDate         *time.Time        `db:"due_date" format:"date-time" json:"dueDate"`
	AuthAccountID   *uuid.UUID        `db:"auth_account_id" format:"uuid" json:"authAccountID"`
	AuthHouseholdID *uuid.UUID        `db:"auth_household_id" format:"uuid" json:"authHouseholdID"`
	InventoryItemID *uuid.UUID        `db:"inventory_item_id" format:"uuid" json:"inventoryItemID"`
	ParentID        *uuid.UUID        `db:"parent_id" format:"uuid" json:"parentID"`
	PlanProjectID   *uuid.UUID        `db:"plan_project_id" format:"uuid" json:"planProjectID"`
	ID              uuid.UUID         `db:"id" format:"uuid" json:"id"`
	Created         time.Time         `db:"created" format:"date-time" json:"created"`
	Updated         time.Time         `db:"updated" format:"date-time" json:"updated"`
	LastDoneBy      *uuid.UUID        `db:"last_done_by" json:"lastDoneBy"`
	LastDoneDate    types.CivilDate   `db:"last_done_date" json:"lastDoneDate"`
	Assignees       types.SliceString `db:"assignees" json:"assignees"`
	Tags            types.Tags        `db:"tags" json:"tags"`
	Done            bool              `db:"done" json:"done"`
	Notify          bool              `db:"notify" json:"notify"`
	NotifyComplete  bool              `db:"notify_complete" json:"-"` // Used by DB to signal if an update should notify
	Notified        bool              `db:"notified" json:"-"`
	RecurOnDone     bool              `db:"recur_on_done" json:"recurOnDone"`
	Template        bool              `db:"template" json:"template"`
	Color           types.Color       `db:"color" json:"color"`
	Duration        types.PositiveInt `db:"duration" json:"duration"`
	ShortID         types.Nanoid      `db:"short_id" json:"shortID"`
	Details         types.StringLimit `db:"details" json:"details"`
	Name            types.StringLimit `db:"name" json:"name"`
	Position        types.Position    `db:"position" json:"position"`
} // @Name PlanTask

func (t *PlanTask) SetID(id uuid.UUID) {
	t.ID = id
}

func (t *PlanTask) create(ctx context.Context, opts CreateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	t.ID = GenerateUUID()

	if t.AuthHouseholdID == nil && len(t.Assignees) > 0 {
		t.Assignees = nil
	}

	if !opts.Restore || t.ShortID == "" {
		t.ShortID = types.NewNanoid()
	}

	if t.Template {
		t.PlanProjectID = nil
	}

	if !opts.Admin && t.AuthAccountID == nil && t.AuthHouseholdID == nil {
		return logger.Error(ctx, errs.ErrSenderBadRequest.Set("authAccountID or authHouseholdID must be specified"))
	}

	return logger.Error(ctx, db.Query(ctx, false, t, `
INSERT INTO plan_task (
	  assignees
	, auth_account_id
	, auth_household_id
	, color
	, date_end
	, details
	, done
	, due_date
	, duration
	, id
	, inventory_item_id
	, name
	, notify
	, parent_id
	, plan_project_id
	, position
	, recur_on_done
	, recurrence
	, short_id
	, tags
	, template
) VALUES (
	  :assignees
	, :auth_account_id
	, :auth_household_id
	, :color
	, :date_end
	, :details
	, :done
	, :due_date
	, :duration
	, :id
	, :inventory_item_id
	, :name
	, :notify
	, :parent_id
	, :plan_project_id
	, :position
	, :recur_on_done
	, :recurrence
	, :short_id
	, :tags
	, :template
)
RETURNING *
`, t))
}

func (t *PlanTask) getChange(_ context.Context) string {
	if t.AuthHouseholdID != nil {
		return string(t.Name)
	}

	return ""
}

func (t *PlanTask) getIDs() (authAccountID, authHouseholdID, id *uuid.UUID) {
	return t.AuthAccountID, t.AuthHouseholdID, &t.ID
}

func (*PlanTask) getType() modelType {
	return modelPlanTask
}

func (t *PlanTask) setIDs(authAccountID, authHouseholdID *uuid.UUID) {
	switch {
	case t.AuthAccountID != nil && t.AuthHouseholdID == nil && authAccountID != nil:
		t.AuthAccountID = authAccountID
	case t.AuthHouseholdID != nil && authHouseholdID != nil:
		t.AuthHouseholdID = authHouseholdID
	case t.AuthAccountID == nil && t.AuthHouseholdID == nil:
		t.AuthAccountID = authAccountID
		t.AuthHouseholdID = authHouseholdID
	}
}

func (t *PlanTask) update(ctx context.Context, opts UpdateOpts) errs.Err {
	ctx = logger.Trace(ctx)

	if t.Template {
		t.PlanProjectID = nil
	}

	if !opts.Admin && t.AuthAccountID == nil && t.AuthHouseholdID == nil {
		t.AuthAccountID = opts.AuthAccountID
	}

	if t.AuthHouseholdID == nil && len(t.Assignees) > 0 {
		t.Assignees = nil
	}

	query := `
UPDATE plan_task
SET
	  assignees = :assignees
	, auth_account_id = :auth_account_id
	, auth_household_id = :auth_household_id
	, color = :color
	, date_end = :date_end
	, details = :details
	, done = :done
	, due_date = :due_date
	, duration = :duration
	, inventory_item_id = :inventory_item_id
	, last_done_by = :last_done_by
	, last_done_date = :last_done_date
	, name = :name
	, notify = :notify
	, parent_id = :parent_id
	, plan_project_id = :plan_project_id
	, position = :position
	, recur_on_done = :recur_on_done
	, recurrence = :recurrence
	, tags = :tags
	, template = :template
FROM plan_task old
WHERE plan_task.id = old.id
AND plan_task.id = :id
`
	if !opts.Admin {
		query += fmt.Sprintf(`
AND (
	plan_task.auth_account_id = '%s'
	OR plan_task.auth_household_id = ANY('%s')
)
`, opts.AuthAccountID, opts.AuthHouseholdsPermissions.GetIDs())
	}

	query += `
RETURNING
	  plan_task.*
	, CASE WHEN
	plan_task.auth_household_id IS NOT NULL
	AND ((
		NOT old.done
		AND plan_task.done
	) OR (
		old.recurrence IS NOT NULL
		AND plan_task.recurrence IS NOT NULL
		AND old.due_date != plan_task.due_date
	)) THEN true ELSE false END as notify_complete
`

	// Update database
	err := db.Query(ctx, false, t, query, t)

	if t.AuthHouseholdID != nil && t.NotifyComplete && opts.AuthAccountID != nil {
		url := "/plan/tasks?"

		switch {
		case t.PlanProjectID != nil:
			url += "project=" + t.PlanProjectID.String()
		case t.AuthHouseholdID != nil:
			url += "filter=household"
		default:
			url += "filter=personal"
		}

		a := AuthAccount{
			ID: *opts.AuthAccountID,
		}

		err := a.Read(ctx)
		if err != nil {
			logger.Error(ctx, err) //nolint:errcheck

			return nil
		}

		ns := AuthAccountsReadNotifications(ctx, nil, t.AuthHouseholdID, AuthAccountNotifyTypeTaskComplete)

		for i := range ns {
			if ns[i].AuthAccountID == nil || *ns[i].AuthAccountID == a.ID {
				continue
			}

			ns[i].Actions.Default = url
			ns[i].BodyWebPush = templates.PushTaskCompleteBody(ns[i].ISO639Code, string(a.Name), string(t.Name))
			ns[i].SubjectWebPush = yaml8n.PushTaskCompleteSubject.Translate(ns[i].ISO639Code)

			go ns[i].Send(ctx, nil) //nolint:errcheck
		}
	}

	return logger.Error(ctx, err)
}

// PlanTasks is multiple PlanTask.
type PlanTasks []PlanTask

func (*PlanTasks) getType() modelType {
	return modelPlanTask
}

// PlanTasksDelete deletes old PlanTasks from a database.
func PlanTasksDelete(ctx context.Context) {
	ctx = logger.Trace(ctx)

	query := fmt.Sprintf(`
DELETE FROM plan_task
WHERE (
	due_date < CURRENT_DATE - INTERVAL '%[1]d day'
	OR updated < CURRENT_DATE - INTERVAL '%[1]d day'
)
AND done`, c.App.KeepPlanTaskDays)

	logger.Error(ctx, db.Exec(ctx, query, nil)) //nolint:errcheck
}

// PlanTasksInit adds default projects and tasks to a database for an AuthAccount.
func PlanTasksInit(ctx context.Context, authAccountID uuid.UUID) errs.Err {
	ctx = logger.Trace(ctx)

	now := GenerateTimestamp()

	projects := PlanProjects{
		{
			AuthAccountID: &authAccountID,
			Color:         types.ColorGreen,
			Name:          "Homechart",
			Tags: types.Tags{
				"homechart",
			},
		},
	}

	for i := range projects {
		if err := projects[i].create(ctx, CreateOpts{}); err != nil {
			return logger.Error(ctx, err)
		}
	}

	id1 := GenerateUUID()
	id2 := GenerateUUID()
	id3 := GenerateUUID()
	id4 := GenerateUUID()
	id5 := GenerateUUID()

	tasks := PlanTasks{
		{
			DueDate:       &now,
			ID:            id1,
			Name:          "Setup Budgeting",
			PlanProjectID: &projects[0].ID,
			Tags: types.Tags{
				"budgeting",
				"homechart",
			},
		},
		{
			Name:     "[Create/change budget categories](/budget/categories)",
			ParentID: &id1,
			Tags: types.Tags{
				"budgeting",
				"homechart",
			},
		},
		{
			Name:     "[Create accounts](/budget/accounts)",
			ParentID: &id1,
			Tags: types.Tags{
				"budgeting",
				"homechart",
			},
		},
		{
			Name:     "[Add or import transactions to accounts](/budget/accounts)",
			ParentID: &id1,
			Tags: types.Tags{
				"budgeting",
				"homechart",
			},
		},
		{
			DueDate:       &now,
			ID:            id2,
			Name:          "Setup Cooking",
			PlanProjectID: &projects[0].ID,
			Tags: types.Tags{
				"cooking",
				"homechart",
			},
		},
		{
			Name:     "[Add or import recipes](/cook/recipes)",
			ParentID: &id2,
			Tags: types.Tags{
				"cooking",
				"homechart",
			},
		},
		{
			Name:     "[Setup meals](/cook/meals)",
			ParentID: &id2,
			Tags: types.Tags{
				"cooking",
				"homechart",
			},
		},
		{
			Name:     "[Create next week's meal plan](/calendar)",
			ParentID: &id2,
			Tags: types.Tags{
				"cooking",
				"homechart",
			},
		},
		{
			DueDate:       &now,
			ID:            id3,
			Name:          "Setup Inventory",
			PlanProjectID: &projects[0].ID,
			Tags: types.Tags{
				"inventory",
				"homechart",
			},
		},
		{
			Name:     "[Take stock of the pantry](/inventory/all)",
			ParentID: &id3,
			Tags: types.Tags{
				"inventory",
				"homechart",
			},
		},
		{
			Name:     "[Keep track of big purchases and warranties](/inventory/all)",
			ParentID: &id3,
			Tags: types.Tags{
				"inventory",
				"homechart",
			},
		},
		{
			Name:     "[Create custom views to filter for certain items, like ingredients](/inventory/all)",
			ParentID: &id3,
			Tags: types.Tags{
				"inventory",
				"homechart",
			},
		},
		{
			DueDate:       &now,
			ID:            id5,
			Name:          "Setup Notes",
			PlanProjectID: &projects[0].ID,
			Tags: types.Tags{
				"notes",
				"homechart",
			},
		},
		{
			Name:     "[Start a journal](/notes/personal/new?edit)",
			ParentID: &id5,
			Tags: types.Tags{
				"notes",
				"homechart",
			},
		},
		{
			Name:     "[Document how to change car oil](/notes/personal/new?edit)",
			ParentID: &id5,
			Tags: types.Tags{
				"notes",
				"homechart",
			},
		},
		{
			Name:     "[Plan a Party](/notes/personal/new?edit)",
			ParentID: &id5,
			Tags: types.Tags{
				"notes",
				"homechart",
			},
		},
		{
			DueDate:       &now,
			ID:            id4,
			Name:          "Setup Shopping",
			PlanProjectID: &projects[0].ID,
			Tags: types.Tags{
				"shopping",
				"homechart",
			},
		},
		{
			Name:     "[Add commonly visited stores](/shop/stores)",
			ParentID: &id4,
			Tags: types.Tags{
				"shopping",
				"homechart",
			},
		},
		{
			Name:     "[Add/change categories/aisles](/shop/categories)",
			ParentID: &id4,
			Tags: types.Tags{
				"shopping",
				"homechart",
			},
		},
		{
			Name:     "[Plan next grocery run](/shop/items)",
			ParentID: &id4,
			Tags: types.Tags{
				"shopping",
				"homechart",
			},
		},
	}

	for i := range tasks {
		tasks[i].AuthAccountID = &authAccountID

		oldID := tasks[i].ID

		if err := tasks[i].create(ctx, CreateOpts{}); err != nil {
			return logger.Error(ctx, err)
		}

		for k := range tasks {
			if tasks[k].ParentID != nil && *tasks[k].ParentID == oldID {
				tasks[k].ParentID = &tasks[i].ID
			}
		}
	}

	return logger.Error(ctx, nil)
}

// PlanTasksReadAssistant reads all tasks for an assistant and returns a text prompt.
func PlanTasksReadAssistant(ctx context.Context, p PermissionsOpts, date types.CivilDate, dateOriginal, timeZone string, overdue bool) (speech, link string, list []string) { //nolint:revive
	ctx = logger.Trace(ctx)

	f, err := getFilter(ctx, &PlanTask{}, p)
	if err != nil {
		return speechForbidden, "", []string{}
	}

	filter := map[string]any{
		"auth_account_id":    f.AuthAccountID,
		"auth_household_ids": f.AuthHouseholdIDs,
		"date":               date,
		"time_zone":          timeZone,
	}

	query := fmt.Sprintf(`
SELECT
	name
FROM plan_task
%s
`, conditionAccountOrHousehold)

	var c string

	var itemType string

	if overdue {
		query += "AND (due_date at time zone :time_zone)::::date < (now() at time zone :time_zone)::::date"
		itemType = "overdue task"
	} else {
		query += "AND (due_date at time zone :time_zone)::::date = :date"
		itemType = "task"
		c = "due " + getDateOriginal(dateOriginal, true)
	}

	var tasks []string

	logger.Error(ctx, db.Query(ctx, true, &tasks, query, filter)) //nolint:errcheck

	return toSpeechList(err, tasks, c, itemType, "/plan/tasks")
}

// PlanTasksReadICalendar reads all PlanTasks for an ICalID.
func PlanTasksReadICalendar(ctx context.Context, id *uuid.NullUUID) (types.ICalendarEvents, errs.Err) {
	ctx = logger.Trace(ctx)

	p := PlanTasks{}

	e := types.ICalendarEvents{}

	err := db.Query(ctx, true, &p, `
SELECT
	  CASE
			WHEN (plan_task.due_date at time zone auth_account.time_zone)::time = '00:00:00'
			THEN (plan_task.due_date at time zone auth_account.time_zone)::date
		END as date_start
	, plan_task.created
	, plan_task.date_end
	, plan_task.details
	, plan_task.due_date
	, plan_task.duration
	, plan_task.id
	, plan_task.notify
	, plan_task.recurrence
	, plan_task.name
	, plan_task.updated
FROM plan_task
LEFT JOIN auth_account_auth_household ON auth_account_auth_household.auth_account_id = plan_task.auth_account_id OR (auth_account_auth_household.auth_household_id = plan_task.auth_household_id AND (auth_account_auth_household.permissions -> 'plan')::integer < 2)
LEFT JOIN auth_account ON auth_account.id = plan_task.auth_account_id OR auth_account.id = auth_account_auth_household.auth_account_id
WHERE auth_account.icalendar_id = $1
AND due_date IS NOT NULL
AND NOT done
ORDER BY plan_task.created
`, nil, id)
	if err != nil {
		return nil, logger.Error(ctx, err)
	}

	offset := 10

	for i := range p {
		n := types.ICalendarEvent{
			Created:       &p[i].Created,
			Details:       p[i].Details,
			Duration:      p[i].Duration,
			ID:            types.StringLimit(p[i].ID.String()),
			Name:          types.StringLimit("Task: " + string(p[i].Name)),
			Recurrence:    p[i].Recurrence,
			RecurrenceEnd: p[i].DateEnd,
			Updated:       &p[i].Updated,
		}

		if p[i].DateStart != nil {
			n.DateStart = p[i].DateStart
			n.DateEnd = p[i].DateStart
		} else {
			n.TimestampStart = p[i].DueDate
		}

		if p[i].Duration == 0 {
			n.Duration = 30
		}

		if p[i].Notify {
			n.NotifyOffset = &offset
		}

		e = append(e, n)
	}

	return e, logger.Error(ctx, err)
}

// PlanTasksReadNotifications reads all PlanTasks ready for notification.
func PlanTasksReadNotifications(ctx context.Context) (Notifications, errs.Err) {
	ctx = logger.Trace(ctx)

	t := PlanTasks{}

	var ns Notifications

	if err := logger.Error(ctx, db.Query(ctx, true, &t, `
UPDATE plan_task
SET notified = true
WHERE DATE_TRUNC('minute', due_date) <= DATE_TRUNC('minute', now())
AND notify IS TRUE
AND notified IS FALSE
RETURNING
	  auth_account_id
	, auth_household_id
	, due_date
	, id
	, name
	, plan_project_id
`, nil)); err != nil {
		return ns, logger.Error(ctx, err)
	}

	for _, task := range t {
		url := "/plan/tasks?filter=upcoming"

		var n Notifications

		if task.AuthAccountID != nil {
			n = AuthAccountsReadNotifications(ctx, task.AuthAccountID, nil, AuthAccountNotifyTypeTaskPersonal)
		} else {
			n = AuthAccountsReadNotifications(ctx, nil, task.AuthHouseholdID, AuthAccountNotifyTypeTaskHousehold)
		}

		for i := range n {
			n[i].Actions.Default = url
			n[i].Actions.Target = task.ID.String()
			n[i].Actions.TargetType = tableNames[modelPlanTask]
			n[i].Actions.Types = []notify.WebPushActionType{
				NotificationActionsTypesMarkComplete,
				NotificationActionsTypesSnooze,
			}
			n[i].BodySMTP = templates.EmailTaskReminderBody(n[i].ISO639Code, string(task.Name), c.App.BaseURL+url)
			n[i].BodyWebPush = templates.PushTaskReminderBody(n[i].ISO639Code, string(task.Name))
			n[i].SubjectWebPush = yaml8n.EmailPushTaskReminderSubject.Translate(n[i].ISO639Code)
			n[i].SubjectSMTP = templates.EmailTaskReminderSubject(n[i].ISO639Code, string(task.Name))
		}

		ns = append(ns, n...)
	}

	return ns, logger.Error(ctx, nil)
}
