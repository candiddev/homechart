import { CivilDate } from "@lib/types/CivilDate";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { RewardCardState } from "../states/RewardCard";
import { FormOverlayRewardCard } from "./FormOverlayRewardCard";

test("FormOverlayRewardCard", async () => {
  AuthAccountState.data(seed.authAccounts[0]);
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  RewardCardState.create = vi.fn();
  RewardCardState.delete = vi.fn();
  RewardCardState.update = vi.fn();

  const rewardCard = {
    ...RewardCardState.new(),
    ...{
      id: UUID.new(),
    },
  };

  testing.mount(FormOverlayRewardCard, {
    data: rewardCard,
  });

  // Buttons
  testing.find("#form-update-card");
  testing.click("#button-delete");
  testing.click("#button-confirm-delete");
  expect(RewardCardState.delete).toBeCalledWith(rewardCard.id);
  testing.click("#button-cancel");
  testing.click("#button-update");
  expect(RewardCardState.update).toBeCalled();
  rewardCard.id = null;
  testing.redraw();
  testing.click("#button-add");
  expect(RewardCardState.create).toBeCalled();
  AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now().toJSON();
  testing.redraw();
  testing.notFind("#button-add");
  AuthHouseholdState.data()[0].subscriptionExpires =
    seed.authHouseholds[0].subscriptionExpires;
  testing.redraw();

  testing.input("#form-item-input-name", "test");
  testing.value("#form-item-input-name", "test");
  expect(rewardCard.name).toBe("test");

  testing.input("#form-item-input-details", "test1");
  testing.value("#form-item-input-details", "test1");
  expect(rewardCard.details).toBe("test1");

  testing.click("#form-checkbox-input-always-redeemable");
  await testing.sleep(100);
  testing.notFind("#form-item-input-details");

  testing.input("#form-item-input-reward", "111");
  testing.value("#form-item-input-reward", "111");
  expect(rewardCard.reward).toBe("111");

  testing.input("#form-item-input-stamp-count", "10");
  testing.value("#form-item-input-stamp-count", "10");
  expect(rewardCard.stampGoal).toBe(10);

  testing.click("#form-checkbox-input-always-redeemable");
  testing.value("#form-item-input-stamp-goal", "10");

  testing.find("#button-array-senders");
  testing.find("#button-array-recipients");
});
