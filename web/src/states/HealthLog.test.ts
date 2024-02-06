import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { CalendarEventState } from "./CalendarEvent";
import { HealthItemState } from "./HealthItem";
import { HealthLogState } from "./HealthLog";

describe("HealthLogState", () => {
  test("data", () => {
    HealthLogState.data(seed.healthLogs);
    HealthLogState.data([]);
  });

  test("findAuthAccountID", () => {
    const data = [
      {
        ...HealthLogState.new(),
        ...{
          authAccountID: "1",
        },
      },
      {
        ...HealthLogState.new(),
        ...{
          authAccountID: "1",
        },
      },
      {
        ...HealthLogState.new(),
        ...{
          authAccountID: "2",
        },
      },
    ];

    HealthLogState.data(data);

    expect(HealthLogState.findAuthAccountID("1")()).toHaveLength(2);
    expect(HealthLogState.findAuthAccountID("2")()).toHaveLength(1);
  });

  test("findDateRange", async () => {
    const today = Timestamp.fromCivilDate(CivilDate.now());
    const tomorrow = Timestamp.fromCivilDate(CivilDate.now());
    tomorrow.addDays(1);

    HealthItemState.data([
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "1",
          id: "1",
          name: "a",
        },
      },
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "1",
          id: "2",
          name: "b",
          output: true,
        },
      },
      {
        ...HealthItemState.new(),
        ...{
          authAccountID: "2",
          id: "3",
          name: "a",
        },
      },
    ]);

    HealthLogState.data([
      {
        ...HealthLogState.new(),
        ...{
          authAccountID: "1",
          date: today.toCivilDate().toJSON(),
          healthItemID: "1",
          id: "1",
        },
      },
      {
        ...HealthLogState.new(),
        ...{
          authAccountID: "1",
          date: today.toCivilDate().toJSON(),
          healthItemID: "2",
          id: "2",
        },
      },
      {
        ...HealthLogState.new(),
        ...{
          authAccountID: "1",
          date: tomorrow.toCivilDate().toJSON(),
          healthItemID: "1",
          id: "3",
        },
      },
      {
        ...HealthLogState.new(),
        ...{
          authAccountID: "1",
          date: tomorrow.toCivilDate().toJSON(),
          healthItemID: "2",
          id: "4",
        },
      },
      {
        ...HealthLogState.new(),
        ...{
          authAccountID: "2",
          date: today.toCivilDate().toJSON(),
          healthItemID: "1",
          id: "5",
        },
      },
    ]);

    expect(
      HealthLogState.findDateRange(today.toCivilDate(), today.toCivilDate())(),
    ).toStrictEqual(
      CalendarEventState.toCalendarEventsRange(
        [
          {
            ...CalendarEventState.new(),
            ...{
              authAccountID: "1",
              color: "indigo",
              duration: 0,
              healthLogInputs: [HealthLogState.data()[0]],
              healthLogOutputs: [HealthLogState.data()[1]],
              icon: Icons.Health,
              name: "Health Logs",
              participants: ["1"],
              timestampEnd: today.toString(),
              timestampStart: today.toString(),
            },
          },
          {
            ...CalendarEventState.new(),
            ...{
              authAccountID: "2",
              color: "indigo",
              duration: 0,
              healthLogInputs: [HealthLogState.data()[4]],
              healthLogOutputs: [],
              icon: Icons.Health,
              name: "Health Logs",
              participants: ["2"],
              timestampEnd: today.toString(),
              timestampStart: today.toString(),
            },
          },
        ],
        today.toCivilDate(),
        today.toCivilDate(),
      ),
    );
  });
});
