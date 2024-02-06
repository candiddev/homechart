import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { ColorEnum } from "@lib/types/Color";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { CalendarEventState } from "../states/CalendarEvent";
import { CookMealTimeState } from "../states/CookMealTime";
import { CookRecipeState } from "../states/CookRecipe";
import { GlobalState } from "../states/Global";
import { HealthItemState } from "../states/HealthItem";
import { HealthLogState } from "../states/HealthLog";
import { PermissionComponentsEnum } from "../types/Permission";
import type { CalendarDayAttrs } from "./CalendarDay";
import { CalendarDay } from "./CalendarDay";

test("CalendarDay", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  CookMealTimeState.data(seed.cookMealTimes);
  CookRecipeState.data(seed.cookRecipes);
  HealthItemState.data(seed.healthItems);
  HealthLogState.data(seed.healthLogs);

  const now = Timestamp.now();
  const e1 = Timestamp.now();
  e1.timestamp.setHours(22);
  e1.timestamp.setMinutes(0);
  const e2 = Timestamp.now();
  e2.timestamp.setHours(11);
  e2.timestamp.setMinutes(40);
  const e3 = Timestamp.now();
  e3.timestamp.setHours(7);
  e3.timestamp.setMinutes(45);
  const e4 = Timestamp.now();
  e4.timestamp.setHours(10);
  e4.timestamp.setMinutes(0);
  const e5 = Timestamp.now();
  e5.timestamp.setHours(22);
  e5.timestamp.setMinutes(0);
  const e6 = Timestamp.now();
  e6.addDays(-1);
  e6.timestamp.setHours(7);
  const e7 = Timestamp.now();
  e7.addDays(1);
  e7.timestamp.setHours(6);

  const events = [
    {
      ...CalendarEventState.new(),
      ...{
        authAccountID: seed.authAccounts[0].id,
        authHouseholdID: null,
        duration: 24 * 60,
        name: "Birthday",
        timeStart: "00:00",
        timestampStart: e3.toString(),
      },
    },
    {
      ...CalendarEventState.new(),
      ...{
        authAccountID: seed.authAccounts[0].id,
        authHouseholdID: null,
        duration: 47,
        name: "Out of Town",
        timeStart: "07:00",
        timestampEnd: e6.toString(),
        timestampStart: e6.toString(),
      },
    },
    {
      ...CalendarEventState.new(),
      ...{
        authHouseholdID: "1",
        budgetRecurrence: seed.budgetRecurrences[0],
        duration: 0,
        icon: "attach_money",
        name: "Deposit Janes General Store",
        timeStart: "00:00",
        timestampStart: e3.toString(),
      },
    },
    {
      ...CalendarEventState.new(),
      ...{
        authHouseholdID: seed.authHouseholds[0].id,
        color: Object.keys(ColorEnum)[2],
        duration: 30,
        name: "Drop kids off",
        participants: [seed.authAccounts[0].id],
        timeStart: "08:00",
        timestampStart: e3.toString(),
        travelTime: 15,
      },
    },
    {
      ...CalendarEventState.new(),
      ...{
        authAccountID: seed.authAccounts[0].id,
        authHouseholdID: null,
        duration: 30,
        icon: "check",
        name: "Clean the house",
        planTask: seed.planTasks[0],
        timeStart: "10:00",
        timestampStart: e4.toString(),
      },
    },
    {
      ...CalendarEventState.new(),
      ...{
        authAccountID: seed.authAccounts[0].id,
        authHouseholdID: null,
        color: Object.keys(ColorEnum)[4],
        cookMealPlans: [seed.cookMealPlans[0]],
        duration: 30,
        icon: "local_dining",
        name: "Lunch",
        timeStart: "12:00",
        timestampStart: e2.toString(),
        travelTime: 20,
      },
    },
    {
      ...CalendarEventState.new(),
      ...{
        authAccountID: seed.authAccounts[0].id,
        authHouseholdID: null,
        duration: 8 * 60,
        name: "Vacation",
        timeStart: "22:00",
        timestampStart: e5.toString(),
      },
    },
    {
      ...CalendarEventState.new(),
      ...{
        authAccountID: seed.authAccounts[0].id,
        authHouseholdID: null,
        details: "Something small!",
        duration: 60,
        name: "Nightime snack",
        timeStart: "22:00",
        timestampStart: e1.toString(),
      },
    },
    {
      ...CalendarEventState.new(),
      ...{
        authAccountID: seed.authAccounts[0].id,
        duration: 0,
        healthLogInputs: [HealthLogState.data()[0]],
        healthLogOutputs: [HealthLogState.data()[1]],
        icon: Icons.Health,
        name: "Health Logs",
        participants: [seed.authAccounts[0].id],
        timestampEnd: e3.toString(),
        timestampStart: e3.toString(),
      },
    },
  ];

  const picker = CivilDate.now().toYearMonth();

  const attrs = {
    date: now.toCivilDate(),
    dropdownItems: [
      {
        icon: Icons.Calendar,
        onclick: (): void => {},
        permitted: GlobalState.permitted(
          PermissionComponentsEnum.Calendar,
          true,
        ),
        requireOnline: true,
      },
    ],
    events: events,
    loaded: true,
    picker: picker,
  } as CalendarDayAttrs;

  testing.mount(CalendarDay, attrs);

  testing.text(".CalendarDay__date", `${Timestamp.now().toCivilDate().day}add`);

  // Test items
  const items = testing.findAll(".CalendarDayEvent__item", 9);

  // Test name
  /* eslint-disable no-restricted-syntax */
  testing.text(
    items[0].getElementsByTagName("span")[0],
    "calendar_monthBirthday",
  );
  testing.text(
    items[1].getElementsByTagName("span")[0],
    "calendar_monthOut of Town",
  );
  testing.text(
    items[2].getElementsByTagName("span")[0],
    "attach_moneyDeposit Janes General Store",
  );
  testing.text(
    items[3].getElementsByTagName("span")[0],
    "calendar_monthDrop kids off8:00 AM - 8:30 AM",
  );
  testing.text(
    items[4].getElementsByTagName("span")[0],
    "checkClean the house10:00 AM - 10:30 AM",
  );
  testing.text(
    items[5].getElementsByTagName("span")[0],
    "local_diningLunch12:00 PM - 12:30 PM",
  );
  testing.text(
    items[6].getElementsByTagName("span")[0],
    "calendar_monthVacation10:00 PM - 12:00 AM",
  );
  testing.text(
    items[7].getElementsByTagName("span")[0],
    "calendar_monthNightime snack10:00 PM - 11:00 PM",
  );

  // Test time
  testing.text(
    items[3].getElementsByTagName("p")[1],
    `person${seed.authAccounts[0].name}`,
  );
  testing.text(
    items[3].getElementsByTagName("p")[2],
    "warningLeave by 7:45 AM",
  );
  testing.text(
    items[5].getElementsByTagName("p")[1],
    "warningLeave by 11:40 AM",
  );

  // Test details
  testing.text(
    items[5].getElementsByClassName("CalendarDayEvent__extra")[0],
    "local_diningPaninis",
  );
  testing.text(
    items[7].getElementsByClassName("CalendarDayEvent__details")[0],
    "Something small!",
  );
  testing.text(
    items[8].getElementsByClassName("CalendarDayEvent__extra")[0],
    "lunch_diningPineapple",
  );

  /// Test forms
  testing.click(items[0].getElementsByTagName("span")[0]);
  expect(AppState.getLayoutAppForm().data).toStrictEqual(events[0]);
  testing.click(items[4].getElementsByTagName("span")[0]);
  expect(AppState.getLayoutAppForm().data).toStrictEqual(seed.planTasks[0]);
  testing.click(
    items[5].getElementsByClassName(
      "CalendarDayEvent__extra",
    )[0] as HTMLElement,
  );
  expect(AppState.getLayoutAppForm().data).toStrictEqual(seed.cookMealPlans[0]);
  testing.click(items[8].getElementsByTagName("span")[0]);
  expect(AppState.getLayoutAppForm().data.logs).toStrictEqual([
    seed.healthLogs[0],
    seed.healthLogs[1],
  ]);
});
