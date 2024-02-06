import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { AuthHouseholdState } from "./AuthHousehold";
import type { CloudBackup } from "./CloudBackup";
import { CloudBackupState } from "./CloudBackup";
import { InfoState } from "./Info";

describe("CloudBackupState", () => {
  AuthHouseholdState.data(seed.authHouseholds);
  InfoState.data().cloud = false;

  test("create", async () => {
    testing.mocks.responses = [{}];

    await CloudBackupState.create(seed.authHouseholds[0].id);

    testing.requests([
      {
        method: "POST",
        path: `/api/v1/cloud/${seed.authHouseholds[0].id}/backups`,
      },
    ]);
  });

  test("delete", async () => {
    testing.mocks.responses = [{}];

    await CloudBackupState.delete(seed.authHouseholds[0].id, "1");

    testing.requests([
      {
        method: "DELETE",
        path: `/api/v1/cloud/${seed.authHouseholds[0].id}/backups/1`,
      },
    ]);
  });

  test("readAll", async () => {
    testing.mocks.responses = [
      {
        dataType: "CloudBackups",
        dataValue: [
          {
            created: Timestamp.now().toString(),
            id: "1",
          },
          {
            created: Timestamp.now().toString(),
            id: "2",
          },
        ],
      },
    ];

    expect(
      (
        (await CloudBackupState.readAll(
          seed.authHouseholds[0].id,
        )) as CloudBackup[]
      ).length,
    ).toBe(2);

    testing.requests([
      {
        method: "GET",
        path: `/api/v1/cloud/${seed.authHouseholds[0].id}/backups`,
      },
    ]);
  });

  test("restore", async () => {
    testing.mocks.responses = [{}];

    await CloudBackupState.restore(seed.authHouseholds[0].id, "1");

    testing.requests([
      {
        method: "GET",
        path: `/api/v1/cloud/${seed.authHouseholds[0].id}/backups/1`,
      },
    ]);
  });
});
