import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Timestamp } from "@lib/types/Timestamp";
import { Weekday, WeekdayEnum } from "@lib/types/Weekday";
import { StringToID } from "@lib/utilities/StringToID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetRecurrenceState } from "../states/BudgetRecurrence";
import { CalendarEventState } from "../states/CalendarEvent";
import { CalendarICalendarState } from "../states/CalendarICalendar";
import { CookMealPlanState } from "../states/CookMealPlan";
import { CookMealTimeState } from "../states/CookMealTime";
import { HealthItemState } from "../states/HealthItem";
import { HealthLogState } from "../states/HealthLog";
import { PlanTaskState } from "../states/PlanTask";
import { ShopCategoryState } from "../states/ShopCategory";
import { Calendar } from "./Calendar";

describe("Calendar", () => {
  const now = Timestamp.now();

  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  BudgetRecurrenceState.data([
    {
      ...seed.budgetRecurrences[0],
      ...{
        template: {
          ...seed.budgetRecurrences[0].template,
          ...{
            date: now.toCivilDate().toJSON(),
          },
        },
      },
    },
  ]);
  CalendarEventState.data(seed.calendarEvents);
  CalendarICalendarState.data(seed.calendarICalendars);
  CookMealPlanState.data([
    {
      ...seed.cookMealPlans[0],
      ...{
        date: now.toCivilDate().toJSON(),
      },
    },
  ]);
  CookMealTimeState.data(seed.cookMealTimes);
  HealthItemState.data(seed.healthItems);
  HealthLogState.data(seed.healthLogs);
  PlanTaskState.data([
    {
      ...seed.planTasks[0],
      ...{
        dueDate: now.toCivilDate().toJSON(),
      },
    },
  ]);
  ShopCategoryState.data(seed.shopCategories);

  test("picker", async () => {
    testing.mount(Calendar);

    const title = testing.find("#picker-title");
    testing.value(
      `#${title.id} input`,
      now.toCivilDate().toYearMonth().toValue(),
    );

    testing.text(
      testing.findAll("#picker .Calendar__date--day")[
        now.getWeekday() === WeekdayEnum.Sunday ? 0 : now.getWeekday()
      ],
      Weekday.values[now.getWeekday()][0],
    );
    let range = now.toCivilDateRangeCalendar(false);
    testing.text(
      testing.findAll("#picker .Calendar__date--active")[
        now.getWeekday() === WeekdayEnum.Sunday ? 0 : now.getWeekday()
      ],
      `${now.toCivilDate().day}•••••`,
    );
    if (range.to.day !== now.toCivilDate().day) {
      testing.text(
        testing.find("#picker").lastChild as Element,
        `${range.to.day}•`,
      );
    }

    const date = Timestamp.fromCivilDate(CivilDate.fromString("2020-01-01"));
    testing.input("#picker-title input", "2020-01");
    testing.value(
      "#picker-title input",
      date.toCivilDate().toYearMonth().toValue(),
    );
    await testing.sleep(100);
    range = date.toCivilDateRangeCalendar(false);
    testing.text("#picker a", `${range.from.day}`);
    testing.text(
      testing.find("#picker").lastChild as Element,
      `${range.to.day}`,
    );
  });

  test("current date", async () => {
    testing.mount(Calendar);
    const range = now.getWeekStart(false);
    const previous = Timestamp.fromString(range.toString());
    previous.addDays(-1);
    const next = Timestamp.fromString(range.toString());
    next.addDays(7);

    testing.title("Calendar");
    testing.find(
      `#button${StringToID(AppState.formatCivilDate(previous.toCivilDate()))}`,
    );
    testing.find(
      `#button${StringToID(AppState.formatCivilDate(next.toCivilDate()))}`,
    );
    testing.findAll(".CalendarDay__items", 7);

    testing.mocks.params = {
      display: "day",
    };
    testing.mount(Calendar);
    testing.findAll(".CalendarDay__items", 1);

    testing.mocks.params = {
      display: "month",
    };
    testing.mount(Calendar);
    const month = now.toCivilDateRangeCalendar(false);
    testing.findAll(
      ".CalendarDay__items",
      Timestamp.getCivilDatesFromDateRange(month).length,
    );
  });

  test("next date", async () => {
    const date = now.getWeekStart(false);

    testing.mocks.route = `/calendar?display=week&from=${date.toCivilDateWeekFrom(false)}`;
    testing.mocks.params = {
      display: "week",
      from: date.toCivilDateRangeWeek(false).from.toJSON(),
    };

    testing.mount(Calendar);
    testing.title("Calendar");
  });

  test("previous date", async () => {
    const date = now.getWeekStart(false);

    testing.mocks.route = `/calendar?display=week&from=${date.toCivilDateWeekFrom(true)}`;
    testing.mocks.params = {
      display: "week",
      from: date.toCivilDateRangeWeek(true).from.toJSON(),
    };
    date.addDays(1);

    testing.mount(Calendar);
    testing.title("Calendar");
  });

  test("icalendar", async () => {
    testing.mount(Calendar);

    testing.click("#button-import-calendars");
    testing.find("#form-import-calendars");
    testing.click(
      `#table-icalendars-row_${CalendarICalendarState.data()[0].id}`,
    );
    testing.find("#form-update-icalendar-feed");
    testing.value("#form-item-input-name", "Work Calendar");
  });
});
