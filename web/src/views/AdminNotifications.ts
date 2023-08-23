import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Timestamp } from "@lib/types/Timestamp";
import { Clone } from "@lib/utilities/Clone";
import { ActionAdd, ActionCancel, ActionDelete, ActionDeleteConfirm, ActionUpdate, FormCreated } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { AuthAccountState } from "../states/AuthAccount";
import type { Notification } from "../states/Notification";
import { NotificationState } from "../states/Notification";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectNotification, ObjectNotifications, WebAdminNotificationsBody, WebAdminNotificationsNewsletter, WebAdminNotificationsSendAfter, WebAdminNotificationsSubject, WebAdminNotificationsTo, WebGlobalAdmin } from "../yaml8n";

export function AdminNotifications (): m.Component {
	const state: {
		columns: Stream<FilterType>,
		notifications: Stream<Notification[]>,
		form: {
			data: Notification,
			deleteConfirm: boolean,
			visible: boolean,
		},
		loaded: boolean,
	} = {
		columns: Stream<FilterType>({
			authAccountID: "",
			subjectFCM: "",
			subjectSMTP: "",
			created: "", // eslint-disable-line sort-keys
			sendAfter: "",
			type: "",
		}),
		form: {
			data: NotificationState.new(),
			deleteConfirm: false,
			visible: false,
		},
		loaded: false,
		notifications: Stream<Notification[]>([]),
	};

	async function update (): Promise<void> {
		return NotificationState.read()
			.then((notifications) => {

				if (IsErr(notifications)) {
					state.notifications([]);
				} else {
					state.notifications(Clone(notifications));
				}
				m.redraw();
			});
	}

	if (AppState.getSessionDisplay() <= DisplayEnum.Small) {
		state.columns({
			authAccountID: "",
			subjectFCM: "",
			subjectSMTP: "",
		});
	}

	const n = Stream.lift((notifications, columns) => {
		return Filter.array(notifications, columns, {});
	}, state.notifications, state.columns);

	return {
		oninit: async (): Promise<void> => {
			state.loaded = false;

			AppState.setLayoutApp({
				...GetHelp(),
				breadcrumbs: [
					{
						name: AuthAccountState.translate(WebGlobalAdmin),
					},
					{
						name: AuthAccountState.translate(ObjectNotifications),
					},
				],
				toolbarActionButtons: [
					{
						name: "Notification",
						onclick: (): void => {
							state.form.data = NotificationState.new();
							state.form.visible = true;
						},
						permitted: true,
						requireOnline: true,
					},
				],
			});

			return update()
				.then(() => {
					state.loaded = true;
				});
		},
		view: (): m.Children => {
			return [
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
								permitted: !state.form.deleteConfirm && state.form.data.id !== null,
								requireOnline: true,
							},
							{
								name: AuthAccountState.translate(ActionCancel),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										if (state.form.deleteConfirm) {
											state.form.deleteConfirm = false;
										} else {
											state.form.visible = false;
										}

										return resolve();
									});
								},
								permitted: true,
								requireOnline: false,
							},
							{
								name: state.form.data.id === null ?
									AuthAccountState.translate(ActionAdd) :
									AuthAccountState.translate(ActionUpdate),
								permitted: !state.form.deleteConfirm,
								requireOnline: true,
								submit: true,
							},
							{
								accent: true,
								name: AuthAccountState.translate(ActionDeleteConfirm),
								onclick: async (): Promise<void> => {
									return NotificationState.delete(state.form.data.id)
										.then(async () => {
											state.form.visible = false;
											return update();
										});
								},
								permitted: state.form.deleteConfirm,
								requireOnline: true,
							},
						],
						onsubmit: async () => {
							if (state.form.data.id === null) {
								return NotificationState.create(state.form.data)
									.then(async () => {
										state.form.visible = false;
										return update();
									});
							}

							return NotificationState.update(state.form.data)
								.then(async () => {
									state.form.visible = false;
									return update();
								});
						},
						overlay: true,
						title: {
							name: `${AuthAccountState.translate(ActionUpdate)} ${AuthAccountState.translate(ObjectNotification)}`,
						},
					}, [
						m(FormCheckbox, {
							name: AuthAccountState.translate(WebAdminNotificationsNewsletter),
							onclick: () => {
								state.form.data.newsletter = !state.form.data.newsletter;
								state.form.data.authAccountID = null;
							},
							value: state.form.data.newsletter,
						}),
						state.form.data.newsletter ?
							[] :
							m(FormItem, {
								input: {
									oninput: (e: string): void => {
										state.form.data.authAccountID = e === "" ?
											null :
											e;
									},
									type: "text",
									value: state.form.data.authAccountID === null ?
										"" :
										state.form.data.authAccountID,
								},
								name: "AuthAccountID",
								tooltip: "",
							}),
						m(FormItem, {
							input: {
								oninput: (e: string): void => {
									state.form.data.toSMTP = e;
								},
								type: "text",
								value: state.form.data.toSMTP,
							},
							name: `${AuthAccountState.translate(WebAdminNotificationsTo)} SMTP`,
							tooltip: "",
						}),
						m(FormItem, {
							input: {
								oninput: (e: string): void => {
									state.form.data.subjectSMTP = e;
								},
								type: "text",
								value: state.form.data.subjectSMTP,
							},
							name: `${AuthAccountState.translate(WebAdminNotificationsSubject)} SMTP`,
							tooltip: "",
						}),
						m(FormItem, {
							name: `${AuthAccountState.translate(WebAdminNotificationsBody)} SMTP`,
							textArea: {
								oninput: (e: string): void => {
									state.form.data.bodySMTP = e;
								},
								value: state.form.data.bodySMTP,
							},
							tooltip: "",
						}),
						m(FormItem, {
							input: {
								disabled: state.form.data.newsletter,
								oninput: (e: string): void => {
									const date = new Date(e);
									state.form.data.sendAfter = date.toISOString();
								},
								type: "datetime-local",
								value: state.form.data.newsletter ?
									Timestamp.fromString(state.form.data.sendAfter as string)
										.toPrettyString(AuthAccountState.data().preferences.formatDateOrder, AuthAccountState.data().preferences.formatDateSeparator, AuthAccountState.data().preferences.formatTime24) :
									state.form.data.sendAfter === "" || state.form.data.sendAfter === null ?
										"" :
										Timestamp.fromString(state.form.data.sendAfter)
											.toHTMLDate(),
							},
							name: AuthAccountState.translate(WebAdminNotificationsSendAfter),
							tooltip: "",
						}),
					]) :
					[],
				m(Table, {
					actions: [],
					data: n(),
					editOnclick: (n: Notification): void => {
						state.form.data = n;
						state.form.visible = true;
					},
					filters: [],
					loaded: state.loaded,
					tableColumns: [
						{
							name: "AuthAccountID",
							property: "authAccountID",
						},
						{
							name: `${AuthAccountState.translate(WebAdminNotificationsSubject)} SMTP`,
							property: "subjectSMTP",
						},
						{
							name: `${AuthAccountState.translate(WebAdminNotificationsSubject)} FCM`,
							property: "subjectFCM",
						},
						{
							name: AuthAccountState.translate(FormCreated),
							property: "created",
							type: TableDataType.Timestamp,
						},
						{
							name: AuthAccountState.translate(WebAdminNotificationsSendAfter),
							property: "sendAfter",
							type: TableDataType.Timestamp,
						},
					],
					tableColumnsNameEnabled: state.columns,
				}),
			];
		},
	};
}
