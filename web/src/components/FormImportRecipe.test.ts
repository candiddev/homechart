import seed from "../jest/seed";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { FormImportRecipe } from "./FormImportRecipe";

test("FormImportRecipe", async () => {
  AuthHouseholdState.data(seed.authHouseholds);
  AuthSessionState.data(seed.authSessions[0]);
  let visible = true;

  testing.mount(FormImportRecipe, {
    toggle: (v: boolean) => {
      visible = v;
    },
    visible: visible,
  });

  testing.find("#form-import-recipe-from-website");
  const array = testing.findAll(".ButtonArray__item", 2);
  testing.click(array[1]);
  testing.input("#form-item-input-website-address", "example.com");

  testing.mocks.responses = [
    {
      dataType: "CookRecipe",
      dataValue: [seed.cookRecipes[0]],
    },
  ];

  testing.click("#button-import-recipe");

  await testing.sleep(100);

  testing.requests([
    {
      body: {
        authHouseholdID: seed.authHouseholds[1].id,
        url: "example.com",
      },
      method: "POST",
      path: "/api/v1/import/recipe",
    },
  ]);

  expect(testing.mocks.route).toBe(`/cook/recipes/${seed.cookRecipes[0].id}`);
});
