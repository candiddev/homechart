import seed from "../jest/seed";
import { AuthHouseholdState } from "./AuthHousehold";
import { CloudHouseholdState } from "./CloudHousehold";

describe("CloudHouseholdState", () => {
  AuthHouseholdState.data(seed.authHouseholds);

  test("create", async () => {
    testing.mocks.responses = [{}];

    await CloudHouseholdState.create(
      seed.authHouseholds[0].id,
      seed.authAccounts[0].emailAddress,
      "test",
    );

    testing.requests([
      {
        body: {
          emailAddress: seed.authAccounts[0].emailAddress,
          password: "test",
        },
        method: "POST",
        path: `/api/v1/cloud/${seed.authHouseholds[0].id}`,
      },
    ]);
  });
  test("findID", () => {
    const a = {
      ...AuthHouseholdState.new(),
      ...{
        name: "test",
        selfHostedID: "1",
      },
    };

    CloudHouseholdState.data([a]);

    expect(CloudHouseholdState.findID("1")).toStrictEqual(a);

    CloudHouseholdState.data([]);
  }),
    test("read", async () => {
      testing.mocks.responses = [
        {
          dataType: "AuthHousehold",
          dataValue: [seed.authHouseholds[0]],
        },
      ];

      await CloudHouseholdState.read(seed.authHouseholds[0].id);

      expect(CloudHouseholdState.data()[0]).toStrictEqual(
        seed.authHouseholds[0],
      );

      testing.requests([
        {
          method: "GET",
          path: `/api/v1/cloud/${seed.authHouseholds[0].id}`,
        },
      ]);
    });
  test("readJWT", async () => {
    testing.mocks.responses = [
      {
        dataType: "AuthHousehold",
        dataValue: [
          {
            ...seed.authHouseholds[0],
            ...{
              subscriptionProcessor: 1,
            },
          },
        ],
      },
    ];

    await CloudHouseholdState.readJWT("1");
    testing.requests([
      {
        method: "GET",
        path: "/api/v1/cloud/1/jwt",
      },
    ]);
    expect(AuthHouseholdState.data()[0].subscriptionProcessor).toBe(1);
  });
  test("update", async () => {
    const update = {
      ...seed.authHouseholds[0],
      ...{
        selfHostedURL: "http://example.com",
      },
    };

    testing.mocks.responses = [
      {
        dataType: "AuthHousehold",
        dataValue: [update],
      },
    ];

    await CloudHouseholdState.update(update);

    expect(CloudHouseholdState.data()[0].selfHostedURL).toStrictEqual(
      "http://example.com",
    );

    testing.requests([
      {
        body: update,
        method: "PUT",
        path: `/api/v1/cloud/${seed.authHouseholds[0].id}`,
      },
    ]);
  });
});
