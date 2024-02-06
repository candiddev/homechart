import { CivilDate } from "@lib/types/CivilDate";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { CookMealTimeState } from "../states/CookMealTime";
import { FormOverlayCookMealTime } from "./FormOverlayCookMealTime";

test("FormOverlayCookMealTime", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  CookMealTimeState.create = vi.fn();
  CookMealTimeState.delete = vi.fn();
  CookMealTimeState.update = vi.fn();

  const id = UUID.new();
  const cookMealTime = {
    ...CookMealTimeState.new(),
    ...{
      id: id,
    },
  };

  testing.mount(FormOverlayCookMealTime, {
    data: cookMealTime,
  });

  // Buttons
  testing.find("#form-update-meal-time");
  testing.click("#button-delete");
  testing.click("#button-confirm-delete");
  expect(CookMealTimeState.delete).toBeCalledWith(id);
  testing.click("#button-cancel");
  testing.click("#button-update");
  expect(CookMealTimeState.update).toBeCalledTimes(1);
  cookMealTime.id = null;
  testing.redraw();
  testing.click("#button-add");
  expect(CookMealTimeState.create).toBeCalledTimes(1);
  AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now().toJSON();
  testing.redraw();
  testing.notFind("#button-add");
  AuthHouseholdState.data()[0].subscriptionExpires =
    seed.authHouseholds[0].subscriptionExpires;
  testing.redraw();

  // Inputs
  testing.find("#form-item-owner");

  testing.input("#form-item-input-name", "Name");
  expect(cookMealTime.name).toBe("Name");

  testing.input("#form-item-input-time", "15:33");
  expect(cookMealTime.time).toBe("15:33");
});
