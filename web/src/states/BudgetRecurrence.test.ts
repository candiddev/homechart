import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import { Recurrence } from "@lib/types/Recurrence";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { BudgetAccountState } from "./BudgetAccount";
import { BudgetPayeeState } from "./BudgetPayee";
import { BudgetRecurrenceState } from "./BudgetRecurrence";
import { CalendarEventState } from "./CalendarEvent";

describe("BudgetRecurrenceState", () => {
  test("data", () => {
    BudgetRecurrenceState.data(seed.budgetRecurrences);
    BudgetRecurrenceState.data([]);
  });

  test("findBudgetAccountID", () => {
    BudgetRecurrenceState.data(seed.budgetRecurrences);

    expect(
      BudgetRecurrenceState.findBudgetAccountID(
        BudgetRecurrenceState.data(),
        seed.budgetRecurrences[0].budgetAccountID,
      ),
    ).toHaveLength(2);
  });

  test("findBudgetAccountIDToday", () => {
    const future = Timestamp.now();
    future.addDays(1);

    BudgetRecurrenceState.data([
      ...seed.budgetRecurrences,
      {
        ...seed.budgetRecurrences[0],
        ...{
          id: "1",
          template: {
            ...seed.budgetRecurrences[0].template,
            ...{
              date: future.toCivilDate().toJSON(),
            },
          },
        },
      },
    ]);

    expect(
      BudgetRecurrenceState.findBudgetAccountIDToday(
        seed.budgetRecurrences[0].budgetAccountID,
      ),
    ).toBe(2);
  });

  test("findDateRange", () => {
    const from = Timestamp.now();
    from.addDays(-2);
    const to = Timestamp.now();
    to.addDays(2);
    BudgetAccountState.data(seed.budgetAccounts);
    BudgetRecurrenceState.data(seed.budgetRecurrences);

    expect(
      BudgetRecurrenceState.findDateRange(
        from.toCivilDate(),
        to.toCivilDate(),
      )(),
    ).toStrictEqual(
      CalendarEventState.toCalendarEventsRange(
        seed.budgetRecurrences.map((recurrence) => {
          const d = CivilDate.fromString(recurrence.template.date);

          return {
            ...CalendarEventState.new(),
            ...{
              authHouseholdID: seed.authHouseholds[0].id,
              budgetRecurrence: recurrence,
              civilDates: Recurrence.findCivilDates(
                recurrence.recurrence,
                Timestamp.fromCivilDate(
                  CivilDate.fromString(seed.budgetRecurrences[0].template.date),
                ),
                from.toCivilDate(),
                to.toCivilDate(),
                [],
                null,
              ),
              color: "teal",
              details: `#budgetaccount/${BudgetAccountState.findID(recurrence.budgetAccountID).shortID}`,
              duration: 0,
              icon: Icons.BudgetTransaction,
              name: `${recurrence.template.amount > 0 ? "Deposit" : "Pay"} ${
                BudgetPayeeState.findID(recurrence.template.budgetPayeeID).name
              }`,
              timeStart: "00:00",
              timestampEnd: Timestamp.fromCivilDate(d).toString(),
              timestampStart: Timestamp.fromCivilDate(d).toString(),
            },
          };
        }),
        from.toCivilDate(),
        to.toCivilDate(),
      ),
    );
  });
});
