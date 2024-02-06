import { AppState } from "@lib/states/App";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import type { AuthAccount } from "../states/AuthAccount";
import { AuthAccountState } from "../states/AuthAccount";
import { AdminAccounts } from "./AdminAccounts";

AuthAccountState.readAll = async (): Promise<APIResponse<AuthAccount[]>> => {
  return new Promise((resolve): void => {
    const msg: APIResponse<AuthAccount[]> = {
      dataHash: "",
      dataIDs: [],
      dataTotal: 125,
      dataType: "AuthAccounts",
      dataValue: [],
      message: "",
      requestID: "",
      status: 200,
      success: true,
    };
    for (let i = 1; i <= 50; i++) {
      msg.dataValue.push(seed.authAccounts[0]);
    }
    resolve(msg);
  });
};

test("AdminAccounts", async () => {
  testing.mount(AdminAccounts);
  await testing.sleep(100);
  testing.redraw();
  testing.title("Admin - Accounts");
  testing.find("#form-item-input-search-table");
  testing.find("#button-next");
  testing.notFind("#button-previous");
  testing.findAll("tbody tr", 50);
  testing.text(
    `#table-data-${seed.authAccounts[0].id}-id`,
    seed.authAccounts[0].id,
  );
  testing.text(
    `#table-data-${seed.authAccounts[0].id}-primaryauthhouseholdid`,
    seed.authAccounts[0].primaryAuthHouseholdID,
  );
  testing.text(
    `#table-data-${seed.authAccounts[0].id}-emailaddress`,
    seed.authAccounts[0].emailAddress,
  );
  testing.text(
    `#table-data-${seed.authAccounts[0].id}-created`,
    AppState.formatCivilDate(
      Timestamp.fromString(seed.authAccounts[0].created).toCivilDate(),
    ),
  );
  testing.text(
    `#table-data-${seed.authAccounts[0].id}-lastactivity`,
    AppState.formatCivilDate(
      Timestamp.fromString(seed.authAccounts[0].lastActivity).toCivilDate(),
    ),
  );
  const edit = testing.find(`#table-row_${seed.authAccounts[0].id}`);
  testing.click(edit);
  testing.find("#form-item-input-email-address");
  testing.find("#form-checkbox-input-verified");
  testing.find("#button-delete-sessions");
  testing.find("#button-reset-password");
});
