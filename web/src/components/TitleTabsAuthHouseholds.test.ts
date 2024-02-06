import { Icons } from "@lib/types/Icons";

import seed from "../jest/seed";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { TitleTabsAuthHousehold } from "./TitleTabsAuthHouseholds";

test("TitleTabsAuthHouseholds", async () => {
  AuthHouseholdState.data(seed.authHouseholds);

  testing.mocks.params.household = seed.authHouseholds[1].id;

  expect(TitleTabsAuthHousehold()[1]).toStrictEqual({
    active: true,
    href: `/?household=${seed.authHouseholds[1].id}`,
    icon: Icons.Household,
    name: seed.authHouseholds[1].name,
  });
});
