import { CivilDate } from "@lib/types/CivilDate";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { HealthItemState } from "../states/HealthItem";
import { FormOverlayHealthItem } from "./FormOverlayHealthItem";

test("FormOverlayHealthItem", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  HealthItemState.create = vi.fn();
  HealthItemState.delete = vi.fn();
  HealthItemState.update = vi.fn();

  const id = UUID.new();
  const healthItem = {
    ...HealthItemState.new(),
    ...{
      id: id,
    },
  };

  testing.mount(FormOverlayHealthItem, {
    data: healthItem,
  });

  // Buttons
  testing.find("#form-update-input");
  testing.click("#button-delete");
  testing.click("#button-confirm-delete");
  expect(HealthItemState.delete).toBeCalledWith(id);
  testing.click("#button-cancel");
  testing.click("#button-update");
  expect(HealthItemState.update).toBeCalledTimes(1);
  healthItem.id = null;
  testing.redraw();
  testing.click("#button-add");
  expect(HealthItemState.create).toBeCalledTimes(1);
  AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now().toJSON();
  testing.redraw();
  testing.notFind("#button-add");
  AuthHouseholdState.data()[0].subscriptionExpires =
    seed.authHouseholds[0].subscriptionExpires;
  testing.redraw();

  // Inputs
  testing.input("#form-item-input-name", "Name");
  expect(healthItem.name).toBe("Name");

  testing.input("#form-item-select-color", "gray");
  expect(healthItem.color).toBe("gray");

  testing.click("#form-checkbox-input-output");
  expect(healthItem.output).toBe(true);
});
