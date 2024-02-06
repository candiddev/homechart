import { ColorEnum } from "@lib/types/Color";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { InfoState } from "../states/Info";
import { PlanProjectState } from "../states/PlanProject";
import { FormOverlayPlanProject } from "./FormOverlayPlanProject";

test("FormOverlayPlanProject", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  BudgetCategoryState.data(seed.budgetCategories);
  PlanProjectState.data(seed.planProjects);
  PlanProjectState.create = vi.fn();
  PlanProjectState.delete = vi.fn(async () => {
    return Promise.resolve();
  });
  PlanProjectState.update = vi.fn();

  const planProject = {
    ...PlanProjectState.new(),
    ...{
      authHouseholdID: seed.authHouseholds[0].id,
      id: "1" as NullUUID,
      name: "Test",
    },
  };

  testing.mount(FormOverlayPlanProject, {
    data: planProject,
  });

  testing.find("#form-item-owner");

  // Buttons
  testing.find("#form-update-project");
  testing.click("#button-delete");
  testing.mocks.route = "/plan/tasks?project=1";
  testing.click("#button-confirm-delete");
  await testing.sleep(100);
  expect(PlanProjectState.delete).toBeCalledWith("1");
  expect(testing.mocks.route).toBe("/plan/tasks?filter=today");
  testing.click("#button-cancel");
  testing.click("#button-update");
  expect(PlanProjectState.update).toBeCalledTimes(1);
  planProject.id = null;
  testing.redraw();
  testing.click("#button-add");
  await testing.sleep(100);
  expect(PlanProjectState.create).toBeCalledTimes(1);
  planProject.id = "1";
  InfoState.data().cloud = false;
  testing.redraw();
  testing.notFind("#button-add");
  InfoState.data().cloud = true;
  testing.redraw();

  // Name
  const name = testing.find("#form-item-input-name");
  testing.value(name, "Test");
  testing.input(name, "Test2");
  expect(planProject.name).toBe("Test2");

  // Color
  const color = testing.find("#form-item-select-color");
  testing.value(color, "default");
  testing.input(color, "red");
  expect(planProject.color).toBe("red");
  testing.findAll(`#${color.id} option`, Object.keys(ColorEnum).length + 1);

  // Parent Project
  testing.click(`#form-item-option-parent-project-${seed.planProjects[1].id}`);
  expect(planProject.parentID).toBe(seed.planProjects[1].id);
  testing.hasClass(
    `#form-item-option-parent-project-${seed.planProjects[1].id}`,
    "FormItemSelectNested__option--selected",
  );

  // Budget Category
  const budget = testing.find("#form-item-select-budget-category");
  testing.input(
    budget,
    `${seed.budgetCategories[1].grouping} > ${seed.budgetCategories[1].name}`,
  );
  expect(planProject.budgetCategoryID).toBe(seed.budgetCategories[1].id);
  testing.value(
    budget,
    `${seed.budgetCategories[1].grouping} > ${seed.budgetCategories[1].name}`,
  );

  // Icon
  testing.input("#form-item-input-icon", "test");
  expect(planProject.icon).toBe("test");
});
