package models

import (
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"time"

	"github.com/candiddev/shared/go/crypto"
	"github.com/candiddev/shared/go/errs"
	"github.com/candiddev/shared/go/logger"
	"github.com/candiddev/shared/go/types"
)

// Seed populates the database with generic data.
func Seed(ctx context.Context, demo bool) (*Data, errs.Err) { //nolint:gocognit,gocyclo
	central, err := time.LoadLocation("US/Central")
	if err != nil {
		return nil, logger.Log(ctx, errs.NewServerErr(err))
	}

	tz := types.TimeZone(central.String())

	expires := GenerateTimestamp().Add(168 * time.Hour)
	hourago := time.Now().Add(-1 * time.Hour)
	id1 := GenerateUUID()
	id2 := GenerateUUID()
	id3 := GenerateUUID()
	id4 := GenerateUUID()
	id5 := GenerateUUID()
	id6 := GenerateUUID()
	id7 := GenerateUUID()
	lastWeek := GenerateTimestamp().Add(-7 * 24 * time.Hour)
	nextWeek := GenerateTimestamp().Add(7 * 24 * time.Hour)
	offset := 10
	today := types.CivilDateToday()
	tomorrow := types.CivilDateToday().AddDays(1)
	tomorrowTime := time.Date(tomorrow.Year, tomorrow.Month, tomorrow.Day, 0, 0, 0, 0, central)
	tomorrowTime1 := tomorrowTime.Add(8 * time.Hour)
	tomorrowTime2 := tomorrowTime.Add(9 * time.Hour)
	tomorrowTime3 := tomorrowTime.Add(11 * time.Hour)
	yesterday := types.CivilDateToday().AddDays(-1)
	yesterdayTime := GenerateTimestamp().Add(-24 * time.Hour)
	twoDaysAgo := types.CivilDateToday().AddDays(-2)
	nextMonth := today.AddMonths(1)

	seed := &Data{}

	seed.AuthHouseholds = AuthHouseholds{
		{
			BackupEncryptionKey:   "secret",
			ID:                    GenerateUUID(),
			Name:                  "Doe Family",
			SubscriptionExpires:   types.CivilDateToday().AddMonths(120),
			SubscriptionProcessor: AuthHouseholdSubscriptionProcessorNone,
		},
		{
			ID:                  GenerateUUID(),
			Name:                "Smith Family",
			SubscriptionExpires: types.CivilDateToday().AddDays(c.App.TrialDays),
		},
	}

	if demo {
		seed.AuthHouseholds[0].Demo = true
		seed.AuthHouseholds[1].Demo = true
		seed.AuthHouseholds[0].SubscriptionExpires = today
		seed.AuthHouseholds[1].SubscriptionExpires = today
	}

	prv1, pub1, _ := crypto.NewRSA()
	key1, _ := crypto.EncryptValue(nil, string(prv1))
	prv2, pub2, _ := crypto.NewRSA()
	key2, _ := crypto.EncryptValue(nil, string(prv2))

	seed.AuthAccounts = AuthAccounts{
		{
			DailyAgendaNext: &lastWeek,
			EmailAddress:    "jane@example.com",
			LastActivity:    lastWeek,
			ID:              GenerateUUID(),
			Name:            "Jane",
			Password:        "jane@example.com",
			PublicKey:       pub1,
			PrivateKeys: AuthAccountPrivateKeys{
				{
					Key:      key1,
					Name:     "Demo",
					Provider: AuthAccountPrivateKeyProviderNone,
				},
			},
		},
		{
			DailyAgendaNext: &lastWeek,
			EmailAddress:    "john@example.com",
			ID:              GenerateUUID(),
			LastActivity:    lastWeek,
			Name:            "John",
			Password:        "john@example.com",
			Preferences: AuthAccountPreferences{
				ColorAccent:         types.ColorRed,
				ColorPrimary:        types.ColorGreen,
				ColorSecondary:      types.ColorBlue,
				DarkMode:            true,
				FormatDateOrder:     types.CivilDateOrderDMY,
				FormatDateSeparator: types.CivilDateSeparatorDash,
				FormatTime24:        true,
				FormatWeek8601:      true,
			},
		},
		{
			Child:           true,
			DailyAgendaNext: &lastWeek,
			ID:              GenerateUUID(),
			Name:            "Jennifer",
			PublicKey:       pub2,
			PrivateKeys: AuthAccountPrivateKeys{
				{
					Key:      key2,
					Name:     "Demo",
					Provider: AuthAccountPrivateKeyProviderNone,
				},
			},
		},
		{
			DailyAgendaNext: &lastWeek,
			EmailAddress:    "grandma@example.com",
			ID:              GenerateUUID(),
			LastActivity:    lastWeek,
			Name:            "Grandma",
			Password:        "grandma@example.com",
			Preferences: AuthAccountPreferences{
				FormatDateOrder:     types.CivilDateOrderDMY,
				FormatDateSeparator: types.CivilDateSeparatorPeriod,
				FormatTime24:        true,
				FormatWeek8601:      true,
			},
		},
		{
			EmailAddress: "grandpa@example.com",
			ID:           GenerateUUID(),
			LastActivity: lastWeek,
			Name:         "Grandpa",
			Password:     "grandpa@example.com",
		},
	}

	seed.AuthAccountAuthHouseholds = AuthAccountAuthHouseholds{
		{
			AuthAccountID:   &seed.AuthAccounts[0].ID,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Color:           types.ColorGreen,
		},
		{
			AuthAccountID:   &seed.AuthAccounts[1].ID,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Color:           types.ColorGray,
			Permissions: Permissions{
				Auth:     1,
				Budget:   2,
				Calendar: 2,
				Notes:    2,
				Plan:     2,
				Secrets:  2,
				Shop:     2,
			},
		},
		{
			AuthAccountID:   &seed.AuthAccounts[2].ID,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Color:           types.ColorPurple,
			Permissions: Permissions{
				Auth:   1,
				Budget: 2,
				Cook:   2,
			},
		},
		{
			AuthAccountID:   &seed.AuthAccounts[3].ID,
			AuthHouseholdID: seed.AuthHouseholds[1].ID,
		},
		{
			AuthAccountID:   &seed.AuthAccounts[4].ID,
			AuthHouseholdID: seed.AuthHouseholds[1].ID,
		},
		{
			AuthAccountID:   &seed.AuthAccounts[0].ID,
			AuthHouseholdID: seed.AuthHouseholds[1].ID,
			Permissions:     Permissions{},
		},
	}

	if demo {
		seed.AuthAccounts[0].EmailAddress = types.EmailAddress(fmt.Sprintf("%s@demo.example.com", GenerateUUID()))
		seed.AuthAccounts[1].EmailAddress = types.EmailAddress(fmt.Sprintf("%s@demo.example.com", GenerateUUID()))
		seed.AuthAccounts[3].EmailAddress = types.EmailAddress(fmt.Sprintf("%s@demo.example.com", GenerateUUID()))
		seed.AuthAccounts[4].EmailAddress = types.EmailAddress(fmt.Sprintf("%s@demo.example.com", GenerateUUID()))
	}

	if code := GetISO639Code(ctx); code != "" {
		seed.AuthAccounts[0].ISO639Code = code
		seed.AuthAccounts[1].ISO639Code = code
		seed.AuthAccounts[2].ISO639Code = code
	}

	for i := range seed.AuthAccounts {
		if !demo {
			seed.AuthAccounts[i].Setup = true
			seed.AuthAccounts[i].TimeZone = "America/Chicago"
		}

		seed.AuthAccounts[i].ToSAccepted = true
		seed.AuthAccounts[i].Verified = true

		if err := seed.AuthAccounts[i].GeneratePasswordHash(ctx); err != nil {
			return nil, logger.Log(ctx, err)
		}
	}

	seed.AuthSessions = AuthSessions{
		{
			AuthAccountID: seed.AuthAccounts[0].ID,
			Expires:       expires,
			Name:          "Demo",
		},
		{
			AuthAccountID: seed.AuthAccounts[1].ID,
			Expires:       expires,
			Name:          "Testing",
		},
		{
			AuthAccountID: seed.AuthAccounts[0].ID,
			Expires:       expires,
			Name:          "Restricted",
			PermissionsAccount: Permissions{
				Auth:     1,
				Budget:   2,
				Calendar: 2,
				Cook:     2,
				Health:   2,
				Notes:    2,
				Plan:     2,
				Shop:     2,
			},
			PermissionsHouseholds: AuthHouseholdsPermissions{
				{
					AuthHouseholdID: seed.AuthHouseholds[0].ID,
					Permissions: Permissions{
						Auth:     1,
						Calendar: 2,
						Cook:     2,
						Health:   2,
						Notes:    2,
						Plan:     2,
						Shop:     2,
					},
				},
			},
		},
	}

	if !demo {
		seed.AuthSessions = append(seed.AuthSessions, AuthSession{
			AuthAccountID: seed.AuthAccounts[3].ID,
			Expires:       expires,
			Name:          "Testing",
		})
	}

	seed.BudgetAccounts = BudgetAccounts{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Budget:          true,
			ID:              GenerateUUID(),
			Icon:            "attach_money",
			Name:            "Cash",
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			ID:              GenerateUUID(),
			Icon:            "grass",
			Name:            "Cash Buried Outside",
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Budget:          true,
			ID:              GenerateUUID(),
			Icon:            "credit_card",
			Name:            "Platinum Credit Card",
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Hidden:          true,
			ID:              GenerateUUID(),
			Name:            "Money Market",
		},
	}

	seed.BudgetCategories = BudgetCategories{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Grouping:        "Food",
			ID:              GenerateUUID(),
			Name:            "Pistachios",
			TargetAmount:    400000,
			TargetMonth:     1,
			TargetYear:      types.CivilDateToday().AddMonths(12).Year,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Grouping:        "Home",
			ID:              GenerateUUID(),
			Name:            "Cleaning",
			TargetAmount:    40000,
			TargetMonth:     12,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Grouping:        "Home",
			ID:              GenerateUUID(),
			Name:            "Electronics",
			TargetAmount:    40000,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Grouping:        "Income",
			ID:              GenerateUUID(),
			Income:          true,
			Name:            "Jane's General Store",
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			ID:              GenerateUUID(),
			TargetAmount:    20000,
			Name:            "Fun Fund",
		},
	}

	seed.BudgetMonthCategories = BudgetMonthCategories{
		{
			Amount:           30000,
			AuthHouseholdID:  seed.AuthHouseholds[0].ID,
			BudgetCategoryID: seed.BudgetCategories[0].ID,
			YearMonth:        today.YearMonth(),
		},
		{
			Amount:           20000,
			AuthHouseholdID:  seed.AuthHouseholds[0].ID,
			BudgetCategoryID: seed.BudgetCategories[1].ID,
			YearMonth:        today.YearMonth(),
		},
		{
			Amount:           10000,
			AuthHouseholdID:  seed.AuthHouseholds[0].ID,
			BudgetCategoryID: seed.BudgetCategories[2].ID,
			YearMonth:        today.YearMonth(),
		},
	}

	seed.BudgetPayees = BudgetPayees{
		{
			Address:         "123 Main St, Hometown, USA",
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			ID:              GenerateUUID(),
			Icon:            "storefront",
			Name:            "Jane's General Store",
			ShopStore:       true,
			ShortID:         types.NewNanoid(),
		},
		{
			Address:         "123 Wall St, Hometown, USA",
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			ID:              GenerateUUID(),
			Name:            "John's Mega Mart",
			ShopStore:       true,
			ShortID:         types.NewNanoid(),
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			ID:              GenerateUUID(),
			Name:            "Jane's Thrift Shop",
			ShopStore:       true,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			ID:              GenerateUUID(),
			Name:            "John's Bait and Tackle",
			ShopStore:       true,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Name:            "Pet Store",
			ShopStore:       true,
		},
	}

	seed.BudgetTransactions = BudgetTransactions{
		{
			Accounts: BudgetTransactionAccounts{
				{
					Amount:          100000,
					BudgetAccountID: &seed.BudgetAccounts[0].ID,
				},
			},
			Amount:          100000,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[0].ID,
			Categories: BudgetTransactionCategories{
				{
					Amount:           100000,
					BudgetCategoryID: &seed.BudgetCategories[3].ID,
					YearMonth:        today.YearMonth(),
				},
			},
			Date: today,
			Note: "Income from job",
		},
		{
			Accounts: BudgetTransactionAccounts{
				{
					Amount:          -5000,
					BudgetAccountID: &seed.BudgetAccounts[0].ID,
				},
			},
			Amount:          -5000,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[1].ID,
			Categories: BudgetTransactionCategories{
				{
					Amount:           -5000,
					BudgetCategoryID: &seed.BudgetCategories[4].ID,
					YearMonth:        today.YearMonth(),
				},
			},
			Date: today,
			Note: "Movie",
		},
		{
			Accounts: BudgetTransactionAccounts{
				{
					Amount:          -10000,
					BudgetAccountID: &seed.BudgetAccounts[0].ID,
				},
			},
			Amount:          -10000,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[1].ID,
			Date:            today,
			Categories: BudgetTransactionCategories{
				{
					Amount:           -5000,
					BudgetCategoryID: &seed.BudgetCategories[0].ID,
					YearMonth:        today.YearMonth(),
				},
				{
					Amount:           -5000,
					BudgetCategoryID: &seed.BudgetCategories[1].ID,
					YearMonth:        today.YearMonth(),
				},
			},
			Note: "Groceries for the week",
		},
		{
			Accounts: BudgetTransactionAccounts{
				{
					Amount:          -10000,
					BudgetAccountID: &seed.BudgetAccounts[0].ID,
				},
				{
					Amount:          10000,
					BudgetAccountID: &seed.BudgetAccounts[1].ID,
				},
			},
			Amount:          10000,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Categories: BudgetTransactionCategories{
				BudgetTransactionCategory{
					Amount:           10000,
					BudgetCategoryID: &seed.BudgetCategories[4].ID,
					YearMonth:        today.YearMonth(),
				},
			},
			Date: today,
			Note: "Transfer to savings",
		},
		{
			Accounts: BudgetTransactionAccounts{
				{
					Amount:          -20000,
					BudgetAccountID: &seed.BudgetAccounts[2].ID,
				},
			},
			Amount:          -20000,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[2].ID,
			Date:            today,
			Categories: BudgetTransactionCategories{
				{
					Amount:           -10000,
					BudgetCategoryID: &seed.BudgetCategories[1].ID,
					YearMonth:        today.YearMonth(),
				},
				{
					Amount:           -10000,
					BudgetCategoryID: &seed.BudgetCategories[2].ID,
					YearMonth:        today.YearMonth(),
				},
			},
			Note: "Incidentals",
		},
		{
			Accounts: BudgetTransactionAccounts{
				{
					Amount:          -10000,
					BudgetAccountID: &seed.BudgetAccounts[0].ID,
				},
			},
			Amount:          -10000,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[0].ID,
			Date:            today,
			Categories: BudgetTransactionCategories{
				{
					Amount:           -10000,
					BudgetCategoryID: &seed.BudgetCategories[0].ID,
					YearMonth:        today.AddMonths(1).YearMonth(),
				},
			},
			Note: "Lunch",
		},
	}

	seed.BudgetRecurrences = BudgetRecurrences{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetAccountID: seed.BudgetAccounts[0].ID,
			Recurrence: types.Recurrence{
				Separation: 2,
				Weekdays: []types.Weekday{
					types.Friday,
				},
			},
			Template: BudgetRecurrenceTemplate{
				seed.BudgetTransactions[0],
			},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetAccountID: seed.BudgetAccounts[0].ID,
			Recurrence: types.Recurrence{
				Separation: 2,
				Weekdays: []types.Weekday{
					types.Friday,
				},
			},
			Template: BudgetRecurrenceTemplate{
				seed.BudgetTransactions[1],
			},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetAccountID: seed.BudgetAccounts[2].ID,
			Recurrence: types.Recurrence{
				Day:        1,
				Separation: 1,
			},
			Template: BudgetRecurrenceTemplate{
				seed.BudgetTransactions[4],
			},
		},
	}

	seed.CalendarEvents = CalendarEvents{
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Location:      "School",
			Color:         types.ColorBlue,
			DateStart:     today.AddDays(-5),
			Duration:      60,
			Name:          "Pickup kids",
			NotifyOffset:  &offset,
			Recurrence: &types.Recurrence{
				Separation: 1,
			},
			SkipDays: types.SliceString{
				yesterday.String(),
			},
			TimeStart: types.CivilTime{
				Hour:   15,
				Minute: 0,
			},
			TimeZone: tz,
		},
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Color:         types.ColorRed,
			DateStart:     yesterday,
			Duration:      60,
			Location:      "School",
			Name:          "Early release",
			TimeStart: types.CivilTime{
				Hour:   12,
				Minute: 0,
			},
			TimeZone:   tz,
			TravelTime: 15,
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			DateStart: types.CivilDate{
				Day:   4,
				Month: 10,
				Year:  2020,
			},
			Details:  "See #shopstore/" + types.StringLimit(seed.BudgetPayees[1].ShortID),
			Duration: 120,
			Location: seed.BudgetPayees[1].Name,
			Name:     "Grocery shopping",
			Participants: types.SliceString{
				seed.AuthAccounts[1].ID.String(),
			},
			Recurrence: &types.Recurrence{
				Separation: 1,
				Weekdays: []types.Weekday{
					types.Sunday,
					types.Wednesday,
				},
			},
			TimeStart: types.CivilTime{
				Hour:   9,
				Minute: 0,
			},
			TimeZone:   tz,
			TravelTime: 30,
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           types.ColorRed,
			DateStart: types.CivilDate{
				Day:   1,
				Month: nextMonth.Month,
				Year:  nextMonth.Year,
			},
			Duration: 120,
			Location: "School office",
			Name:     "PTO Meeting",
			Participants: types.SliceString{
				seed.AuthAccounts[0].ID.String(),
			},
			Recurrence: &types.Recurrence{
				Day:        1,
				Separation: 1,
			},
			TimeStart: types.CivilTime{
				Hour:   19,
				Minute: 0,
			},
			TimeZone:   tz,
			TravelTime: 30,
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			DateStart: types.CivilDate{
				Day:   1,
				Month: 10,
				Year:  2020,
			},
			Duration: 0,
			Name:     "John's Birthday",
			Participants: types.SliceString{
				seed.AuthAccounts[1].ID.String(),
			},
			Recurrence: &types.Recurrence{
				Day:        1,
				Month:      10,
				Separation: 1,
			},
			TimeStart: types.CivilTime{
				Hour:   0,
				Minute: 0,
			},
			TimeZone: tz,
		},
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Color:         types.ColorGray,
			DateStart:     tomorrow,
			Duration:      0,
			Name:          "Paycheck",
			Recurrence: &types.Recurrence{
				MonthWeek:  -1,
				Separation: 1,
				Weekday:    types.Friday,
			},
			TimeStart: types.CivilTime{
				Hour:   0,
				Minute: 0,
			},
			TimeZone: tz,
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[1].ID,
			DateStart:       tomorrow,
			Duration:        60,
			Name:            "Take Mom Grocery Shopping",
			Participants: types.SliceString{
				seed.AuthAccounts[0].ID.String(),
				seed.AuthAccounts[3].ID.String(),
			},
			Recurrence: &types.Recurrence{
				Separation: 1,
				Weekdays: []types.Weekday{
					types.Friday,
				},
			},
			TimeStart: types.CivilTime{
				Hour:   13,
				Minute: 0,
			},
			TimeZone: tz,
		},
	}

	seed.CookMealTimes = CookMealTimes{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			ID:              id1,
			Name:            "Brunch",
			Time: types.CivilTime{
				Hour:   7,
				Minute: 0,
			},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			ID:              id2,
			Name:            "Luncheon",
			Time: types.CivilTime{
				Hour:   12,
				Minute: 0,
			},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			ID:              id3,
			Name:            "Supper",
			Time: types.CivilTime{
				Hour:   17,
				Minute: 0,
			},
		},
	}

	seed.CalendarICalendars = CalendarICalendars{
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			ICS: `BEGIN:VCALENDAR
END:VCALENDAR`,
			ID:   &id1,
			Name: "Work Calendar",
		},
	}

	seed.CookRecipes = CookRecipes{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Directions: `1. Slice sourdough bread.
2. Add toppings and dressing
3. Cook on panini press until grill marks show and toppings are warm/melted`,
			ID:    id1,
			Image: cookRecipePanini,
			Ingredients: `1 loaf sourdough bread
1 red onion
1 tomato
Mayo
Vinegar
Toppings`,
			Name: "Paninis",
			Notes: CookRecipeNotes{
				{
					Complexity: 3,
					Date:       today,
					Note:       "Used sourdough bread from #shopstore/" + types.StringLimit(seed.BudgetPayees[0].ShortID),
					Rating:     4,
				},
				{
					Complexity: 4,
					Date:       types.CivilDateOf(lastWeek),
					Note:       "It was OK",
					Rating:     3,
				},
			},
			Public:   true,
			Servings: "4",
			ShortID:  types.NewNanoid(),
			Source:   "homechart.app",
			Tags:     types.Tags{"meal", "sandwich"},
			TimeCook: 10,
			TimePrep: 10,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Complexity:      5,
			Directions: `1. Add the flour, salt and sugar into a large bowl and whisk to combine. Cut the vegetable shortening into cubes and scatter into the flour. Use a fork or pastry cutter to slice the vegetable shortening into the flour until you reach a crumbly texture. Drizzle the milk across the flour mixture and use the fork to combine. Mix until everything comes together and you will be able to form a ball of dough. Don't over mix.
2. To roll the dough: Spread a clean tea towel over your work surface and lightly sprinkle flour over it. Scoop the dough into a rough ball, and put it in the center of the floured tea towel. Roll it out until you have a rough circle that is several inches bigger than your pie dis, to allow room for the sides and edges of the crust.
3. Use the tea towel to help you flip the dough into the pie dish. If some pieces fall of that's fine. Use a knife to cut off the excess pastry around the edges. If there are any holes, fill them with some of the extra pieces. Pinch the edges to form a pretty crust.
4. To Pre-Cook Your Pie Crust (optional): Only do this if the recipe requires a fully cooked crust prior to filling it. Preheat your oven to 450F (230C). Pierce the crust all over with a fork. Bake the crust for 15 minutes. Reduce the heat to 400F and continue cooking until the crust is lightly browned, just a couple more minutes.`,
			ID:    id2,
			Image: cookRecipePie,
			Ingredients: `1 1/2 cup all-purpose flour (plus more for rolling)
1/4 teaspoon salt
1/4 teaspoon sugar
1/4 pound vegetable shortening (1/2 cup + 1 tablespoon) *see notes
1/4 cup non-dairy milk (or more if needed)
Apple pie filling
`,
			Name: "Apple Pie",
			Notes: CookRecipeNotes{
				{
					Complexity: 5,
					Date:       today,
					Note:       "Tried to use stevia, was not sweet enough",
					Rating:     3,
				},
				{
					Complexity: 4,
					Date:       types.CivilDateOf(lastWeek),
					Note:       "No changes",
					Rating:     4,
				},
			},
			Rating:   5,
			Servings: "6",
			Source:   "homechart.app",
			Tags:     types.Tags{"dessert", "apples"},
			TimeCook: 60,
			TimePrep: 15,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Complexity:      5,
			Directions: `1. Bring Chicken broth to a boil. Cook noodles in separate pot if you want thinner soup - start this now so they are done at the same time.
2. Add onion, celery, carrots, garlic, and spices. Cover and simmer for 15-20 minutes.
3. Add chicken and cook for 30 minutes.
4. Add noodles, cook a few minutes then serve. Will be HOT!`,
			ID:    id3,
			Image: cookRecipeSoup,
			Ingredients: `2 1/2 cups wide egg noodles
6 cups regular chicken broth
6 cups low sodium chicken broth
1 tablespoons salt
1 tbsp poultry seasoning
1 tbsp granulated garlic
2 tbsp oregano
1 tbsp thyme
1 tsp black pepper
1 cup chopped celery
1 cup chopped onion
1 cup chopped carrots
1/3 cup cornstarch
1/4 cup water
1 rotisserie chicken
`,
			Name:     "Chicken Noodle Soup",
			Public:   true,
			Rating:   5,
			Servings: "12",
			Source:   "homechart.app",
			Tags:     types.Tags{"meal", "soup"},
			TimeCook: 40,
			TimePrep: 10,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Directions: `## Cake
1. Heat oven to 350 degrees F and grease an 10×15 inch sheet pan (9×13 inches would work if needed).
2. In a large bowl, add the flour, cornstarch, baking powder, salt and sugar. Whisk well to combine.To the bowl with the dry ingredients, pour in the oil, soy milk, apple cider vinegar and vanilla extract. Mix with a large spoon until just combined, but be careful not to over mix the batter or your cake won't be soft and fluffy.
3. Pour into the prepared pan and bake for 25-30 minutes. If using a 9×13 inch pan, it will need to bake for 40 minutes or so. Check with a toothpick to ensure doneness.
4. Let the cake cool, then slice into strips about 1 1/2 inches wide. You will have some leftover cake pieces, which are lovely to have with tea or as a fun snack. Set aside.

## Vegan Mascarpone
1. To a food processor (or blender), add the vegan cream cheese, sugar, coconut oil, vanilla, coconut milk and a tiny pinch of salt. Mix or blend until smooth, then place in the freezer for 15-20 minutes. It will firm up somewhat due to the coconut oil.

## Espresso Topping
1. In a small bowl, stir together the espresso or strong coffee, liquor and sugar. Set aside.

## Assembly
1. Get out an 8×8 inch pan or tall dish. Dip the cake strips into the espresso mixture and place a layer in the bottom of the pan. Layer on half of the creamy mixture. Add another layer of espresso dipped cake pieces, then the rest of cream and refrigerate.
2. Refrigerate for several hours or overnight if possible to let the cream firm up and the flavors to mingle.
3. After chilling for several hours or overnight, dust with cocoa powder (I used a sifter for this). Slice and serve.`,
			ID:    id4,
			Image: cookRecipeTiramasu,
			Ingredients: `## Cake
2 1/2 cups all purpose flour
2 tablespoons cornstarch
1 tablespoon baking powder
1/2 teaspoon salt
1 cup granulated sugar
3/4 cup canola oil
1 1/2 cups unsweetened soy milk
2 teaspoons apple cider vinegar
1 tablespoon pure vanilla extract

## Vegan Mascarpone
(2) 8-ounce containers vegan cream cheese (16 oz total)
1/2 cup granulated sugar
1/4 cup coconut oil (use refined for NO coconut flavor)
2 teaspoons pure vanilla extract
1/2 cup full fat coconut milk, the white creamy part only
tiny pinch of salt

## Espresso Topping
4-6 shots strong espresso or coffee (about 1 cup)
4 tablespoons coffee liquor (I used Kahlua)
3 tablespoons granulated sugar

## Finish
2 tablespoons cocoa powder, for dusting the top
`,
			Name:     "Tiramasu",
			Servings: "5-7",
			Source:   "homechart.app",
			Tags:     types.Tags{"dessert", "coffee"},
			TimeCook: 0,
			TimePrep: 720,
		},
	}

	seed.CookMealPlans = CookMealPlans{ // needs to be after recipes and meal times
		{
			AuthHouseholdID:      seed.AuthHouseholds[0].ID,
			CookMealTimeID:       seed.CookMealTimes[1].ID,
			CookRecipeID:         &seed.CookRecipes[0].ID,
			CookRecipeScale:      "2",
			Date:                 today,
			ID:                   id1,
			NotificationTimeCook: &hourago,
			NotificationTimePrep: &hourago,
			Time: types.CivilTime{
				Hour:   13,
				Minute: 0,
			},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			CookMealTimeID:  seed.CookMealTimes[2].ID,
			CustomRecipe:    "Pizza",
			Date:            yesterday,
			Time: types.CivilTime{
				Hour:   17,
				Minute: 0,
			},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			CookMealTimeID:  seed.CookMealTimes[0].ID,
			CustomRecipe:    "Donuts",
			Date:            today,
			Time: types.CivilTime{
				Hour:   8,
				Minute: 0,
			},
		},
		{
			AuthAccountID:        &seed.AuthAccounts[1].ID,
			AuthHouseholdID:      seed.AuthHouseholds[0].ID,
			CookMealTimeID:       seed.CookMealTimes[2].ID,
			CookRecipeID:         &seed.CookRecipes[1].ID,
			Date:                 today,
			NotificationTimeCook: &hourago,
			NotificationTimePrep: &hourago,
			Time: types.CivilTime{
				Hour:   18,
				Minute: 0,
			},
		},
		{
			AuthAccountID:   &seed.AuthAccounts[1].ID,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			CookMealTimeID:  seed.CookMealTimes[2].ID,
			CookRecipeID:    &seed.CookRecipes[2].ID,
			Date:            today,
			ID:              id2,
			Time: types.CivilTime{
				Hour:   18,
				Minute: 0,
			},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			CookMealTimeID:  seed.CookMealTimes[2].ID,
			CustomRecipe:    "Spaghetti",
			Date:            tomorrow,
			Time: types.CivilTime{
				Hour:   17,
				Minute: 0,
			},
		},
		{
			AuthAccountID:   &seed.AuthAccounts[0].ID,
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			CookMealTimeID:  seed.CookMealTimes[2].ID,
			CookRecipeID:    &seed.CookRecipes[3].ID,
			Date:            tomorrow,
			Time: types.CivilTime{
				Hour:   17,
				Minute: 0,
			},
		},
	}

	seed.Bookmarks = Bookmarks{
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Home:          true,
			IconName:      "delete",
			Link:          "/cook/recipes?tag=deleted",
			Name:          "Deleted Recipes",
			Tags:          types.Tags{"tiles"},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Home:            true,
			IconLink:        "https://www.candid.dev/candiddev.png",
			Link:            "https://www.candid.dev",
			Name:            "Candid Development",
			Tags:            types.Tags{"tiles"},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Home:            true,
			IconLink:        "https://homechart.app/logo.png",
			Link:            "https://homechart.app",
			Name:            "Homechart",
			NewWindow:       true,
			Tags:            types.Tags{"tiles"},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Link:            "https://www.irs.gov",
			Name:            "Tax Return",
			Tags:            types.Tags{"documents", "important"},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Link:            "https://www.example.com",
			Name:            "Lawn Mower Warranty",
			Tags:            types.Tags{"documents", "warranties"},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Link:            "https://www.example.com",
			Name:            "Mega Mart Receipt",
			Tags:            types.Tags{"documents", "receipts"},
		},
	}

	seed.InventoryItems = InventoryItems{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Image:           inventoryItemFlour,
			Name:            "Flour",
			Properties: InventoryItemProperties{
				"Brand":    "Super flour",
				"Location": "Pantry",
				"Type":     "Whole wheat",
			},
			Quantity: 2,
			UPC:      "123456",
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Image:           inventoryItemAAABattery,
			Name:            "AAA Batteries",
			Properties: InventoryItemProperties{
				"Brand":    "Super batteries",
				"Count":    "16",
				"Location": "Pantry",
				"Type":     "AAA",
			},
			Quantity: 5,
			UPC:      "123456",
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Image:           inventoryItemLaptop,
			Name:            "Laptop",
			Properties: InventoryItemProperties{
				"Brand":    "Super laptop",
				"Location": "Basement",
				"Warranty": "1 year",
			},
			Quantity: 1,
			UPC:      "123456",
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Image:           inventoryItemWashingMachine,
			ID:              id1,
			Properties: InventoryItemProperties{
				"Location": "Basement",
			},
			Name:     "Washing Machine",
			Quantity: 1,
			UPC:      "123456",
		},
	}

	seed.InventoryCollections = InventoryCollections{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Grouping:        "Filters",
			Icon:            "store",
			Name:            "Super Items",
			Columns: InventoryCollectionColumns{
				"image":            "",
				"name":             "",
				"properties.Brand": "Super",
			},
			Sort: InventoryCollectionSort{
				Property: "name",
			},
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Grouping:        "Filters",
			Icon:            "numbers",
			Name:            "Warranties",
			Columns: InventoryCollectionColumns{
				"name":                "",
				"properties.Warranty": "",
			},
			Sort: InventoryCollectionSort{
				Invert:   true,
				Property: "properties.Warranty",
			},
		},
	}

	seed.HealthItems = HealthItems{
		{
			AuthAccountID: seed.AuthAccounts[0].ID,
			Color:         types.ColorYellow,
			ID:            id1,
			Name:          "Pineapple",
		},
		{
			AuthAccountID: seed.AuthAccounts[0].ID,
			Color:         types.ColorOrange,
			ID:            id2,
			Name:          "Ginger",
		},
		{
			AuthAccountID: seed.AuthAccounts[0].ID,
			Color:         types.ColorBlue,
			ID:            id3,
			Name:          "Restless Legs",
			Output:        true,
		},
		{
			AuthAccountID: seed.AuthAccounts[2].ID,
			Color:         types.ColorBrown,
			ID:            id4,
			Name:          "Cookies",
		},
		{
			AuthAccountID: seed.AuthAccounts[2].ID,
			Color:         types.ColorBlack,
			ID:            id5,
			Name:          "Problems at School",
			Output:        true,
		},
	}

	seed.HealthLogs = HealthLogs{
		{
			AuthAccountID: seed.AuthAccounts[0].ID,
			Date:          twoDaysAgo,
			HealthItemID:  id1,
		},
		{
			AuthAccountID: seed.AuthAccounts[0].ID,
			Date:          yesterday,
			HealthItemID:  id1,
		},
		{
			AuthAccountID: seed.AuthAccounts[0].ID,
			Date:          yesterday,
			HealthItemID:  id2,
		},
		{
			AuthAccountID: seed.AuthAccounts[0].ID,
			Date:          today,
			HealthItemID:  id3,
		},
		{
			AuthAccountID: seed.AuthAccounts[2].ID,
			Date:          yesterday,
			HealthItemID:  id4,
		},
		{
			AuthAccountID: seed.AuthAccounts[2].ID,
			Date:          today,
			HealthItemID:  id5,
		},
	}

	seed.NotesPages = NotesPages{
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Color:         types.ColorGreen,
			ID:            id1,
			Icon:          "calendar_today",
			Name:          "Journal",
			Tags: types.Tags{
				"life",
				"story",
			},
		},
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Color:         types.ColorGreen,
			ID:            id2,
			Icon:          "calendar_today",
			Name:          "2020-09-05",
			ParentID:      &id1,
			ShortID:       types.NewNanoid(),
			Tags: types.Tags{
				"cleaning",
				"cooking",
			},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           types.ColorBlue,
			ID:              id3,
			Icon:            "help_center",
			Name:            "How To",
			Tags: types.Tags{
				"informative",
				"instructions",
			},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           types.ColorBlue,
			ID:              id4,
			Icon:            "help_center",
			ParentID:        &id3,
			Name:            "Fix Dryer",
			ShortID:         types.NewNanoid(),
			Tags: types.Tags{
				"fix",
				"laundry",
			},
		},
	}

	seed.PlanProjects = PlanProjects{
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Color:         types.ColorPurple,
			ID:            id1,
			Icon:          "videogame_asset",
			Name:          "Entertainment",
			Position:      "0",
			Tags: types.Tags{
				"todo",
			},
		},
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Color:         types.ColorGreen,
			ID:            id2,
			Name:          "Reading",
			ParentID:      &id1,
			Position:      "0",
		},
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Color:         types.ColorRed,
			ID:            id3,
			Name:          "Books",
			ParentID:      &id2,
			Position:      "0:aaaa",
		},
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Color:         types.ColorGray,
			Name:          "Comics",
			ParentID:      &id2,
			Position:      "0:aaa",
		},
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			Color:         types.ColorYellow,
			ID:            id4,
			Name:          "Magazines",
			ParentID:      &id2,
			Position:      "0:aa",
		},
		{
			AuthHouseholdID:  &seed.AuthHouseholds[0].ID,
			ID:               id5,
			Icon:             "cleaning_services",
			BudgetCategoryID: &seed.BudgetCategories[1].ID,
			Color:            types.ColorBlue,
			Name:             "Cleaning",
			Position:         "1",
			Tags: types.Tags{
				"chores",
			},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           types.ColorGreen,
			ID:              id6,
			Name:            "Upstairs",
			ParentID:        &id5,
			Position:        "0",
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           types.ColorOrange,
			ID:              id7,
			Name:            "Kitchen",
			ParentID:        &id6,
			Position:        "0:aaaa",
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           types.ColorGray,
			Name:            "Bedroom",
			ParentID:        &id6,
			Position:        "0:aaa",
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           types.ColorRed,
			Name:            "Hallway",
			ParentID:        &id6,
			Position:        "0:aa",
		},
	}

	seed.PlanTasks = PlanTasks{
		{
			AuthAccountID: seed.PlanProjects[2].AuthAccountID,
			Color:         4,
			DueDate:       &tomorrowTime,
			Name:          "Idiots Guide to Homechart",
			Position:      "0",
			ShortID:       types.NewNanoid(),
			Tags: types.Tags{
				"book",
			},
			PlanProjectID: &seed.PlanProjects[2].ID,
		},
		{
			AuthAccountID: seed.PlanProjects[2].AuthAccountID,
			Color:         3,
			Details:       "Remember to scan favorites into Homechart!",
			Done:          true,
			DueDate:       &tomorrowTime,
			Name:          "Easy Crockpot Recipes",
			Position:      "0:aa",
			Tags: types.Tags{
				"book",
				"cooking",
			},
			PlanProjectID: &seed.PlanProjects[2].ID,
		},
		{
			AuthAccountID: seed.PlanProjects[4].AuthAccountID,
			Color:         2,
			DueDate:       &nextWeek,
			Duration:      60,
			Name:          "Finish removing old magazines",
			Position:      "0:aaaa",
			Tags: types.Tags{
				"book",
				"shopping",
			},
			PlanProjectID: &seed.PlanProjects[4].ID,
		},
		{
			AuthAccountID: seed.PlanProjects[2].AuthAccountID,
			Color:         3,
			DueDate:       &nextWeek,
			Duration:      20,
			Name:          "Walk the dog",
			Position:      "0",
			RecurOnDone:   true,
			Recurrence: &types.Recurrence{
				Separation: 1,
			},
			Tags: types.Tags{
				"walking",
			},
		},
		{
			Assignees: types.SliceString{
				seed.AuthAccounts[0].ID.String(),
				seed.AuthAccounts[1].ID.String(),
			},
			AuthAccountID:   &seed.AuthAccounts[0].ID,
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           2,
			Details:         "Kids need to help!",
			DueDate:         &tomorrowTime1,
			Duration:        120,
			ID:              id1,
			InventoryItemID: &seed.InventoryItems[3].ID,
			Name:            "Weekly cleaning",
			Position:        "0",
			Recurrence: &types.Recurrence{
				Separation: 1,
				Weekdays: []types.Weekday{
					types.Wednesday,
				},
			},
			Tags: types.Tags{
				"cleaning",
				"chores",
			},
			PlanProjectID: &seed.PlanProjects[7].ID,
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           3,
			DueDate:         &tomorrowTime2,
			Duration:        5,
			Name:            "Empty trash",
			Position:        "0",
			ParentID:        &id1,
			Tags: types.Tags{
				"kitchen",
				"cleaning",
				"chores",
			},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           4,
			Done:            true,
			DueDate:         &nextWeek,
			Duration:        25,
			Name:            "Clean out pantry",
			Position:        "0:aaaa",
			ParentID:        &id1,
			Tags: types.Tags{
				"kitchen",
				"cleaning",
				"chores",
			},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           2,
			DueDate:         &tomorrowTime3,
			Duration:        5,
			Name:            "Clean gargbage disposal",
			Position:        "0:aaa",
			ParentID:        &id1,
			Tags: types.Tags{
				"kitchen",
				"cleaning",
				"chores",
			},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Color:           3,
			DueDate:         &nextWeek,
			Duration:        240,
			Name:            "Clean the stove",
			Position:        "0:aa",
			ParentID:        &id1,
			Tags: types.Tags{
				"kitchen",
				"cleaning",
				"chores",
			},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[1].ID,
			DueDate:         &tomorrowTime,
			Name:            "Figure out Homechart",
			Position:        "0",
		},
	}

	seed.NotesPageVersions = NotesPageVersions{
		{
			Body:        "WIP",
			CreatedBy:   seed.AuthAccounts[0].ID,
			Updated:     yesterdayTime,
			NotesPageID: seed.NotesPages[0].ID,
		},
		{
			Body: `## Recent entries

#notespage/` + string(seed.NotesPages[1].ShortID),
			CreatedBy:   seed.AuthAccounts[0].ID,
			NotesPageID: seed.NotesPages[0].ID,
		},
		{
			Body: fmt.Sprintf(`Today I:

* Cooked #cookrecipe/%s
* Read #plantask/%s`, seed.CookRecipes[0].ShortID, seed.PlanTasks[0].ShortID),
			CreatedBy:   seed.AuthAccounts[0].ID,
			NotesPageID: seed.NotesPages[1].ID,
		},
		{
			Body:        "WIP",
			CreatedBy:   seed.AuthAccounts[0].ID,
			Updated:     yesterdayTime,
			NotesPageID: seed.NotesPages[2].ID,
		},
		{
			Body: fmt.Sprintf(`
## Appliances:
- #notespage/%s

## Chores
- Flush hot water heater (need to document!)
- Replace furnace filters`, seed.NotesPages[3].ShortID),
			CreatedBy:   seed.AuthAccounts[1].ID,
			NotesPageID: seed.NotesPages[2].ID,
		},
		{
			Body: `## If the Lights Are Off
- Check the circuit breaker
- Check the power cable

## If It Will Not Start
Call someone!
`,
			CreatedBy:   seed.AuthAccounts[1].ID,
			NotesPageID: seed.NotesPages[3].ID,
		},
	}

	seed.RewardCards = RewardCards{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Details:         "Do all of our chores",
			Name:            "Chores for Treats",
			Reward:          "Family ice cream treat",
			Senders: types.SliceString{
				seed.AuthAccounts[0].ID.String(),
			},
			StampCount: 2,
			StampGoal:  5,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Details:         "Get ready for school every day!",
			Name:            "On Time Tablet Time",
			Reward:          "30 minutes of tablet time",
			Recipients: types.SliceString{
				seed.AuthAccounts[2].ID.String(),
			},
			Senders: types.SliceString{
				seed.AuthAccounts[0].ID.String(),
				seed.AuthAccounts[1].ID.String(),
			},
			StampCount: 4,
			StampGoal:  5,
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			Invert:          true,
			Name:            "Anniversary Gift",
			Recipients: types.SliceString{
				seed.AuthAccounts[0].ID.String(),
			},
			Reward: "Here are five massages for you because you're an awesome wife!",
			Senders: types.SliceString{
				seed.AuthAccounts[1].ID.String(),
			},
			StampCount: 5,
			StampGoal:  5,
		},
	}

	akey1, _ := crypto.NewAESKey()
	key1Encrypt, _ := crypto.EncryptValue(seed.AuthAccounts[0].PublicKey, string(akey1))
	akey2, _ := crypto.NewAESKey()
	key2Encrypt, _ := crypto.EncryptValue(seed.AuthAccounts[0].PublicKey, string(akey2))
	akey3, _ := crypto.NewAESKey()
	key3Encrypt, _ := crypto.EncryptValue(seed.AuthAccounts[2].PublicKey, string(akey3))

	seed.SecretsVaults = SecretsVaults{
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			ID:            id1,
			Icon:          "person",
			Name:          "Jane's Vault",
			Keys: SecretsVaultKeys{
				{
					AuthAccountID: seed.AuthAccounts[0].ID,
					Key:           key1Encrypt,
				},
			},
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			ID:              id2,
			Icon:            "house",
			Name:            "Doe Family Vault",
			Keys: SecretsVaultKeys{
				{
					AuthAccountID: seed.AuthAccounts[0].ID,
					Key:           key2Encrypt,
				},
				{
					AuthAccountID: seed.AuthAccounts[2].ID,
					Key:           key3Encrypt,
				},
			},
		},
	}

	v1, _ := json.Marshal(map[string]string{ //nolint: errchkjson
		"Password": "jane",
		"Username": "jane",
		"URL":      "https://homechart.app",
	})
	v1Encrypt, _ := crypto.EncryptValue(akey1, string(v1))
	v1Name, _ := crypto.EncryptValue(akey1, "Homechart")
	v1Tags, _ := crypto.EncryptValue(akey1, `["jane", "app"]`)

	v2, _ := json.Marshal(map[string]string{ //nolint: errchkjson
		"Note": "The code is 112233, otherwise there is a key under a rock by her front door.",
	})
	v2Encrypt, _ := crypto.EncryptValue(akey1, string(v2))
	v2Name, _ := crypto.EncryptValue(akey1, "Mom's Garage Code")
	v2Tags, _ := crypto.EncryptValue(akey1, `["grandma", "garage"]`)

	v3, _ := json.Marshal(map[string]string{ //nolint: errchkjson
		"Password": "doefamily",
		"TOTP":     "JKKRNSYUWUXZ5ANER5QUJU6UZQ74TUZV",
		"Username": "doefamily",
		"URL":      "https://example.com",
	})
	v3Encrypt, _ := crypto.EncryptValue(akey2, string(v3))
	v3Name, _ := crypto.EncryptValue(akey2, "Local Credit Union")
	v3Tags, _ := crypto.EncryptValue(akey2, `["bank", "app"]`)

	v4, _ := json.Marshal(map[string]string{ //nolint: errchkjson
		"SSN": "xxx-yy-zzzz",
	})
	v4Encrypt, _ := crypto.EncryptValue(akey2, string(v4))
	v4Name, _ := crypto.EncryptValue(akey2, "Jennifer Doe")
	v4Tags, _ := crypto.EncryptValue(akey2, `["person", "id"]`)

	seed.SecretsValues = SecretsValues{
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			DataEncrypted: crypto.EncryptedValues{
				v1Encrypt,
			},
			NameEncrypted:  v1Name,
			SecretsVaultID: id1,
			TagsEncrypted:  v1Tags,
		},
		{
			AuthAccountID: &seed.AuthAccounts[0].ID,
			DataEncrypted: crypto.EncryptedValues{
				v2Encrypt,
			},
			NameEncrypted:  v2Name,
			SecretsVaultID: id1,
			TagsEncrypted:  v2Tags,
		},
		{
			AuthAccountID: &seed.AuthHouseholds[0].ID,
			DataEncrypted: crypto.EncryptedValues{
				v3Encrypt,
			},
			NameEncrypted:  v3Name,
			SecretsVaultID: id2,
			TagsEncrypted:  v3Tags,
		},
		{
			AuthAccountID: &seed.AuthHouseholds[0].ID,
			DataEncrypted: crypto.EncryptedValues{
				v4Encrypt,
			},
			NameEncrypted:  v4Name,
			SecretsVaultID: id2,
			TagsEncrypted:  v4Tags,
		},
	}

	seed.ShopCategories = ShopCategories{
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[0].ID,
			ID:              GenerateUUID(),
			Match:           "mushrooms|onions",
			Name:            "Organic",
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[1].ID,
			ID:              GenerateUUID(),
			Match:           "seed",
			Name:            "Landscaping",
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[0].ID,
			ID:              GenerateUUID(),
			Match:           "keyboard",
			Name:            "Electronics",
		},
		{
			AuthHouseholdID: seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[1].ID,
			ID:              GenerateUUID(),
			Match:           "broom",
			Name:            "Tools",
		},
	}

	seed.ShopLists = ShopLists{
		{
			AuthAccountID:    &seed.AuthAccounts[0].ID,
			BudgetCategoryID: &seed.BudgetCategories[2].ID,
			ID:               id1,
			Icon:             "redeem",
			Name:             "Gift Ideas for John",
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			ID:              id2,
			Icon:            "redeem",
			Name:            "Gift Ideas for Jennifer",
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			ID:              id3,
			Icon:            "redeem",
			Name:            "Gift Ideas for Grandma",
		},
	}

	seed.ShopItems = ShopItems{
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[0].ID,
			CookMealPlanID:  &seed.CookMealPlans[0].ID,
			CookRecipeID:    &seed.CookRecipes[0].ID,
			InCart:          false,
			Name:            types.StringLimit(strings.Split(seed.CookRecipes[0].Ingredients, "\n")[0]),
			Price:           100,
			ShopCategoryID:  &seed.ShopCategories[0].ID,
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[1].ID,
			InCart:          true,
			Name:            "Grass Seed",
			NextDate:        &today,
			Price:           40000,
			Recurrence: &types.Recurrence{
				Separation: 14,
			},
			ShopCategoryID: &seed.ShopCategories[1].ID,
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[0].ID,
			CookMealPlanID:  &seed.CookMealPlans[4].ID,
			CookRecipeID:    &seed.CookRecipes[2].ID,
			InCart:          false,
			Name:            types.StringLimit(strings.Split(seed.CookRecipes[2].Ingredients, "\n")[0]),
			Price:           300,
			ShopCategoryID:  &seed.ShopCategories[0].ID,
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[1].ID,
			InCart:          true,
			Name:            "Mechanical keyboard",
			Price:           18000,
			ShopCategoryID:  &seed.ShopCategories[2].ID,
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			BudgetPayeeID:   &seed.BudgetPayees[0].ID,
			InCart:          true,
			Name:            "Broom",
			PlanProjectID:   &seed.PlanProjects[5].ID,
			Price:           1200,
			ShopCategoryID:  &seed.ShopCategories[3].ID,
		},
		{
			AuthAccountID:  &seed.AuthAccounts[0].ID,
			BudgetPayeeID:  &seed.BudgetPayees[1].ID,
			InCart:         true,
			Name:           "Reading Light",
			PlanProjectID:  &seed.PlanProjects[4].ID,
			ShopCategoryID: &seed.ShopCategories[3].ID,
		},
		{
			AuthAccountID:  &seed.AuthAccounts[0].ID,
			BudgetPayeeID:  &seed.BudgetPayees[1].ID,
			Name:           "Circular Saw",
			Price:          20000,
			ShopCategoryID: &seed.ShopCategories[3].ID,
			ShopListID:     &seed.ShopLists[0].ID,
		},
		{
			AuthHouseholdID: &seed.AuthHouseholds[0].ID,
			Name:            "Picture of the family",
			ShopListID:      &seed.ShopLists[2].ID,
		},
	}

	if err := seed.Restore(ctx, true); err != nil {
		return nil, logger.Log(ctx, err)
	}

	for i := range seed.AuthAccounts {
		if err := seed.AuthAccounts[i].Read(ctx); err != nil {
			return nil, logger.Log(ctx, err)
		}
	}

	for i := range seed.AuthHouseholds {
		if err := seed.AuthHouseholds[i].Read(ctx); err != nil {
			return nil, logger.Log(ctx, err)
		}
	}

	p := PermissionsOpts{
		AuthAccountID:          &seed.AuthAccounts[0].ID,
		AuthAccountPermissions: &Permissions{},
		AuthHouseholdsPermissions: &AuthHouseholdsPermissions{
			{
				AuthHouseholdID: seed.AuthHouseholds[0].ID,
			},
		},
	}

	for i := range seed.AuthSessions {
		if err := seed.AuthSessions[i].Read(ctx, false); err != nil {
			return nil, logger.Log(ctx, err)
		}
	}

	// Need to read in everything to grab changes and init data
	seed.Bookmarks = Bookmarks{}
	if _, _, err := ReadAll(ctx, &seed.Bookmarks, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.BudgetAccounts = BudgetAccounts{}
	if _, _, err := ReadAll(ctx, &seed.BudgetAccounts, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.BudgetCategories = BudgetCategories{}
	if _, _, err := ReadAll(ctx, &seed.BudgetCategories, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.BudgetPayees = BudgetPayees{}
	if _, _, err := ReadAll(ctx, &seed.BudgetPayees, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	month := BudgetMonth{
		AuthHouseholdID: seed.AuthHouseholds[0].ID,
		YearMonth:       today.YearMonth(),
	}
	if err := month.Read(ctx); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.BudgetMonths = BudgetMonths{
		month,
	}

	seed.CookMealTimes = CookMealTimes{}
	if _, _, err := ReadAll(ctx, &seed.CookMealTimes, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.CookRecipes = CookRecipes{}
	if _, _, err := ReadAll(ctx, &seed.CookRecipes, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.HealthItems = HealthItems{}
	if _, _, err := ReadAll(ctx, &seed.HealthItems, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.HealthLogs = HealthLogs{}
	if _, _, err := ReadAll(ctx, &seed.HealthLogs, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.InventoryCollections = InventoryCollections{}
	if _, _, err := ReadAll(ctx, &seed.InventoryCollections, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.NotesPages = NotesPages{}
	if _, _, err := ReadAll(ctx, &seed.NotesPages, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.NotesPageVersions = NotesPageVersions{}
	if _, _, err := ReadAll(ctx, &seed.NotesPageVersions, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.PlanProjects = PlanProjects{}
	if _, _, err := ReadAll(ctx, &seed.PlanProjects, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.PlanTasks = PlanTasks{}
	if _, _, err := ReadAll(ctx, &seed.PlanTasks, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.RewardCards = RewardCards{}
	if _, _, err := ReadAll(ctx, &seed.RewardCards, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.ShopCategories = ShopCategories{}
	if _, _, err := ReadAll(ctx, &seed.ShopCategories, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.ShopItems = ShopItems{}
	if _, _, err := ReadAll(ctx, &seed.ShopItems, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	seed.ShopLists = ShopLists{}
	if _, _, err := ReadAll(ctx, &seed.ShopLists, ReadAllOpts{
		PermissionsOpts: p,
	}); err != nil {
		return nil, logger.Log(ctx, err)
	}

	return seed, logger.Log(ctx, nil)
}
