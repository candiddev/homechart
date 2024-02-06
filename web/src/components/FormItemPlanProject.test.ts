import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { PlanProjectState } from "../states/PlanProject";
import type { FormItemPlanProjectAttrs } from "./FormItemPlanProject";
import { FormItemPlanProject } from "./FormItemPlanProject";

beforeEach(async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  PlanProjectState.data(seed.planProjects);
});

test("FormItemPlanProject", async () => {
  const input: FormItemPlanProjectAttrs = {
    ...PlanProjectState.new(),
    ...{
      authAccountID: seed.authAccounts[0].id,
      authHouseholdID: null,
    },
  };

  testing.mount(FormItemPlanProject, input);

  testing.findAll(
    "#form-item-select-parent-project > li",
    seed.planProjects.length + 2,
  );
  testing.hasClass(
    "#form-item-option-parent-project-personal",
    "FormItemSelectNested__option--selected",
  );
  testing.click("#form-item-option-parent-project-household");
  testing.hasClass(
    "#form-item-option-parent-project-household",
    "FormItemSelectNested__option--selected",
  );
  expect(input.authAccountID).toBe(null);
  expect(input.authHouseholdID).toBe(seed.authHouseholds[0].id);
  expect(input.parentID).toBeNull();
  testing.click(`#form-item-option-parent-project-${seed.planProjects[1].id}`);
  expect(input.authAccountID).toBe(seed.authAccounts[0].id);
  expect(input.authHouseholdID).toBeNull();
  expect(input.parentID).toBe(seed.planProjects[1].id);
});
