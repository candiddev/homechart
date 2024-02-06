import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import type { AuthHousehold } from "../states/AuthHousehold";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AdminHouseholds } from "./AdminHouseholds";

AuthHouseholdState.readAdmin = async (): Promise<
  APIResponse<AuthHousehold[]>
> => {
  return new Promise((resolve): void => {
    const response: APIResponse<AuthHousehold[]> = {
      dataHash: "",
      dataIDs: [],
      dataTotal: 125,
      dataType: "AuthHouseholds",
      dataValue: [],
      message: "",
      requestID: "",
      status: 200,
      success: true,
    };
    for (let i = 1; i <= 50; i++) {
      response.dataValue.push(seed.authHouseholds[0]);
    }
    resolve(response);
  });
};

test("AdminHouseholds", async () => {
  testing.mount(AdminHouseholds);
  await testing.sleep(100);
  testing.redraw();
  testing.title("Admin - Households");
  testing.find("#form-item-input-search-table");
  testing.find("#button-next");
  testing.notFind("#button-previous");
  testing.findAll("tbody tr", 50);
  testing.text(
    `#table-data-${seed.authHouseholds[0].id}-id`,
    seed.authHouseholds[0].id,
  );
  testing.text(
    `#table-data-${seed.authHouseholds[0].id}-countmembers`,
    `${seed.authHouseholds[0].countMembers}`,
  );
  testing.text(
    `#table-data-${seed.authHouseholds[0].id}-created`,
    AppState.formatCivilDate(
      Timestamp.fromString(seed.authHouseholds[0].created).toCivilDate(),
    ),
  );
  testing.text(
    `#table-data-${seed.authHouseholds[0].id}-subscriptionexpires`,
    AppState.formatCivilDate(seed.authHouseholds[0].subscriptionExpires),
  );
  testing.text(
    `#table-data-${seed.authHouseholds[0].id}-subscriptionprocessor`,
    "Free Trial",
  );
});
