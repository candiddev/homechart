import { App } from "@lib/layout/App";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Color } from "@lib/types/Color";
import { Position } from "@lib/types/Position";
import { Recurrence } from "@lib/types/Recurrence";
import { Timestamp } from "@lib/types/Timestamp";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { PlanProjectState } from "../states/PlanProject";
import type { PlanTask } from "../states/PlanTask";
import { PlanTaskState } from "../states/PlanTask";
import { ShopCategoryState } from "../states/ShopCategory";
import { ShopItemState } from "../states/ShopItem";
import { PlanTasks } from "./PlanTasks";

beforeAll(() => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  BudgetPayeeState.data(seed.budgetPayees);
  ShopCategoryState.data(seed.shopCategories);
});

beforeEach(() => {
  PlanProjectState.set(seed.planProjects);
  PlanTaskState.set([
    ...seed.planTasks,
    ...[
      {
        ...PlanTaskState.new(),
        ...{
          authAccountID: seed.authAccounts[0].id,
          authHouseholdID: null,
          id: "1",
          name: "Template 1",
          template: true,
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authHouseholdID: seed.authHouseholds[0].id,
          id: "2",
          name: "Template 2",
          template: true,
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          authHouseholdID: null,
          id: "3",
          name: "Template 3",
          template: true,
        },
      },
    ],
  ]);
  ShopItemState.loading = 1;
  ShopItemState.set(seed.shopItems);
  testing.mocks.params = {};
  testing.mocks.responses = [];
});

