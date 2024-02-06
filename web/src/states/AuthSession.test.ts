import seed from "../jest/seed";
import { AuthSessionState } from "./AuthSession";

describe("AuthSession", () => {
  test("data", () => {
    AuthSessionState.data(seed.authSessions[0]);
    AuthSessionState.data(AuthSessionState.new());
  });

  test("deleteAll", async () => {
    testing.mocks.responses = [{}];

    await AuthSessionState.deleteAll();

    testing.requests([
      {
        method: "DELETE",
        path: "/api/v1/auth/sessions",
      },
    ]);
  });

  test("read", async () => {
    await AuthSessionState.validate();

    testing.requests([]);

    testing.mocks.responses = [
      {
        dataType: "AuthSession",
        dataValue: [
          {
            ...AuthSessionState.new(),
            ...{
              name: "JS",
            },
          },
        ],
      },
    ];

    AuthSessionState.data().id = "1";

    await AuthSessionState.validate();

    testing.requests([
      {
        method: "GET",
        path: "/api/v1/auth/signin",
      },
    ]);

    expect(AuthSessionState.data().name).toBe("JS");
  });

  test("readAll", async () => {
    testing.mocks.responses = [
      {
        dataType: "AuthSessions",
        dataValue: [
          {
            ...AuthSessionState.new(),
            ...{
              name: "1",
            },
          },
          {
            ...AuthSessionState.new(),
            ...{
              name: "2",
            },
          },
        ],
      },
    ];

    const a = await AuthSessionState.readAll();

    testing.requests([
      {
        method: "GET",
        path: "/api/v1/auth/sessions",
      },
    ]);

    expect(a).toHaveLength(2);
  });
});
