import type { TitleAttrsTab } from "@lib/components/Title";
import { Icons } from "@lib/types/Icons";
import m from "mithril";

import { AuthHouseholdState } from "../states/AuthHousehold";

export function TitleTabsAuthHousehold (): TitleAttrsTab[] {
	return AuthHouseholdState.data().length > 1 ?
		AuthHouseholdState.data()
			.map((household) => {
				return {
					active: m.route.param().household === household.id,
					href: `${m.parsePathname(m.route.get()).path}?household=${household.id}`,
					icon: Icons.Household,
					name: household.name,
				};
			}) :
		[];
}
