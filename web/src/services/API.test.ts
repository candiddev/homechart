import { API, apiEndpoint, APIResponse } from "./API";
import { IndexedDB } from "./IndexedDB";

describe("API", () => {
  test("clearAPIEndpoint", () => {
    apiEndpoint().debug = true;
    apiEndpoint().hostname = "1";
    apiEndpoint().id = "2";
    apiEndpoint().key = "3";

    API.clearAPIEndpoint();

    expect(apiEndpoint()).toStrictEqual({
      debug: false,
      hostname: null,
      id: "",
      key: "",
    });
  }),
    test("fetch", async () => {
      testing.mocks.responses = [
        {},
        {
          dataHash: "1",
          dataIDs: [
            {
              id: "1",
              updated: "today",
            },
          ],
          dataTotal: 1,
          dataType: "Data",
          dataValue: [
            {
              id: "1",
            },
          ],
          success: false,
        },
        {
          status: 500,
          success: false,
        },
      ];

      expect(await API.fetch("GET", "/api/v1", {})).toStrictEqual({
        ...APIResponse(),
        message: "Mocked",
        status: 200,
        success: true,
      });

      expect(
        await API.fetch("POST", "/api/v1", {
          body: {
            id: "1",
          },
          updated: "today",
        }),
      ).toStrictEqual({
        dataHash: "1",
        dataIDs: [
          {
            id: "1",
            updated: "today",
          },
        ],
        dataTotal: 1,
        dataType: "Data",
        dataValue: [
          {
            id: "1",
          },
        ],
        message: "Mocked",
        requestID: "",
        status: 200,
        success: false,
      });

      await expect(
        API.fetch("GET", "/this/should/fail", {}),
      ).resolves.toStrictEqual({
        error: "API error",
        message: "Mocked",
      });

      testing.requests([
        {
          method: "GET",
          path: "/api/v1",
        },
        {
          body: {
            id: "1",
          },
          method: "POST",
          path: "/api/v1",
          updated: "today",
        },
        {
          method: "GET",
          path: "/this/should/fail",
        },
      ]);

      await expect(
        API.fetch("GET", "/this/should/fail0", {}),
      ).resolves.toStrictEqual({
        ...APIResponse(),
        message: "Homechart is offline",
      });
    });
  test("get/setHostname", async () => {
    await expect(API.getHostname()).resolves.toBe("");

    API.setHostname("somewhere");

    await expect(API.getHostname()).resolves.toBe("somewhere");

    await expect(IndexedDB.get("APIHostname")).resolves.toBe(null);
  });
  test("setAuth", async () => {
    API.clearAPIEndpoint();

    API.setHostname("somewhere");
    await API.setAuth({
      id: "1",
      key: "2",
    });

    expect(apiEndpoint()).toStrictEqual({
      debug: false,
      hostname: "somewhere",
      id: "1",
      key: "2",
    });
    await expect(IndexedDB.get("APIHostname")).resolves.toBe("somewhere");
  });
});
