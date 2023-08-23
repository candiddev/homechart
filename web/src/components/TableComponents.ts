import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { Err } from "@lib/services/Log";
import type { FilterType } from "@lib/types/Filter";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";
import Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { GlobalState } from "../states/Global";
import { Translations } from "../states/Translations";
import { PermissionComponentsEnum } from "../types/Permission";
import { WebGlobalComponent, WebGlobalHidden } from "../yaml8n";

export interface TableComponentsAttrs {
	/** AuthHouseholdID to use/set. */
	authHouseholdID?: NullUUID,
}

interface component {
	id: string,
	name: string,
}

export function TableComponents (): m.Component<TableComponentsAttrs> {
	const columns = Stream<FilterType>({
		name: "",
		hidden: "", // eslint-disable-line sort-keys
	});

	const data = Stream(Clone(Translations.components));

	return {
		oninit: (vnode): void => {
			if (vnode.attrs.authHouseholdID === undefined) {
				const old = data();

				if (AuthHouseholdState.data().length === 1) {
					for (const h of AuthHouseholdState.data()[0].preferences.hideComponents) {
						const j = old.findIndex((c) => {
							return c.name.toLowerCase() === h;
						});

						if (j >= 0) {
							old.splice(j, 1);
						}
					}
				}

				data(old);
			} else {
				data(Clone(Translations.components));
			}
		},
		view: (vnode): m.Children => {
			return data().length > 0 ?
				m(Table, {
					actions: [],
					data: data(),
					filters: [],
					getKey: (component) => {
						return component.name.toLowerCase();
					},
					id: "components",
					loaded: true,
					noFilters: true,
					tableColumns: [
						{
							name: AuthAccountState.translate(WebGlobalComponent),
							property: "name",
						},
						{
							checkboxOnclick: async (c: component): Promise<void | Err> => {
								if (vnode.attrs.authHouseholdID === undefined) {
									return AuthAccountState.updateHideComponents(c.id);
								}

								return AuthHouseholdState.updateHideComponents(vnode.attrs.authHouseholdID, c.id);

							},
							formatter: (c: component): boolean | string => {
								if (vnode.attrs.authHouseholdID !== undefined) {
									return AuthHouseholdState.findID(vnode.attrs.authHouseholdID).preferences.hideComponents.includes(c.id.toLowerCase());
								}

								return GlobalState.hideComponentIncludes(c.id);
							},
							name: AuthAccountState.translate(WebGlobalHidden),
							permitted: (c: component): boolean => {
								return GlobalState.permitted(PermissionComponentsEnum.Auth, true, vnode.attrs.authHouseholdID) || vnode.attrs.authHouseholdID !== undefined && ! AuthHouseholdState.findID(vnode.attrs.authHouseholdID).preferences.hideComponents.includes(c.id.toLowerCase());
							},
							property: "hidden",
							type: TableDataType.Checkbox,
						},
					],
					tableColumnsNameEnabled: columns,
				}) :
				[];
		},
	};
}
