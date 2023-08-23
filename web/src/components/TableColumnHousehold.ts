import type { TableColumnAttrs } from "@lib/components/TableHeader";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { ObjectHousehold } from "../yaml8n";

interface TableColumnHouseholdData {
	authHouseholdID: NullUUID,
}

export function TableColumnHousehold (): TableColumnAttrs {
	return {
		formatter: (b: TableColumnHouseholdData): string => {
			return AuthHouseholdState.findID(b.authHouseholdID).name;
		},
		name: AuthAccountState.translate(ObjectHousehold),
		property: "authHouseholdID",
	};
}
