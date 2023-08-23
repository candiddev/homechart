import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormExpander } from "@lib/components/FormExpander";
import { FormItem } from "@lib/components/FormItem";
import { FormItemSelectColor } from "@lib/components/FormItemSelectColor";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import { AppState } from "@lib/states/App";
import { Color } from "@lib/types/Color";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { ActionAdd, ActionCancel, ActionDelete, ActionDeleteConfirm, ActionNew, ActionUpdate, FormItemSelectColorName } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import type { AuthAccountAuthHousehold } from "../states/AuthAccountAuthHousehold";
import { AuthAccountAuthHouseholdState } from "../states/AuthAccountAuthHousehold";
import type { AuthHouseholdMember } from "../states/AuthHousehold";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { GlobalState } from "../states/Global";
import { Permission, PermissionComponentsEnum, PermissionEnum } from "../types/Permission";
import { ObjectChild, ObjectOwner, WebFormTableAuthHouseholdMembersInviteToken, WebGlobalEmailAddress, WebGlobalEmailAddressInviteTooltip, WebGlobalHouseholdMember, WebGlobalName, WebGlobalNameTooltip, WebGlobalPermissions } from "../yaml8n";
import { FormPermissions } from "./FormPermissions";

interface FormTableAuthHouseholdMembersAttrs {
	authHouseholdID: NullUUID,
	nameEmailOnly?: boolean,
}