/* eslint-disable no-restricted-syntax */
describe("PlanTasks", () => {
  const tomorrow = Timestamp.midnight();
  tomorrow.addDays(1);

  test.each([
    ["none", {}, 11, 29],
    [
      "household",
      {
        filter: "household",
      },
      5,
      5,
    ],
    [
      "personal",
      {
        filter: "personal",
      },
      6,
      24,
    ],
    [
      "today",
      {
        filter: "today",
      },
      2,
      20,
    ],
    [
      "upcoming",
      {
        filter: "upcoming",
      },
      8,
      25,
    ],
    [
      "project",
      {
        project: seed.planProjects[5].id,
      },
      5,
      5,
    ],
    [
      "tag",
      {
        tag: "homechart",
      },
      1,
      40,
    ],
    [
      "templates",
      {
        filter: "templates",
      },
      3,
      3,
    ],
    [
      "date",
      {
        date: tomorrow.toCivilDate().toJSON(),
      },
      1,
      5,
    ],
  ])("params.%s", async (_name, params, headers, tasks) => {
    testing.mocks.params = params;
    testing.mount(PlanTasks);
    testing.findAll(".PlanTasks__item--header", headers);
    testing.findAll(".PlanTasks__item--info", tasks);
  });

  test("buttons.showComplete", async () => {
    PlanTaskState.loading = 1;
    PlanTaskState.set([
      {
        ...PlanTaskState.new(),
        ...{
          done: true,
          name: "test1",
        },
      },
      {
        ...PlanTaskState.new(),
        ...{
          done: true,
          name: "test2",
        },
      },
    ]);
    await testing.sleep(100);
    testing.mocks.params = {};
    testing.mount(PlanTasks);
    testing.click("#button-show-completed");
    testing.findAll(".PlanTasks__item--task", 2);
    PlanTaskState.loading = 1;
    PlanTaskState.set(seed.planTasks);
    testing.click("#button-show-completed");
  });

  test("button.newItem", async () => {
    testing.mocks.params = {
      project: seed.planProjects[7].id,
    };
    testing.mocks.responses.push({
      dataType: "ShopItem",
      dataValue: [ShopItemState.new()],
    });
    testing.mount(App, routeOptions, PlanTasks);
    testing.click("#app-toolbar-action-toggle");
    testing.click("#dropdown-item-shopitem");
    testing.mocks.requests = [];
    await testing.sleep(100);
    testing.click("#button-add");
    await testing.sleep(100);
    testing.requests([
      {
        body: {
          ...ShopItemState.new(),
          ...{
            planProjectID: seed.planProjects[7].id,
          },
        },
        method: "POST",
        path: "/api/v1/shop/items",
      },
    ]);
  });

  test.each([
    [
      "household",
      {
        filter: "household",
      },
      {
        authAccountID: null,
        authHouseholdID: seed.authHouseholds[0].id,
        position: "2",
      },
    ],
    [
      "project",
      {
        project: seed.planProjects[0].id,
      },
      {
        authAccountID: seed.planProjects[0].authAccountID,
        authHouseholdID: seed.planProjects[0].authHouseholdID,
        color: seed.planProjects[0].color,
        parentID: seed.planProjects[0].id,
        position: "1",
      },
    ],
    [
      "none",
      {},
      {
        authAccountID: seed.authAccounts[0].id,
        authHouseholdID: null,
        position: "2",
      },
    ],
  ])("buttons.newProject.%s", async (_name, params, request) => {
    testing.mocks.params = params;
    testing.mocks.responses.push({
      dataType: "PlanProject",
      dataValue: [PlanProjectState.new()],
    });
    testing.mount(App, routeOptions, PlanTasks);
    testing.click("#app-toolbar-action-toggle");
    testing.click("#dropdown-item-planproject");
    testing.mocks.requests = [];
    await testing.sleep(100);
    testing.click("#button-add");
    await testing.sleep(100);
    testing.requests([
      {
        body: {
          ...PlanProjectState.new(),
          ...request,
        },
        method: "POST",
        path: "/api/v1/plan/projects",
      },
    ]);
  });

  test.each([
    [
      "household",
      {
        filter: "household",
      },
      {
        authAccountID: null,
        authHouseholdID: seed.authHouseholds[0].id,
        children: undefined,
        position: "1",
      },
    ],
    [
      "project",
      {
        project: seed.planProjects[2].id,
      },
      {
        authAccountID: seed.planProjects[2].authAccountID,
        authHouseholdID: seed.planProjects[2].authHouseholdID,
        children: undefined,
        planProjectID: seed.planProjects[2].id,
        position: "1",
      },
    ],
    [
      "none",
      {},
      {
        authAccountID: seed.authAccounts[0].id,
        authHouseholdID: null,
        children: undefined,
        position: "1",
      },
    ],
  ])("buttons.newTask.%s", async (_name, params, request) => {
    testing.mocks.params = params;
    testing.mocks.responses.push({
      dataType: "PlanTask",
      dataValue: [PlanTaskState.new()],
    });
    testing.mount(App, routeOptions, PlanTasks);
    testing.click("#app-toolbar-action-toggle");
    testing.click("#dropdown-item-plantask");
    await testing.sleep(100);
    testing.mocks.requests = [];
    testing.click("#button-add");
    await testing.sleep(100);
    testing.requests([
      {
        body: {
          ...PlanTaskState.new(),
          ...request,
        },
        method: "POST",
        path: "/api/v1/plan/tasks",
      },
    ]);
  });

  test("drag.projectToProject", async () => {
    testing.mocks.params = {
      filter: "personal",
    };
    testing.mocks.responses.push({
      dataType: "AuthAccount",
      dataValue: [
        {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanProjects: [seed.planProjects[10].id],
          },
        },
      ],
    });
    testing.mocks.responses.push({
      dataType: "PlanProject",
      dataValue: [
        {
          ...seed.planProjects[0],
          ...{
            parentID: seed.planProjects[5].id,
          },
        },
      ],
    });
    testing.mocks.responses.push({
      dataType: "AuthAccount",
      dataValue: [
        {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanProjects: [],
          },
        },
      ],
    });
    testing.mount(PlanTasks);

    // Drag start
    const project = testing.find(`#project_${seed.planProjects[10].id}`);
    const drag = project.getElementsByClassName("PlanTasks__button--drag")[0];
    drag.dispatchEvent(new Event("dragstart"));
    await testing.sleep(100);
    expect(AuthAccountState.data().collapsedPlanProjects).toContain(
      seed.planProjects[10].id,
    );
    testing.hasClass(project, "PlanTasks__item--dragging");

    // Dragging before a project
    const target1 = testing.find(`#project_${seed.planProjects[0].id}`);
    testing.mocks.elementFromPoint = target1.children[0];
    const dragEvent = new Event("drag") as any;
    dragEvent.clientY = 0;
    drag.dispatchEvent(dragEvent);
    testing.hasClass(target1, "PlanTasks__dragtarget");
    expect(target1.previousSibling).toBe(project);

    // Dragging after a project
    const target2 = testing.find(`#project_${seed.planProjects[1].id}`);
    const target3 = testing.find(`#projectlist_${seed.planProjects[1].id}`);
    testing.mocks.elementFromPoint = target2.children[0];
    dragEvent.clientY = 25;
    drag.dispatchEvent(dragEvent);
    testing.notHasClass(target1, "PlanTasks__dragtarget");
    testing.hasClass(target2, "PlanTasks__dragtarget");
    expect(project.previousSibling).toBe(target2);

    // Drag into a project list
    dragEvent.clientY = 0;
    dragEvent.clientX = 71;
    testing.mocks.elementFromPoint = project.children[0];
    drag.dispatchEvent(dragEvent);
    testing.notHasClass(target2, "PlanTasks__dragtarget");
    testing.hasClass(target3, "PlanTasks__dragtarget");

    // Drag end on task before
    testing.mocks.requests = [];
    drag.dispatchEvent(new Event("dragend"));
    await testing.sleep(100);
    testing.notHasClass(target3, "PlanTasks__dragtarget");
    testing.requests([
      {
        body: {
          ...seed.planProjects[10],
          ...{
            parentID: seed.planProjects[1].id,
            position: "0",
          },
        },
        method: "PUT",
        path: `/api/v1/plan/projects/${seed.planProjects[10].id}`,
      },
      {
        body: {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanProjects: [],
          },
        },
        method: "PUT",
        path: `/api/v1/auth/accounts/${seed.authAccounts[0].id}`,
      },
    ]);
  });

  test("drag.taskToProject", async () => {
    testing.mocks.params = {
      filter: "personal",
    };
    testing.mocks.responses.push({
      dataType: "AuthAccount",
      dataValue: [
        {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanTasks: [seed.planTasks[0].id],
          },
        },
      ],
    });
    testing.mocks.responses.push({
      dataType: "PlanTask",
      dataValue: [
        {
          ...seed.planTasks[0],
          ...{
            planProjectID: seed.planProjects[5].id,
          },
        },
      ],
    });
    testing.mocks.responses.push({
      dataType: "AuthAccount",
      dataValue: [
        {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanTasks: [],
          },
        },
      ],
    });
    testing.mount(PlanTasks);

    // Drag start
    const task = testing.find(`#task_${seed.planTasks[0].id}`);
    const drag = task.getElementsByClassName("PlanTasks__button--drag")[0];
    drag.dispatchEvent(new Event("dragstart"));

    // Drag project
    const project = testing.find(`#project_${seed.planProjects[1].id}`);
    const projectlist = testing.find(`#projectlist_${seed.planProjects[1].id}`);
    testing.mocks.elementFromPoint = project.children[0];
    drag.dispatchEvent(new Event("drag"));
    await testing.sleep(100);
    testing.hasClass(projectlist, "PlanTasks__dragtarget");

    // Drag end
    testing.mocks.requests = [];
    drag.dispatchEvent(new Event("dragend"));
    await testing.sleep(100);
    testing.notHasClass(projectlist, "PlanTasks__dragtarget");
    testing.requests([
      {
        body: {
          ...seed.planTasks[0],
          ...{
            planProjectID: seed.planProjects[1].id,
            position: "0",
          },
        },
        method: "PUT",
        path: `/api/v1/plan/tasks/${seed.planTasks[0].id}`,
      },
      {
        body: {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanTasks: [],
          },
        },
        method: "PUT",
        path: `/api/v1/auth/accounts/${seed.authAccounts[0].id}`,
      },
    ]);
  });

  test("drag.taskToTask", async () => {
    testing.mocks.params = {
      filter: "personal",
    };
    testing.mocks.responses.push({
      dataType: "AuthAccount",
      dataValue: [
        {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanTasks: [seed.planTasks[9].id],
          },
        },
      ],
    });
    testing.mocks.responses.push({
      dataType: "PlanTask",
      dataValue: [
        {
          ...seed.planTasks[9],
          ...{
            position: Position.increase(seed.planTasks[13].position, false),
          },
        },
      ],
    });
    testing.mocks.responses.push({
      dataType: "AuthAccount",
      dataValue: [
        {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanTasks: [],
          },
        },
      ],
    });
    testing.mount(PlanTasks);

    // Drag start
    const task = testing.find(`#task_${seed.planTasks[9].id}`);
    const drag = task.getElementsByClassName("PlanTasks__button--drag")[0];
    drag.dispatchEvent(new Event("dragstart"));
    await testing.sleep(100);
    expect(AuthAccountState.data().collapsedPlanTasks).toContain(
      seed.planTasks[9].id,
    );
    testing.hasClass(task, "PlanTasks__item--dragging");

    // Dragging after a task without an existing task list
    const taskTarget1 = testing.find(`#task_${seed.planTasks[14].id}`);
    testing.mocks.elementFromPoint = taskTarget1.children[0];
    const dragEvent = new Event("drag") as any;
    dragEvent.clientY = 25;
    drag.dispatchEvent(dragEvent);
    testing.hasClass(taskTarget1, "PlanTasks__dragtarget");
    expect(task.previousSibling).toBe(taskTarget1);
    testing.notFind(`#tasklist_${seed.planTasks[14].id}`);

    // Dragging to a new list
    dragEvent.clientX = 71;
    testing.mocks.elementFromPoint = task.children[0];
    drag.dispatchEvent(dragEvent);
    const taskListTarget = testing.find(`#tasklist_${seed.planTasks[14].id}`);
    testing.mocks.elementFromPoint = taskListTarget;
    drag.dispatchEvent(dragEvent);
    testing.hasClass(taskListTarget, "PlanTasks__dragtarget");
    testing.notHasClass(taskTarget1, "PlanTasks__dragtarget");

    // Dragging before a task with an existing task list
    const taskTarget2 = testing.find(`#task_${seed.planTasks[13].id}`);
    testing.mocks.elementFromPoint = taskTarget2.children[0];
    dragEvent.clientX = 0;
    dragEvent.clientY = 0;
    drag.dispatchEvent(dragEvent);
    testing.hasClass(taskTarget2, "PlanTasks__dragtarget");
    expect(task.nextSibling).toBe(taskTarget2);

    // Drag end on task before
    testing.mocks.requests = [];
    drag.dispatchEvent(new Event("dragend"));
    await testing.sleep(100);
    testing.notHasClass(task, "PlanTasks__item--dragging");
    testing.notHasClass(taskTarget2, "PlanTasks__dragtarget");
    testing.requests([
      {
        body: {
          ...seed.planTasks[9],
          ...{
            position: "1:a",
          },
        },
        method: "PUT",
        path: `/api/v1/plan/tasks/${seed.planTasks[9].id}`,
      },
      {
        body: {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanTasks: [],
          },
        },
        method: "PUT",
        path: `/api/v1/auth/accounts/${seed.authAccounts[0].id}`,
      },
    ]);
  });

  test("headers.dates", async () => {
    // Projects
    testing.mocks.params = {
      filter: "upcoming",
    };
    testing.mount(PlanTasks);
    const d = testing.find("#date_Tomorrow");
    testing.text(
      d.getElementsByClassName("PlanTasks__name--header")[0],
      "Tomorrow",
    );
  });

  test("headers.projects", async () => {
    BudgetCategoryState.data(seed.budgetCategories);

    // Projects
    testing.mocks.params = {
      filter: "personal",
    };
    testing.mount(App, routeOptions, PlanTasks);
    const entertainment = testing.find(`#project_${seed.planProjects[0].id}`);

    // label
    testing.text(entertainment.getElementsByTagName("i")[1], "videogame_asset");
    testing.hasStyle(
      entertainment.getElementsByTagName("i")[1],
      `color: ${Color.toHex(seed.planProjects[0].color)}`,
    );

    // name
    const name = entertainment.getElementsByTagName("a")[0];
    testing.text(name, seed.planProjects[0].name);
    testing.notFind("#button-cancel");
    testing.click(entertainment.getElementsByTagName("div")[0]);
    await testing.sleep(100);
    testing.click("#button-cancel");

    // tags
    testing.text(entertainment.getElementsByTagName("a")[1], "tagtodo");

    // actions.item (none because personal)
    testing.notFind(`#headeritem_${seed.planProjects[0].id}`);

    // actions.addProject
    testing.mocks.responses.push({
      dataType: "PlanProject",
      dataValue: [
        {
          ...PlanProjectState.new(),
          ...{
            id: "1",
            name: "test",
          },
        },
      ],
    });
    await testing.sleep(100);
    testing.notFind("#button-cancel");
    testing.click(`#headermenutoggle_${seed.planProjects[0].id}`);
    let add = testing.find("#dropdown-item-project");
    testing.click(add);
    let request: any = [
      {
        body: {
          ...PlanProjectState.new(),
          ...{
            authAccountID: seed.planProjects[0].authAccountID,
            authHouseholdID: seed.planProjects[0].authHouseholdID,
            color: seed.planProjects[0].color,
            name: "",
            parentID: seed.planProjects[0].id,
            position: "1",
          },
        },
        method: "POST",
        path: "/api/v1/plan/projects",
      },
    ];
    testing.click("#button-add");
    await testing.sleep(100);
    testing.mocks.requests = [];
    testing.mocks.responses.push({
      dataType: "PlanProject",
      dataValue: [
        {
          ...PlanProjectState.new(),
          ...{
            id: "2",
            name: "test1",
          },
        },
      ],
    });
    testing.click(add);
    testing.click("#button-add");
    await testing.sleep(100);
    testing.requests(request);

    // actions.addTask
    testing.mocks.responses.push({
      dataType: "PlanTask",
      dataValue: [
        {
          ...PlanTaskState.new(),
          ...{
            id: "1",
          },
        },
      ],
    });
    testing.notFind("#button-cancel");
    testing.click(`#headermenutoggle_${seed.planProjects[0].id}`);
    add = testing.find("#dropdown-item-task");
    testing.click(add);
    request = [
      {
        body: {
          ...PlanTaskState.new(),
          ...{
            authAccountID: seed.planProjects[0].authAccountID,
            authHouseholdID: seed.planProjects[0].authHouseholdID,
            children: undefined,
            dueDate: tomorrow.toString(),
            planProjectID: seed.planProjects[0].id,
            position: "0",
          },
        },
        method: "POST",
        path: "/api/v1/plan/tasks",
      },
    ];
    testing.click("#button-add");
    await testing.sleep(100);
    testing.mocks.requests = [];
    testing.mocks.responses.push({
      dataType: "PlanTask",
      dataValue: [
        {
          ...PlanTaskState.new(),
          ...{
            id: "2",
          },
        },
      ],
    });
    testing.click(add);
    testing.click("#button-add");
    await testing.sleep(100);
    testing.requests(request);

    // actions.expand
    testing.find(`#project_${seed.planProjects[0].id}`);
    const expand = `#headerexpand_${seed.planProjects[0].id}`;
    testing.text(expand, "expand_less");
    testing.mocks.responses.push({
      dataType: "AuthAccount",
      dataValue: [
        {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanProjects: [seed.planProjects[0].id],
          },
        },
      ],
    });
    testing.click(expand);
    testing.text(expand, "expand_less");
    await testing.sleep(200);
    testing.notFind(`#project_${seed.planProjects[1].id}`);
    testing.mocks.responses.push({
      dataType: "AuthAccount",
      dataValue: [
        {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanProjects: [],
          },
        },
      ],
    });
    testing.click(expand);

    // actions.item
    testing.mocks.params = {
      filter: "household",
    };
    testing.mount(App, routeOptions, PlanTasks);
    testing.mocks.responses.push({
      dataType: "ShopItem",
      dataValue: [ShopItemState.new()],
    });
    testing.text(
      testing
        .find(`#project_${seed.planProjects[5].id}`)
        .getElementsByClassName("PlanTasks__name")[0],
      "Cleaning1paymentsCleaning $50.00/ $12.00tagchores",
    );
    testing.text(
      testing
        .find(`#project_${seed.planProjects[7].id}`)
        .getElementsByClassName("PlanTasks__name")[0],
      "Kitchen4schedule6h 10m",
    );
    testing.notFind("#button-cancel");
    testing.click(`#headermenutoggle_${seed.planProjects[5].id}`);
    const item = testing.find("#dropdown-item-item");
    testing.click(item);
    await testing.sleep(100);
    request = [
      {
        body: {
          ...ShopItemState.new(),
          ...{
            planProjectID: seed.planProjects[5].id,
          },
        },
        method: "POST",
        path: "/api/v1/shop/items",
      },
    ];
    testing.mocks.requests = [];
    testing.mocks.responses.push({
      dataType: "ShopItem",
      dataValue: [ShopItemState.new()],
    });
    testing.click(item);
    testing.click("#button-add");
    await testing.sleep(100);
    testing.requests(request);

    // offline
    AppState.data.sessionOnline = false;
    testing.redraw();
    testing.click(name);
    testing.notFind("#button-cancel");
    testing.notFind("#button-add");
    AppState.data.sessionOnline = true;
  });

  test("items", async () => {
    testing.mocks.params = {
      filter: "household",
    };
    testing.mount(App, routeOptions, PlanTasks);

    const itemEl = testing.find(`#item_${seed.shopItems[4].id}`);

    // drag
    const drag = itemEl.getElementsByTagName("i")[0];
    testing.hasStyle(drag, "visibility: hidden");

    // checkbox
    testing.text(itemEl.getElementsByTagName("i")[1], "remove_shopping_cart");
    testing.mocks.responses = [
      {
        dataType: "ShopItem",
        dataValue: [
          {
            ...seed.shopItems[4],
            ...{
              inCart: true,
            },
          },
        ],
      },
    ];
    testing.click(itemEl.getElementsByTagName("i")[1]);
    await testing.sleep(100);
    testing.text(itemEl.getElementsByTagName("i")[1], "add_shopping_cart");

    // name
    testing.text(
      itemEl.getElementsByClassName("PlanTasks__name")[0],
      "Broom $12.00categoryToolsstoreJane's General StorelistPick Up",
    );
  });

  test("loading", async () => {
    process.env.NODE_ENV = "";
    PlanTaskState.loading = 5;
    testing.mocks.params = {};
    testing.mount(PlanTasks);
    expect(document.getElementsByClassName("PlanTasks__name")).toHaveLength(0);
    expect(
      document.getElementsByClassName("PlanTasks__item--loading"),
    ).toHaveLength(5);
    process.env.NODE_ENV = "test";
  });

  test("none", async () => {
    testing.mocks.params = {
      project: seed.planProjects[3].id,
    };
    testing.mount(App, routeOptions, PlanTasks);
    const none = document
      .getElementsByClassName("PlanTasks__none")[0]
      .getElementsByTagName("button");
    expect(none).toHaveLength(3);
    testing.text(none[0], "addNew Task");
    testing.notFind("#form-new-task");
    testing.click(none[0] as HTMLElement);
    testing.find("#form-new-task");
    testing.click("#button-cancel");
    await testing.sleep(100);
    testing.text(none[1], "addNew Project");
    testing.notFind("#form-new-project");
    testing.click(none[1] as HTMLElement);
    testing.find("#form-new-project");
    testing.click("#button-cancel");
    await testing.sleep(100);
    testing.text(none[2], "addNew Item");
    testing.notFind("#form-new-item");
    testing.click(none[2] as HTMLElement);
    testing.find("#form-new-item");
    testing.click("#button-cancel");
    await testing.sleep(100);
  });

  test("tasks", async () => {
    testing.mocks.params = {
      filter: "household",
    };

    const dueDate = Timestamp.now();
    dueDate.timestamp.setHours(23);
    dueDate.timestamp.setMinutes(50);

    const task = {
      ...PlanTaskState.new(),
      ...{
        authAccountID: seed.authAccounts[0].id,
        authHouseholdID: seed.authHouseholds[0].id,
        details: "some details!",
        dueDate: dueDate.toString(),
        duration: 30,
        id: UUID.new(),
        name: "A task",
        notify: true,
        recurrence: {
          ...Recurrence.new(),
          ...{
            separation: 1,
          },
        },
        tags: ["a", "b"],
      },
    };
    delete task.children;
    PlanTaskState.loading = 1;
    PlanTaskState.set([task, ...seed.planTasks.slice(1)]);
    await testing.sleep(100);
    testing.mount(App, routeOptions, PlanTasks);
    const taskEl = testing.find(`#task_${task.id}`);

    // checkbox
    testing.mocks.requests = [];
    const checkbox = taskEl.getElementsByTagName("i")[1];
    testing.mocks.responses.push({
      dataType: "PlanTask",
      dataValue: [task],
    });
    testing.click(checkbox);
    await testing.sleep(100);
    testing.requests([
      {
        body: {
          ...task,
          ...{
            dueDate: Recurrence.nextTimestamp(
              task.recurrence,
              Timestamp.fromString(task.dueDate),
            ).toString(),
            lastDoneBy: AuthAccountState.data().id,
            lastDoneDate: CivilDate.now().toJSON(),
          },
        },
        method: "PUT",
        path: `/api/v1/plan/tasks/${task.id}`,
      },
    ]);
    PlanTaskState.data([task, ...seed.planTasks.slice(1)]);

    // name
    const name = taskEl
      .getElementsByClassName("PlanTasks__item")[0]
      .getElementsByTagName("div")[0] as HTMLElement;
    testing.notFind("#button-cancel");
    testing.click(name);
    testing.click("#button-cancel");
    await testing.sleep(100);
    testing.text(name.getElementsByTagName("p")[0], task.name);
    const details = name.getElementsByClassName("PlanTasks__details")[0];
    const duedate = details.getElementsByClassName("ButtonArray__item")[0];
    testing.text(
      duedate,
      `calendar_month${Timestamp.fromString(task.dueDate).toDueDate(
        seed.authAccounts[0].preferences.formatTime24,
      )}notificationsrepeat`,
    );
    testing.hasClass(duedate, "ButtonArray__item");
    expect(
      details.getElementsByClassName("PlanTasks__notification"),
    ).toHaveLength(1);
    expect(
      details.getElementsByClassName("PlanTasks__recurrence"),
    ).toHaveLength(1);
    testing.text(
      details,
      "calendar_month11:50 PMnotificationsrepeatschedule30mpersonJanetagatagb",
    );
    expect(details.getElementsByClassName("PlanTasks__project")).toHaveLength(
      0,
    );

    // actions.details
    testing.notFind(`#taskdetails_${task.id}`);
    const show = testing.find(`#taskshowdetails_${task.id}`);
    testing.click(show);
    await testing.sleep(100);
    testing.text(`#taskdetails_${task.id}`, task.details);

    // actions.add
    testing.notFind("#button-cancel");
    testing.click(`#taskmenutoggle_${task.id}`);
    const add = testing.find("#dropdown-item-subtask");
    testing.click(add);
    const request = [
      {
        body: {
          ...PlanTaskState.new(),
          ...{
            authAccountID: task.authAccountID,
            authHouseholdID: task.authHouseholdID,
            children: undefined,
            parentID: task.id,
            planProjectID: task.planProjectID,
            position: "0",
          },
        } as PlanTask,
        method: "POST",
        path: "/api/v1/plan/tasks",
      },
    ];
    testing.mocks.requests = [];
    testing.mocks.responses.push({
      dataType: "PlanTask",
      dataValue: [
        {
          ...request[0].body,
          ...{
            id: UUID.new(),
          },
        },
      ],
    });
    testing.click("#button-add");
    await testing.sleep(100);
    testing.requests(request);
    PlanTaskState.loading = 1;
    PlanTaskState.set([
      {
        ...request[0].body,
        ...{
          id: UUID.new(),
        },
      },
      ...PlanTaskState.data(),
    ]);
    await testing.sleep(100);

    // actions.expand
    testing.find(`#task_${task.id}`);
    const expand = testing.find(`#taskexpand_${task.id}`);
    testing.text(expand, "expand_less");
    testing.mocks.responses.push({
      dataType: "AuthAccount",
      dataValue: [
        {
          ...AuthAccountState.data(),
          ...{
            collapsedPlanTasks: [task.id],
          },
        },
      ],
    });
    testing.click(expand);
    await testing.sleep(100);
    testing.text(`#taskexpand_${task.id}`, "expand_less");
    testing.notFind(`#task_${request[0].body.id}`);

    // actions.addBefore
    testing.click(`#taskmenutoggle_${task.id}`);
    const addbefore = testing.find("#dropdown-item-task-before");
    testing.click(addbefore);
    testing.mocks.requests = [];
    testing.mocks.responses.push({
      dataType: "PlanTask",
      dataValue: [PlanTaskState.new()],
    });
    testing.click("#button-add");
    await testing.sleep(100);
    request[0].body.dueDate = null;
    request[0].body.parentID = null;
    request[0].body.position = "0:a";
    testing.requests(request);

    // actions.addAfter
    testing.click(`#taskmenutoggle_${task.id}`);
    const addafter = testing.find("#dropdown-item-task-after");
    testing.click(addafter);
    testing.mocks.requests = [];
    testing.mocks.responses.push({
      dataType: "PlanTask",
      dataValue: [PlanTaskState.new()],
    });
    testing.click("#button-add");
    await testing.sleep(100);
    request[0].body.dueDate = null;
    request[0].body.parentID = null;
    request[0].body.position = "0:a";
    testing.requests(request);

    // actions.copy
    testing.click(`#taskmenutoggle_${task.id}`);
    testing.find("#dropdown-item-copy");

    // offline
    AppState.data.sessionOnline = false;
    testing.redraw();
    testing.click(name);
    testing.notFind("#button-cancel");
    testing.notFind("#dropdown-item-subtask");
    testing.notFind("#dropdown-item-task-after");
    AppState.data.sessionOnline = true;
  });

  test.each([
    ["today", "/plan/tasks?filter=today", 6, "Today5", ""],
    ["upcoming", "/plan/tasks?filter=upcoming", 6, "Upcoming4", ""],
    ["all", "/plan/tasks", 6, "All32", ""],
    ["templates", "/plan/tasks?filter=templates", 6, "Templates3", ""],
    ["personal", "/plan/tasks?filter=personal", 6, "Personal26", ""],
    ["household", "/plan/tasks?filter=household", 6, "Household6", ""],
    [
      "entertainment",
      `/plan/tasks?project=${seed.planProjects[0].id}`,
      8,
      "Entertainment",
      seed.planProjects[1].id,
    ],
  ])("tabs.%s", async (name, route, tabs, tab, project) => {
    if (project !== "") {
      testing.mocks.params = {
        project: project,
      };
    }

    testing.mount(App, routeOptions, PlanTasks);

    testing.text(`#tab-${name}`, tab);
    testing.click(`#tab-${name}`);
    expect(testing.mocks.route).toBe(route);
    testing.redraw();

    expect(document.getElementsByClassName("Title__tab")).toHaveLength(tabs);
  });

  test("templates", async () => {
    testing.mocks.params.filter = "templates";
    testing.mount(App, routeOptions, PlanTasks);

    const personal = testing.find("#project_personal");
    testing.text(
      personal.getElementsByClassName("PlanTasks__item--header")[0],
      "labelPersonaladdexpand_less",
    );
    expect(
      personal.getElementsByClassName("PlanTasks__item--task"),
    ).toHaveLength(1);
    testing.text(
      personal.getElementsByClassName("PlanTasks__item--task")[0],
      "drag_indicatorcheck_box_outline_blankTemplate 1addexpand_less",
    );

    const household = testing.find("#project_household");
    testing.text(
      household.getElementsByClassName("PlanTasks__item--header")[0],
      "labelHouseholdaddexpand_less",
    );
    expect(
      household.getElementsByClassName("PlanTasks__item--task"),
    ).toHaveLength(1);
    testing.text(
      household.getElementsByClassName("PlanTasks__item--task")[0],
      "drag_indicatorcheck_box_outline_blankTemplate 2addexpand_less",
    );

    const homechart = testing.find("#project_homechart");
    testing.text(
      homechart.getElementsByClassName("PlanTasks__item--header")[0],
      "labelHomechartexpand_less",
    );
    expect(
      homechart.getElementsByClassName("PlanTasks__item--task"),
    ).toHaveLength(1);
    testing.text(
      homechart.getElementsByClassName("PlanTasks__item--task")[0],
      "check_box_outline_blankTemplate 3addexpand_less",
    );
    testing.click("#taskmenutoggle_3");
    testing.notFind("#dropdown-item-task-after");
    testing.notFind("#dropdown-item-task-before");
    testing.notFind("#dropdown-item-subtask");

    testing.notFind("#headeritem_personal");
    testing.notFind("#headeritem_household");
    testing.notFind("#headeritem_global");
  });
});
