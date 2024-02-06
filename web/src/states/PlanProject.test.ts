import { Icons } from "@lib/types/Icons";
import { Clone } from "@lib/utilities/Clone";
import { FilterSortChildren } from "@lib/utilities/FilterSortChildren";

import seed from "../jest/seed";
import { Permission } from "../types/Permission";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { AuthSessionState } from "./AuthSession";
import { PlanProjectState } from "./PlanProject";
import { PlanTaskState } from "./PlanTask";

beforeEach(() => {
  PlanProjectState.data(seed.planProjects);
});

describe("PlanProject", () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);

  const filterAndSorted = [
    {
      ...seed.planProjects[1],
      ...{
        children: [
          {
            ...seed.planProjects[2],
            ...{
              children: [],
            },
          },
          {
            ...seed.planProjects[3],
            ...{
              children: [],
            },
          },
          {
            ...seed.planProjects[4],
            ...{
              children: [],
            },
          },
        ],
      },
    },
  ];

  PlanProjectState.data.map((data) => {
    PlanProjectState.nested(
      FilterSortChildren({
        input: Clone(data),
      }),
    );
  });
  PlanTaskState.data.map((data) => {
    PlanTaskState.nested(
      FilterSortChildren({
        input: Clone(data),
      }),
    );
  });

  test("data", () => {
    PlanProjectState.data(seed.planProjects);
  });

  test("allTags", () => {
    PlanProjectState.data(seed.planProjects);
    PlanTaskState.data(seed.planTasks);

    expect(PlanProjectState.allTags()[2]).toStrictEqual({
      count: 5,
      name: "chores",
    });

    expect(PlanProjectState.allTagNames()[0]).toBe("book");
  });

  test("create", async () => {
    PlanProjectState.data([
      {
        ...PlanProjectState.new(),
        ...{
          authAccountID: "1",
          authHouseholdID: null,
          id: "1",
          name: "a",
          shortID: "1",
        },
      },
    ]);

    const tasks = [
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "1",
          authHouseholdID: null,
          id: "1",
          name: "a",
          planProjectID: "1",
          shortID: "1",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: "1",
          authHouseholdID: null,
          id: "2",
          name: "b",
          planProjectID: "1",
          shortID: "2",
        },
      },
    ];

    PlanTaskState.data(tasks);

    const output = {
      ...PlanProjectState.data()[0],
      ...{
        id: "2",
        name: "a1",
        shortID: "2",
      },
    };

    testing.mocks.responses = [
      {
        dataType: "PlanProject",
        dataValue: [output],
      },
      {
        dataType: "PlanTask",
        dataValue: [tasks[0]],
      },
      {
        dataType: "PlanTask",
        dataValue: [tasks[1]],
      },
    ];

    expect(
      await PlanProjectState.create({
        ...PlanProjectState.data()[0],
        ...{
          name: "a1",
        },
      }),
    ).toStrictEqual(output);

    testing.requests([
      {
        body: {
          ...output,
          ...{
            id: null,
            shortID: "",
          },
        },
        method: "POST",
        path: "/api/v1/plan/projects",
      },
      {
        body: {
          ...tasks[0],
          ...{
            id: null,
            planProjectID: "2",
            shortID: "",
          },
        },
        method: "POST",
        path: "/api/v1/plan/tasks",
      },
      {
        body: {
          ...tasks[1],
          ...{
            id: null,
            planProjectID: "2",
            shortID: "",
          },
        },
        method: "POST",
        path: "/api/v1/plan/tasks",
      },
    ]);
  });

  test("household", () => {
    expect(PlanProjectState.household()[0]).toStrictEqual({
      ...seed.planProjects[5],
      ...{
        children: [
          {
            ...seed.planProjects[6],
            ...{
              children: [
                {
                  ...seed.planProjects[7],
                  ...{
                    children: [],
                  },
                },
                {
                  ...seed.planProjects[8],
                  ...{
                    children: [],
                  },
                },
                {
                  ...seed.planProjects[9],
                  ...{
                    children: [],
                  },
                },
              ],
            },
          },
        ],
      },
    });
  });

  test("nested", () => {
    expect(PlanProjectState.nested()[0].children).toStrictEqual(
      filterAndSorted,
    );
  });

  test("personal", () => {
    expect(PlanProjectState.personal()[0].children).toStrictEqual(
      filterAndSorted,
    );
  });

  test("findAdjacent", () => {
    expect(PlanProjectState.findAdjacent(seed.planProjects[5])).toStrictEqual([
      seed.planProjects[5],
    ]);
    expect(PlanProjectState.findAdjacent(seed.planProjects[0])).toStrictEqual([
      seed.planProjects[0],
      seed.planProjects[10],
    ]);
    expect(PlanProjectState.findAdjacent(seed.planProjects[2])).toStrictEqual([
      seed.planProjects[2],
      seed.planProjects[3],
      seed.planProjects[4],
    ]);
  });

  test("findChildren", () => {
    expect(
      PlanProjectState.findChildren(seed.planProjects[0].id),
    ).toStrictEqual(filterAndSorted);
    expect(
      PlanProjectState.findChildren(seed.planProjects[3].id),
    ).toStrictEqual([]);
  });

  test("findCount", () => {
    const p = PlanProjectState.new();
    const input = {
      ...p,
      ...{
        children: [
          {
            ...p,
            ...{
              children: [
                {
                  ...p,
                  ...{
                    planTaskCount: 1,
                  },
                },
                {
                  ...p,
                  ...{
                    planTaskCount: 2,
                    shopItemCount: 5,
                  },
                },
              ],
              planTaskCount: 5,
            },
          },
          {
            ...p,
            ...{
              children: [
                {
                  ...p,
                  ...{
                    planTaskCount: 1,
                  },
                },
                {
                  ...p,
                  ...{
                    planTaskCount: 2,
                  },
                },
              ],
              planTaskCount: 5,
            },
          },
        ],
        id: "1",
        planTaskCount: 10,
      },
    };
    expect(PlanProjectState.findCount(input)).toBe(10);

    AuthAccountState.data().collapsedPlanProjects = ["1"];
    expect(PlanProjectState.findCount(input)).toBe(31);
  });

  test("findNamesBudgetCategoryID", () => {
    expect(
      PlanProjectState.findNamesBudgetCategoryID(seed.budgetCategories[2].id),
    ).toStrictEqual([seed.planProjects[5]]);
    expect(PlanProjectState.findNamesBudgetCategoryID(null)).toStrictEqual([]);
  });

  test("findTag", () => {
    expect(PlanProjectState.findTag("todo")).toStrictEqual([
      PlanProjectState.data()[0],
    ]);
  });

  test("getColorNamesID", () => {
    const output = [
      {
        id: "personal",
        level: 0,
        name: "Personal",
      },
      {
        color: seed.planProjects[0].color,
        icon: seed.planProjects[0].icon,
        id: seed.planProjects[0].id,
        level: 1,
        name: seed.planProjects[0].name,
      },
      {
        color: seed.planProjects[1].color,
        icon: Icons.PlanProject,
        id: seed.planProjects[1].id,
        level: 2,
        name: seed.planProjects[1].name,
      },
      {
        color: seed.planProjects[2].color,
        icon: Icons.PlanProject,
        id: seed.planProjects[2].id,
        level: 3,
        name: seed.planProjects[2].name,
      },
      {
        color: seed.planProjects[3].color,
        icon: Icons.PlanProject,
        id: seed.planProjects[3].id,
        level: 3,
        name: seed.planProjects[3].name,
      },
      {
        color: seed.planProjects[4].color,
        icon: Icons.PlanProject,
        id: seed.planProjects[4].id,
        level: 3,
        name: seed.planProjects[4].name,
      },
      {
        color: seed.planProjects[10].color,
        icon: Icons.PlanProject,
        id: seed.planProjects[10].id,
        level: 1,
        name: seed.planProjects[10].name,
      },
      {
        id: "household",
        level: 0,
        name: "Household",
      },
      {
        color: seed.planProjects[5].color,
        icon: seed.planProjects[5].icon,
        id: seed.planProjects[5].id,
        level: 1,
        name: seed.planProjects[5].name,
      },
      {
        color: seed.planProjects[6].color,
        icon: Icons.PlanProject,
        id: seed.planProjects[6].id,
        level: 2,
        name: seed.planProjects[6].name,
      },
      {
        color: seed.planProjects[7].color,
        icon: Icons.PlanProject,
        id: seed.planProjects[7].id,
        level: 3,
        name: seed.planProjects[7].name,
      },
      {
        color: seed.planProjects[8].color,
        icon: Icons.PlanProject,
        id: seed.planProjects[8].id,
        level: 3,
        name: seed.planProjects[8].name,
      },
      {
        color: seed.planProjects[9].color,
        icon: Icons.PlanProject,
        id: seed.planProjects[9].id,
        level: 3,
        name: seed.planProjects[9].name,
      },
    ];

    AuthSessionState.data({
      ...AuthSessionState.new(),
      ...{
        permissionsHouseholds: [
          {
            authHouseholdID: seed.authHouseholds[0].id,
            permissions: {
              ...Permission.new(),
              ...{
                plan: 1,
              },
            },
          },
        ],
      },
    });
    expect(PlanProjectState.getColorNamesIDs()).toStrictEqual(
      output.slice(0, 7),
    );
    AuthSessionState.data().permissionsHouseholds![0].permissions.plan = 0;
    expect(PlanProjectState.getColorNamesIDs()).toStrictEqual(output);
    AuthSessionState.data().permissionsHouseholds![0].permissions.plan = 2;
    AuthAccountState.data(seed.authAccounts[1]);
    expect(PlanProjectState.getColorNamesIDs()).toStrictEqual(
      output.slice(0, 1),
    );
    AuthAccountState.data(seed.authAccounts[0]);
  });
});
