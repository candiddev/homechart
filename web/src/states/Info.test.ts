import { InfoState } from "./Info";

test("Info", async () => {
  testing.mocks.responses = [
    {
      dataValue: [
        {
          cloud: true,
          version: "test",
        },
      ],
    },
  ];

  await InfoState.read();

  expect(InfoState.data().cloud).toBeTruthy();

  await InfoState.read();

  testing.requests([
    {
      method: "GET",
      path: "/api?p=firefox",
    },
  ]);
});
