import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Recurrence } from "@lib/types/Recurrence";
import { Timestamp } from "@lib/types/Timestamp";
import { Clone } from "@lib/utilities/Clone";
import { FilterSortChildren } from "@lib/utilities/FilterSortChildren";

import seed from "../jest/seed";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { CalendarEventState } from "./CalendarEvent";
import { PlanTaskState, PlanTaskTemplateType } from "./PlanTask";

describe("PlanTaskState", () => {
  const timestamp = Timestamp.now();
  const today = Timestamp.fromString(timestamp.toString());
  timestamp.addDays(-1);
  const yesterday = Timestamp.fromString(timestamp.toString());
  timestamp.addDays(2);
  const tomorrow = Timestamp.fromString(timestamp.toString());

  AuthAccountState.data().id = "0";
  AuthHouseholdState.data([
    {
      ...AuthHouseholdState.new(),
      ...{
        id: "0",
      },
    },
  ]);

  PlanTaskState.data.map((data) => {
    PlanTaskState.nested(
      FilterSortChildren({
        input: Clone(data),
      }),
    );
  });

  test("data", () => {
    PlanTaskState.data(seed.planTasks);
    PlanTaskState.data([]);
  });

  test("household", () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "0",
          authHouseholdID: null,
          id: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authHouseholdID: "0",
          id: "1",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "0",
          authHouseholdID: "0",
          id: "2",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authHouseholdID: "0",
          id: "3",
          template: true,
        },
      },
    ];
    PlanTaskState.data(data);

    expect(PlanTaskState.household()).toStrictEqual([
      {
        ...data[1],
        ...{
          children: [],
        },
      },
      {
        ...data[2],
        ...{
          children: [],
        },
      },
    ]);
  });

  test("personal", () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "0",
          authHouseholdID: null,
          id: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authHouseholdID: "0",
          id: "1",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "0",
          authHouseholdID: "0",
          id: "2",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authHouseholdID: "0",
          id: "3",
          template: true,
        },
      },
    ];
    PlanTaskState.data(data);

    expect(PlanTaskState.personal()).toStrictEqual([
      {
        ...data[0],
        ...{
          children: [],
        },
      },
    ]);
  });

  test("copy", async () => {
    const oldDueDate = Timestamp.now();
    const newDueDate = Timestamp.now();
    newDueDate.addDays(1);

    PlanTaskState.loading = 1;
    PlanTaskState.set([
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: oldDueDate.toString(),
          shortID: "1",
        },
      },
    ]);

    const task = {
      ...PlanTaskState.new(),
      ...{
        authAccountID: "1",
        authHouseholdID: "1",
        children: [
          {
            ...PlanTaskState.new(),
            ...{
              children: [
                {
                  ...PlanTaskState.new(),
                  ...{
                    id: "3",
                    name: "c",
                  },
                },
              ],
              dueDate: oldDueDate.toString(),
              id: "2",
              name: "b",
            },
          },
        ],
        dueDate: newDueDate.toString(),
        id: "1",
        name: "a",
        planProjectID: "1",
        shortID: "1",
      },
    };

    testing.mocks.responses = [
      {
        dataType: "PlanTask",
        dataValue: [
          {
            ...task,
            ...{
              children: undefined,
              id: "1a",
            },
          },
        ],
      },
      {
        dataType: "PlanTask",
        dataValue: [
          {
            ...task,
            ...{
              children: undefined,
              id: "2a",
            },
          },
        ],
      },
      {
        dataType: "PlanTask",
        dataValue: [
          {
            ...task,
            ...{
              children: undefined,
              id: "3a",
            },
          },
        ],
      },
    ];

    await PlanTaskState.create(Clone(task));

    testing.requests([
      {
        body: {
          ...task,
          ...{
            children: undefined,
            id: null,
            shortID: "",
          },
        },
        method: "POST",
        path: "/api/v1/plan/tasks",
      },
      {
        body: {
          ...task.children[0],
          ...{
            authAccountID: null,
            authHouseholdID: "1",
            children: undefined,
            dueDate: newDueDate.toString(),
            id: null,
            parentID: "1a",
            planProjectID: "1",
          },
        },
        method: "POST",
        path: "/api/v1/plan/tasks",
      },
      {
        body: {
          ...task.children[0].children[0],
          ...{
            authAccountID: null,
            authHouseholdID: "1",
            children: undefined,
            id: null,
            parentID: "2a",
            planProjectID: "1",
          },
        },
        method: "POST",
        path: "/api/v1/plan/tasks",
      },
    ]);

    AppState.data.layoutAppAlerts = [];
  });

  test("dueDatePast", () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          children: [],
          dueDate: yesterday.toString(),
          id: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          children: [],
          dueDate: today.toString(),
          id: "1",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          children: [],
          dueDate: tomorrow.toString(),
          id: "2",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          children: [],
          dueDate: yesterday.toString(),
          id: "4",
          parentID: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          children: [],
          dueDate: yesterday.toString(),
          id: "5",
          template: true,
        },
      },
    ];
    PlanTaskState.data(data);

    expect(PlanTaskState.dueDatePast()).toStrictEqual([
      {
        ...data[0],
        ...{
          children: [data[3]],
        },
      },
      data[3],
    ]);
  });

  test("findAdjacent", () => {
    PlanTaskState.data(seed.planTasks);
    expect(PlanTaskState.findAdjacent(seed.planTasks[1])).toStrictEqual([
      seed.planTasks[0],
      seed.planTasks[1],
    ]);
    expect(PlanTaskState.findAdjacent(seed.planTasks[5])).toStrictEqual([
      seed.planTasks[5],
      seed.planTasks[6],
      seed.planTasks[7],
      seed.planTasks[8],
    ]);
  });

  test("findDateRange", async () => {
    const from = Timestamp.now();
    from.addDays(-2);
    const to = Timestamp.now();
    to.addDays(2);
    const midnight = Timestamp.midnight();
    const nextWeek = Timestamp.now();
    nextWeek.addDays(3);

    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "1",
          authHouseholdID: null,
          color: "blue",
          dueDate: from.toString(),
          name: "test 1",
          shortID: "1",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "1",
          authHouseholdID: "1",
          dueDate: midnight.toString(),
          name: "test 2",
          recurrence: {
            ...Recurrence.new(),
            ...{
              separation: 1,
            },
          },
          shortID: "2",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "1",
          authHouseholdID: null,
          dueDate: to.toString(),
          name: "test 3",
          shortID: "3",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "1",
          authHouseholdID: null,
          name: "test 4",
          shortID: "4",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "1",
          authHouseholdID: null,
          dueDate: nextWeek.toString(),
          name: "test 5",
          shortID: "5",
        },
      },
    ];

    PlanTaskState.data(data);

    expect(
      PlanTaskState.findDateRange(from.toCivilDate(), to.toCivilDate())(),
    ).toStrictEqual(
      CalendarEventState.toCalendarEventsRange(
        [
          {
            ...CalendarEventState.new(),
            ...{
              authAccountID: "1",
              authHouseholdID: null,
              color: "blue",
              details: "[icon@label Personal](/tasks?filter=personal)",
              duration: 30,
              icon: "done_all",
              name: data[0].name,
              planTask: data[0],
              timeStart: from.toCivilTime().toString(true),
              timestampEnd: from.toString(),
              timestampStart: from.toString(),
            },
          },
          {
            ...CalendarEventState.new(),
            ...{
              authAccountID: "1",
              authHouseholdID: "1",
              color: "blue",
              details: "[icon@label Household](/tasks?filter=household)",
              duration: 0,
              icon: "done_all",
              name: data[1].name,
              participants: ["1"],
              planTask: data[1],
              recurrence: data[1].recurrence,
              timeStart: midnight.toCivilTime().toString(true),
              timestampEnd: midnight.toString(),
              timestampStart: midnight.toString(),
            },
          },
          {
            ...CalendarEventState.new(),
            ...{
              authAccountID: "1",
              authHouseholdID: null,
              color: "blue",
              details: "[icon@label Personal](/tasks?filter=personal)",
              duration: 30,
              icon: "done_all",
              name: data[2].name,
              planTask: data[2],
              timeStart: to.toCivilTime().toString(true),
              timestampEnd: to.toString(),
              timestampStart: to.toString(),
            },
          },
        ],
        from.toCivilDate(),
        to.toCivilDate(),
      ),
    );
  });

  test("findDueDate", () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: yesterday.toString(),
          id: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: today.toString(),
          id: "1",
          parentID: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: today.toString(),
          id: "2",
          parentID: "0",
          priority: 5,
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: tomorrow.toString(),
          id: "3",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "wrongID",
          dueDate: yesterday.toString(),
          id: "4",
        },
      },
    ];
    PlanTaskState.data(data);

    expect(
      PlanTaskState.findDueDate(yesterday.toCivilDate().toJSON()),
    ).toStrictEqual([
      {
        ...data[0],
        ...{
          children: [
            {
              ...data[2],
              ...{
                children: [],
              },
            },
            {
              ...data[1],
              ...{
                children: [],
              },
            },
          ],
        },
      },
    ]);
    expect(
      PlanTaskState.findDueDate(today.toCivilDate().toJSON()),
    ).toStrictEqual([
      {
        ...data[2],
        ...{
          children: [],
        },
      },
      {
        ...data[1],
        ...{
          children: [],
        },
      },
    ]);
    expect(
      PlanTaskState.findDueDate(tomorrow.toCivilDate().toJSON()),
    ).toStrictEqual([
      {
        ...data[3],
        ...{
          children: [],
        },
      },
    ]);
  });

  test("findParentIDProjectID", () => {
    PlanTaskState.data([
      {
        ...PlanTaskState.new(),
        ...{
          id: "0",
          planProjectID: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          id: "1",
          planProjectID: "1",
        },
      },
    ]);

    expect(PlanTaskState.findParentIDProjectID("0")).toBe("0");
  });

  test("findPlanProjectID", () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          id: "0",
          planProjectID: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          id: "1",
          parentID: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          id: "2",
          parentID: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          id: "3",
          planProjectID: "1",
        },
      },
    ];
    PlanTaskState.data(data);

    expect(PlanTaskState.findPlanProjectID("0")).toStrictEqual([
      {
        ...data[0],
        ...{
          children: [
            {
              ...data[2],
              ...{
                children: [],
              },
            },
            {
              ...data[1],
              children: [],
            },
          ],
        },
      },
    ]);

    expect(PlanTaskState.findPlanProjectID(null)).toStrictEqual([]);
  });

  test("findInventoryItemID", () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          id: "0",
          inventoryItemID: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          id: "1",
          inventoryItemID: "1",
        },
      },
    ];
    PlanTaskState.data(data);

    expect(PlanTaskState.findInventoryItemID("0")).toStrictEqual([data[0]]);

    expect(PlanTaskState.findPlanProjectID(null)).toStrictEqual([]);
  });

  test("findTag", () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: tomorrow.toString(),
          id: "0",
          tags: ["a", "b"],
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: yesterday.toString(),
          id: "1",
          tags: ["b", "c"],
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          id: "2",
          tags: ["c", "a"],
        },
      },
    ];
    PlanTaskState.data(data);

    expect(PlanTaskState.findTag("b")).toStrictEqual([data[1], data[0]]);
  });

  test("findTemplates", () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          authHouseholdID: null,
          id: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "0",
          authHouseholdID: null,
          id: "1",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authHouseholdID: "0",
          id: "2",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: null,
          authHouseholdID: null,
          id: "3",
          template: true,
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "0",
          authHouseholdID: null,
          id: "4",
          template: true,
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authHouseholdID: "0",
          id: "5",
          template: true,
        },
      },
    ];

    PlanTaskState.data(data);

    expect(
      PlanTaskState.findTemplates(PlanTaskTemplateType.Homechart),
    ).toStrictEqual([
      {
        ...data[3],
        ...{
          children: [],
        },
      },
    ]);
    expect(
      PlanTaskState.findTemplates(PlanTaskTemplateType.Account),
    ).toStrictEqual([
      {
        ...data[4],
        ...{
          children: [],
        },
      },
    ]);
    expect(
      PlanTaskState.findTemplates(PlanTaskTemplateType.Household),
    ).toStrictEqual([
      {
        ...data[5],
        ...{
          children: [],
        },
      },
    ]);
  });

  test("getChildrenDone", () => {
    const task = PlanTaskState.new();

    expect(
      PlanTaskState.getChildrenDone({
        ...task,
        ...{
          children: [
            {
              ...task,
              ...{
                children: [
                  {
                    ...task,
                    ...{
                      done: true,
                    },
                  },
                ],
                done: true,
              },
            },
          ],
        },
      }),
    ).toBe(2);
    expect(
      PlanTaskState.getChildrenDone({
        ...task,
        ...{
          children: [
            {
              ...task,
              ...{
                children: [
                  {
                    ...task,
                    ...{
                      children: [
                        {
                          ...task,
                          ...{
                            done: true,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      }),
    ).toBe(1);
    expect(
      PlanTaskState.getChildrenDone({
        ...task,
        ...{
          children: [
            {
              ...task,
              ...{
                done: true,
              },
            },
            task,
          ],
        },
      }),
    ).toBe(1);
    expect(
      PlanTaskState.getChildrenDone({
        ...task,
        ...{
          children: [task, task],
        },
      }),
    ).toBe(0);
  });

  test("getCountToday", () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: yesterday.toString(),
          id: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: today.toString(),
          id: "1",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: tomorrow.toString(),
          id: "2",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "wrongID",
          dueDate: today.toString(),
          id: "3",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: today.toString(),
          id: "4",
          template: true,
        },
      },
    ];
    PlanTaskState.data(data);

    expect(PlanTaskState.getCountToday(PlanTaskState.data())).toBe(2);
  });

  test("getCountUpcoming", () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: yesterday.toString(),
          id: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: today.toString(),
          id: "1",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: tomorrow.toString(),
          id: "2",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "wrongID",
          dueDate: tomorrow.toString(),
          id: "3",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: tomorrow.toString(),
          id: "4",
          template: true,
        },
      },
    ];
    PlanTaskState.data(data);

    expect(PlanTaskState.getCountUpcoming(PlanTaskState.data())).toBe(1);
  });

  test("getDuration", () => {
    expect(
      PlanTaskState.getDuration([
        {
          ...PlanTaskState.new(),
          ...{
            children: [
              {
                ...PlanTaskState.new(),
                ...{
                  duration: 10,
                },
              },
              {
                ...PlanTaskState.new(),
                ...{
                  done: true,
                  duration: 20,
                },
              },
            ],
            duration: 10,
          },
        },
      ]),
    ).toBe(20);
  });

  test("getTaggable", async () => {
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          id: "0",
          tags: ["a", "b"],
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          id: "1",
          tags: ["b", "c"],
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          done: true,
          id: "2",
          tags: ["c", "a"],
        },
      },
    ];
    PlanTaskState.data(data);

    expect(PlanTaskState.tags()).toStrictEqual([
      {
        count: 1,
        name: "a",
      },
      {
        count: 2,
        name: "b",
      },
      {
        count: 1,
        name: "c",
      },
    ]);
  });

  test("update", async () => {
    PlanTaskState.data([
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: timestamp.toString(),
          id: "1",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: timestamp.toString(),
          id: "2",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: timestamp.toString(),
          id: "3",
        },
      },
    ]);

    const newDate = Timestamp.fromString(timestamp.toString());
    newDate.addDays(10);

    const task = {
      ...PlanTaskState.data()[0],
      ...{
        children: [
          {
            ...PlanTaskState.data()[1],
            ...{
              children: [
                {
                  ...PlanTaskState.data()[2],
                  ...{
                    dueDate: timestamp.toString(),
                  },
                },
              ],
              dueDate: timestamp.toString(),
            },
          },
        ],
        dueDate: newDate.toString(),
      },
    };

    testing.mocks.responses = [
      {
        dataType: "PlanTask",
        dataValue: [
          {
            ...PlanTaskState.data()[2],
            ...{
              dueDate: newDate.toString(),
            },
          },
        ],
      },
      {
        dataType: "PlanTask",
        dataValue: [
          {
            ...PlanTaskState.data()[1],
            ...{
              dueDate: newDate.toString(),
            },
          },
        ],
      },
      {
        dataType: "PlanTask",
        dataValue: [
          {
            ...PlanTaskState.data()[0],
            ...{
              dueDate: newDate.toString(),
            },
          },
        ],
      },
    ];

    await PlanTaskState.update(task);

    testing.requests([
      {
        body: {
          ...PlanTaskState.data()[2],
          ...{
            dueDate: newDate.toString(),
          },
        },
        method: "PUT",
        path: "/api/v1/plan/tasks/3",
      },
      {
        body: {
          ...PlanTaskState.data()[1],
          ...{
            dueDate: newDate.toString(),
          },
        },
        method: "PUT",
        path: "/api/v1/plan/tasks/2",
      },
      {
        body: {
          ...PlanTaskState.data()[0],
          ...{
            dueDate: newDate.toString(),
          },
        },
        method: "PUT",
        path: "/api/v1/plan/tasks/1",
      },
    ]);

    AppState.data.layoutAppAlerts = [];
  });

  test("updateDone", async () => {
    const timestamp1 = Timestamp.now();
    timestamp1.addDays(-1);

    AuthAccountState.data().id = "1";

    const timestamp2 = Timestamp.fromString(timestamp1.toString());
    const data = [
      {
        ...PlanTaskState.new(),
        ...{
          assignees: ["1", "2"],
          authAccountID: "1",
          dueDate: timestamp1.toString(),
          id: "0",
          recurOnDone: true,
          recurrence: {
            ...Recurrence.new(),
            ...{
              separation: 7,
            },
          },
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          done: true,
          id: "1",
          parentID: "0",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          dueDate: timestamp2.toString(),
          id: "2",
          parentID: "0",
          recurrence: {
            ...Recurrence.new(),
            ...{
              separation: 7,
            },
          },
        },
      },
    ];

    timestamp1.addDays(8);
    timestamp2.addDays(7);

    PlanTaskState.data(data);

    testing.mocks.responses = [
      {
        dataType: "PlanTask",
        dataValue: [PlanTaskState.new()],
      },
      {
        dataType: "PlanTask",
        dataValue: [PlanTaskState.new()],
      },
      {
        dataType: "PlanTask",
        dataValue: [PlanTaskState.new()],
      },
    ];

    await PlanTaskState.updateDone(PlanTaskState.nested()[0]);

    delete data[2].children;
    delete data[1].children;
    delete data[0].children;

    const now = CivilDate.now().toJSON();

    testing.requests([
      {
        body: {
          ...data[2],
          ...{
            dueDate: timestamp2.toString(),
            lastDoneBy: "1",
            lastDoneDate: now,
          },
        },
        method: "PUT",
        path: "/api/v1/plan/tasks/2",
      },
      {
        body: {
          ...data[1],
          ...{
            done: false,
          },
        },
        method: "PUT",
        path: "/api/v1/plan/tasks/1",
      },
      {
        body: {
          ...data[0],
          ...{
            authAccountID: "2",
            dueDate: timestamp1.toString(),
            lastDoneBy: "1",
            lastDoneDate: now,
          },
        },
        method: "PUT",
        path: "/api/v1/plan/tasks/0",
      },
    ]);

    expect(AppState.getLayoutAppAlerts()[0].message).toBe(
      `Next due date ${AppState.formatCivilDate(timestamp1.toCivilDate())}`,
    );

    const task = {
      ...PlanTaskState.new(),
      ...{
        dueDate: timestamp1.toString(),
      },
    };

    testing.mocks.responses = [
      {
        dataType: "PlanTask",
        dataValue: [data[0]],
      },
    ];

    AppState.data.layoutAppAlerts = [];

    await PlanTaskState.updateDone(task);

    expect(AppState.getLayoutAppAlerts()[0].message).toBe("Task completed");
  });
});
