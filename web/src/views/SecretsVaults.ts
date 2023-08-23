import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { FormItemInputIconName } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlaySecretsVault } from "../components/FormOverlaySecretsVault";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import type { InventoryCollection } from "../states/InventoryCollection";
import { InventoryCollectionState } from "../states/InventoryCollection";
import type { SecretsVault } from "../states/SecretsVault";
import { SecretsVaultState } from "../states/SecretsVault";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectHousehold, ObjectSecrets, WebGlobalAll, WebGlobalName, WebGlobalPersonal } from "../yaml8n";

export function SecretsVaults (): m.Component {
	const state = {
		columns: Stream<FilterType>({
			name: "",
			icon: "", // eslint-disable-line sort-keys
		}),
		sort: Stream<TableHeaderSortAttrs>({
			invert: false,
			property: "name",
		}),
	};

	let data: Stream<SecretsVault[]>;

	return {
		oninit: async (): Promise<void> => {
			data = Stream.lift((vaults, columns, sort) => {
				m.redraw();

				return Filter.array([
					{
						...SecretsVaultState.new(),
						...{
							icon: Icons.All,
							id: "all",
							name: AuthAccountState.translate(WebGlobalAll),
						},
					},
					...vaults.filter((vault) => {
						return m.route.param().filter === "personal" ?
							vault.authAccountID !== null :
							m.route.param().filter === "household" ?
								vault.authHouseholdID !== null :
								true;
					}),
				], columns, sort);
			}, SecretsVaultState.data, state.columns, state.sort);

			AppState.setLayoutApp({
				...GetHelp("secrets"),
				breadcrumbs: [
					{
						link: "/secrets",
						name: AuthAccountState.translate(ObjectSecrets),
					},
				],
				toolbarActionButtons: [
					AppToolbarActions().newSecretsVault,
				],
			});
		},
		onremove: (): void => {
			data.end(true);
		},
		view: (): m.Children => {
			return m(Table, {
				actions: [],
				data: data(),
				editOnclick: (s: InventoryCollection) => {
					if (s.name === AuthAccountState.translate(WebGlobalAll)) {
						m.route.set("/secrets/all");
					} else {
						AppState.setLayoutAppForm(FormOverlaySecretsVault, s);
					}
				},
				filters: [],
				loaded: InventoryCollectionState.isLoaded(),
				sort: state.sort,
				tableColumns: [
					{
						formatter: (s: SecretsVault): string => {
							return s.name;
						},
						linkFormatter: (s: SecretsVault): string => {
							return `/secrets/${s.id}`;
						},
						linkRequireOnline: true,
						name: AuthAccountState.translate(WebGlobalName),
						property: "name",
						type: TableDataType.Link,
						typeCheck: (s: SecretsVault): TableDataType => {
							if (s.name !== "All" && SecretsVaultState.findKeyIndex(s.keys, AuthAccountState.data().id) < 0) {
								return TableDataType.Text;
							}

							return TableDataType.Link;
						},
					},
					{
						name: AuthAccountState.translate(FormItemInputIconName),
						property: "icon",
						type: TableDataType.Icon,
					},
					TableColumnHousehold(),
				],
				tableColumnsNameEnabled: state.columns,
				title: {
					tabs: [
						{
							active: m.route.param().filter === undefined,
							href: "/secrets",
							name: AuthAccountState.translate(WebGlobalAll),
						},
						{
							active: m.route.param().filter === "personal",
							href: "/secrets?filter=personal",
							name: AuthAccountState.translate(WebGlobalPersonal),
						},
						{
							active: m.route.param().filter === "household",
							href: "/secrets?filter=household",
							name: AuthAccountState.translate(ObjectHousehold),
						},
					],
				},
			});
		},
	};
}