export function FormTableAuthHouseholdMembers (): m.Component<FormTableAuthHouseholdMembersAttrs> {
	const state = {
		columns: Stream<FilterType>({
			name: "",
			emailAddress: "", // eslint-disable-line sort-keys
			owner: "",
			child: "", // eslint-disable-line sort-keys
			color: "", // eslint-disable-line sort-keys
		}),
		form: {
			data: AuthAccountAuthHouseholdState.new(),
			deleteConfirm: false,
			visible: false,
		},
	};

	if (AppState.getSessionDisplay() < DisplayEnum.Large) {
		const c = state.columns();
		delete c.emailAddress;
		state.columns(c);
	}

	const householdID = Stream(null as NullUUID);

	let members: Stream<AuthHouseholdMember[]>;

	let expandPermissions = false;

	return {
		oninit: (vnode): void => {
			members = Stream.lift((members, id, columns) => {
				const am = members.filter((member) => {
					return member.authHouseholdID === id;
				});

				m.redraw();

				return Filter.array(am,columns, {});
			}, AuthHouseholdState.members, householdID, state.columns);

			if (vnode.attrs.nameEmailOnly === true) {
				state.columns({
					name: "",
					emailAddress: "", // eslint-disable-line sort-keys
				});
			}

			householdID(vnode.attrs.authHouseholdID);
		},
		onremove: (): void => {
			members.end(true);
		},
		view: (vnode): m.Children => {
			return [
				m(Table, {
					actions: ! AuthAccountState.isDemo() && GlobalState.permitted(PermissionComponentsEnum.Auth, true, vnode.attrs.authHouseholdID) ?
						[
							{
								icon: Icons.Invite,
								name: AuthAccountState.translate(ActionAdd),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										state.form.data = AuthAccountAuthHouseholdState.new();
										state.form.data.authHouseholdID = householdID();
										state.form.visible = true;

										return resolve();
									});
								},
								permitted: true,
								primary: true,
								requireOnline: true,
							},
						] :
						[],
					data: members(),
					editOnclick: (a: AuthAccountAuthHousehold): void => {
						state.form.data = a;
						state.form.visible = true;
					},
					filters: [],
					loaded: AuthHouseholdState.isLoaded(),
					staticColumns: true,
					tableColumns: [
						{
							formatter: (e: AuthHouseholdMember): string => {
								if (e.name === "") {
									return e.emailAddress;
								}
								return e.name;
							},
							name: AuthAccountState.translate(WebGlobalName),
							noFilter: true,
							property: "name",
						},
						{
							formatter: (e: AuthHouseholdMember): string => {
								if (e.child || AuthAccountState.isDemo()) {
									return "";
								}
								return e.emailAddress;
							},
							name: AuthAccountState.translate(WebGlobalEmailAddress),
							noFilter: true,
							property: "emailAddress",
						},
						{
							formatter: (e: AuthHouseholdMember): boolean => {
								return e.permissions.auth === 0;
							},
							name: AuthAccountState.translate(ObjectOwner),
							noFilter: true,
							property: "owner",
							type: TableDataType.Checkbox,
						},
						{
							formatter: (e: AuthHouseholdMember): boolean => {
								return e.child;
							},
							name: AuthAccountState.translate(ObjectChild),
							noFilter: true,
							property: "child",
							type: TableDataType.Checkbox,
						},
						{
							formatter: (e: AuthHouseholdMember): string => {
								return Color.values[e.color];
							},
							name: AuthAccountState.translate(FormItemSelectColorName),
							noFilter: true,
							property: "color",
						},
					],
					tableColumnsNameEnabled: state.columns,
				}),
				state.form.visible ?
					m(Form, {
						buttons: [
							{
								accent: true,
								name: AuthAccountState.translate(ActionDelete),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										state.form.deleteConfirm = true;

										return resolve();
									});
								},
								permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true, vnode.attrs.authHouseholdID) && state.form.data.id !== null && ! state.form.deleteConfirm,
								requireOnline: true,
							},
							{
								name: AuthAccountState.translate(ActionCancel),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										if (state.form.deleteConfirm) {
											state.form.deleteConfirm = false;

											return resolve();
										}

										state.form.visible = false;
										return resolve();
									});
								},
								permitted: true,
								requireOnline: true,
							},
							{
								name: state.form.data.id === null ?
									AuthAccountState.translate(ActionAdd) :
									AuthAccountState.translate(ActionUpdate),
								permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true, vnode.attrs.authHouseholdID) && ! state.form.deleteConfirm,
								requireOnline: true,
								submit: true,
							},
							{
								accent: true,
								name: AuthAccountState.translate(ActionDeleteConfirm),
								onclick: async (): Promise<void> => {
									const aaah = AuthHouseholdState.findMember(state.form.data.id);

									if (aaah.inviteToken !== "") {
										return AuthAccountAuthHouseholdState.inviteDelete(aaah.authHouseholdID, aaah.inviteToken)
											.then(async () => {
												state.form.deleteConfirm = false;
												state.form.visible = false;
											});
									}

									return AuthAccountAuthHouseholdState.delete(vnode.attrs.authHouseholdID, state.form.data.id)
										.then(async () => {
											state.form.deleteConfirm = false;
											state.form.visible = false;
										});
								},
								permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && state.form.deleteConfirm,
								requireOnline: true,
							},
						],
						onsubmit: async () => {
							if (state.form.data.id === null) {
								return AuthAccountAuthHouseholdState.inviteCreate(state.form.data)
									.then(() => {
										state.form.visible = false;
									});
							}

							return AuthAccountAuthHouseholdState.update(state.form.data)
								.then(() => {
									state.form.visible = false;
								});
						},
						overlay: true,
						title: {
							name: `${state.form.data.id === null ?
								AuthAccountState.translate(ActionNew) :
								AuthAccountState.translate(ActionUpdate)} ${AuthAccountState.translate(WebGlobalHouseholdMember)}`,
						},
					}, [
						m(FormItem, {
							input: {
								oninput: (e: string): void => {
									state.form.data.name = e;
								},
								type: "text",
								value: state.form.data.name,
							},
							name: AuthAccountState.translate(WebGlobalName),
							tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
						}),
						m(FormCheckbox, {
							name: AuthAccountState.translate(ObjectChild),
							onclick: () => {
								state.form.data.child = !state.form.data.child;

								if (state.form.data.child) {
									state.form.data.emailAddress = "temp@homechart.app";
									state.form.data.permissions = {
										...Permission.new(),
										...{
											authHousehold: PermissionEnum.View,
											budget: PermissionEnum.View,
											calendarHousehold: PermissionEnum.View,
											cook: PermissionEnum.View,
											inventory: PermissionEnum.View,
											notesHousehold: PermissionEnum.View,
											planHousehold: PermissionEnum.View,
											shop: PermissionEnum.View,
										},
									};
								} else {
									state.form.data.emailAddress = "";
									state.form.data.permissions = Permission.new();
								}
							},
							value: state.form.data.child,
						}),
						state.form.data.child ?
							[] :
							[
								m(FormItem, {
									input: {
										disabled: state.form.data.authAccountID !== null && state.form.data.inviteToken === "",
										oninput: (e: string): void => {
											state.form.data.emailAddress  = e;
										},
										required: true,
										type: "email",
										value: state.form.data.emailAddress,
									},
									name: AuthAccountState.translate(WebGlobalEmailAddress),
									tooltip: AuthAccountState.translate(WebGlobalEmailAddressInviteTooltip),
								}),
							],
						m(FormItemSelectColor, {
							oninput: (e) => {
								state.form.data.color = e;
							},
							value: state.form.data.color,
						}),
						state.form.data.inviteToken === "" ?
							[] :
							m(FormItem, {
								input: {
									disabled: true,
									oninput: (): void => {},
									type: "email",
									value: state.form.data.inviteToken,
								},
								name: AuthAccountState.translate(WebFormTableAuthHouseholdMembersInviteToken),
								tooltip: "",
							}),
						m(FormExpander, {
							expand: expandPermissions,
							name: AuthAccountState.translate(WebGlobalPermissions),
							onclick: () => {
								expandPermissions = !expandPermissions;
							},
						}),
						expandPermissions ?
							m(FormPermissions, {
								permissions: state.form.data.permissions,
							}) :
							[],
					]) :
					[],
			];
		},
	};
}
