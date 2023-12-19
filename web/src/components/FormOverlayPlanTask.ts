import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { FormItemDuration } from "@lib/components/FormItemDuration";
import { FormItemInputDate } from "@lib/components/FormItemInputDate";
import { FormItemSelectColor } from "@lib/components/FormItemSelectColor";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import { FormRecurrence } from "@lib/components/FormRecurrence";
import type { Err } from "@lib/services/Log";
import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import { Recurrence } from "@lib/types/Recurrence";
import { Timestamp } from "@lib/types/Timestamp";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { FormItemPlanProject } from "../components/FormItemPlanProject";
import { FormItemSelectAuthHouseholdMembers } from "../components/FormItemSelectAuthHouseholdMembers";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { GlobalState } from "../states/Global";
import { InventoryItemState } from "../states/InventoryItem";
import { PlanProjectState } from "../states/PlanProject";
import type { PlanTask } from "../states/PlanTask";
import { PlanTaskState } from "../states/PlanTask";
import { PermissionComponentsEnum } from "../types/Permission";
import { ObjectInventory, ObjectItem, ObjectTask, WebFormOverlayPlanTaskAssignees, WebFormOverlayPlanTaskAssigneesTooltip, WebFormOverlayPlanTaskDueDate, WebFormOverlayPlanTaskDueDateTooltip, WebFormOverlayPlanTaskDuration, WebFormOverlayPlanTaskDurationTooltip, WebFormOverlayPlanTaskInventoryItemTooltip, WebFormOverlayPlanTaskLastDone, WebFormOverlayPlanTaskRecurComplete, WebFormOverlayPlanTaskReminder, WebFormOverlayPlanTaskReminderTooltip, WebFormOverlayPlanTaskTemplate, WebFormOverlayPlanTaskTemplateGlobal, WebGlobalActionCopy, WebGlobalCompleted, WebGlobalDetails, WebGlobalDetailsTooltips, WebGlobalName, WebGlobalNameTooltip, WebGlobalNever, WebGlobalRecurring, WebGlobalSendReminder, WebGlobalTags, WebGlobalTagsTooltip } from "../yaml8n";
import { FormItemSelectAuthHousehold } from "./FormItemSelectAuthHousehold";


export function FormOverlayPlanTask (): m.Component<FormOverlayComponentAttrs<PlanTask>> {
	return {
		onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
		view: (vnode): m.Children => {
			return m(FormOverlay, {
				buttons: [
					{
						name: AuthAccountState.translate(WebGlobalActionCopy),
						onclick: async (): Promise<void> => {
							return new Promise((resolve) => {
								vnode.attrs.data.id = null;
								vnode.attrs.data.template = false;

								return resolve();
							});
						},
						permitted: vnode.attrs.data.id !== null,
						requireOnline: true,
					},
				],
				data: vnode.attrs.data,
				name: AuthAccountState.translate(ObjectTask),
				onDelete: async (): Promise<void | Err> => {
					return PlanTaskState.delete(vnode.attrs.data.id);
				},
				onSubmit: async (): Promise<PlanTask | void | Err> => {
					if (vnode.attrs.data.id === null) {
						return PlanTaskState.create(vnode.attrs.data);
					}

					return PlanTaskState.update(vnode.attrs.data);
				},
				permitted: GlobalState.permitted(PermissionComponentsEnum.Plan, true, vnode.attrs.data.authHouseholdID),
			}, [
				m(FormItemSelectAuthHousehold, {
					item: vnode.attrs.data,
					permissionComponent: PermissionComponentsEnum.Plan,
				}),
				m(FormItem, {
					input: {
						markdown: true,
						oninput: (e: string): void => {
							vnode.attrs.data.name = e;
						},
						required: true,
						type: "text",
						value: vnode.attrs.data.name,
					},
					name: AuthAccountState.translate(WebGlobalName),
					tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
				}),
				m(FormItem, {
					name: AuthAccountState.translate(WebGlobalDetails),
					textArea: {
						oninput: (e: string): void => {
							vnode.attrs.data.details = e;
						},
						value: vnode.attrs.data.details,
					},
					tooltip: AuthAccountState.translate(WebGlobalDetailsTooltips),
				}),
				vnode.attrs.data.id === null ?
					[] :
					m(FormCheckbox, {
						name: AuthAccountState.translate(WebGlobalCompleted),
						onclick: () => {
							vnode.attrs.data.done = ! vnode.attrs.data.done;
						},
						value: vnode.attrs.data.done,
					}),
				m(FormCheckbox, {
					name: AuthAccountState.translate(WebFormOverlayPlanTaskTemplate),
					onclick: () => {
						vnode.attrs.data.template = ! vnode.attrs.data.template;
					},
					value: vnode.attrs.data.template,
				}),
				vnode.attrs.data.template && AuthSessionState.data().admin === true?
					m(FormCheckbox, {
						name: AuthAccountState.translate(WebFormOverlayPlanTaskTemplateGlobal),
						onclick: () => {
							if (vnode.attrs.data.authAccountID === null && vnode.attrs.data.authHouseholdID === null) {
								vnode.attrs.data.authAccountID = AuthAccountState.data().id;
							} else {
								vnode.attrs.data.authAccountID = null;
								vnode.attrs.data.authHouseholdID = null;
							}
						},
						value: vnode.attrs.data.authAccountID === null && vnode.attrs.data.authHouseholdID === null,
					}) :
					[],
				vnode.attrs.data.template ?
					[] :
					m(FormItemPlanProject, vnode.attrs.data),
				vnode.attrs.data.authHouseholdID === null ?
					[] :
					m(FormItemSelectAuthHouseholdMembers, {
						authHouseholdID: vnode.attrs.data.authHouseholdID,
						members: vnode.attrs.data.assignees.length === 0 && vnode.attrs.data.authAccountID !== null ?
							[
								vnode.attrs.data.authAccountID,
							] :
							vnode.attrs.data.assignees,
						multiple: true,
						name: AuthAccountState.translate(WebFormOverlayPlanTaskAssignees),
						oninput: (members: string[]) => {
							if (members.length > 1) {
								vnode.attrs.data.assignees = members;
							} else {
								vnode.attrs.data.assignees = [];
							}

							if (members.length > 0) {
								vnode.attrs.data.authAccountID = members[0];
								vnode.attrs.data.color = AuthHouseholdState.findMember(members[0]).color;
							} else {
								vnode.attrs.data.authAccountID = null;
							}
						},
						tooltip: AuthAccountState.translate(WebFormOverlayPlanTaskAssigneesTooltip),
					}),
				m(FormItemSelectColor, {
					oninput: (e): void => {
						vnode.attrs.data.color = e;
					},
					value: vnode.attrs.data.color === undefined ?
						"" :
						vnode.attrs.data.color,
				}),
				m(FormItem, {
					input: {
						datalist: PlanProjectState.tagNames(),
						icon: Icons.Tag,
						type: "text",
						value: vnode.attrs.data.tags,
					},
					name: AuthAccountState.translate(WebGlobalTags),
					tooltip: AuthAccountState.translate(WebGlobalTagsTooltip),
				}),
				InventoryItemState.data().length > 0 ?
					m(FormItem, {
						name: `${AuthAccountState.translate(ObjectInventory)} ${AuthAccountState.translate(ObjectItem)}`,
						select: {
							oninput: (e: string): void => {
								vnode.attrs.data.inventoryItemID = e;
							},
							options: [
								"",
								...InventoryItemState.data(),
							],
							required: false,
							value: vnode.attrs.data.inventoryItemID,
						},
						tooltip: AuthAccountState.translate(WebFormOverlayPlanTaskInventoryItemTooltip),
					}) :
					[],
				m(FormItemDuration, {
					getDuration: () => {
						return vnode.attrs.data.duration;
					},
					name: AuthAccountState.translate(WebFormOverlayPlanTaskDuration),
					setDuration: (duration: number) => {
						vnode.attrs.data.duration = duration;
					},
					tooltip: AuthAccountState.translate(WebFormOverlayPlanTaskDurationTooltip),
				}),
				vnode.attrs.data.template ?
					[] :
					[
						m(FormItemInputDate, {
							name: AuthAccountState.translate(WebFormOverlayPlanTaskDueDate),
							oninput: (e: string): void => {
								if (e === "") {
									vnode.attrs.data.dueDate = null;
									vnode.attrs.data.notify = false;
									return;
								}
								let date = Timestamp.midnight();
								if (vnode.attrs.data.dueDate !== null) {
									date = Timestamp.fromString(vnode.attrs.data.dueDate);
								}

								vnode.attrs.data.dueDate = new Date(`${e}T${date.toCivilTime()
									.toString(true)}`)
									.toISOString();
							},
							tooltip: AuthAccountState.translate(WebFormOverlayPlanTaskDueDateTooltip),
							value: vnode.attrs.data.dueDate === null ?
								null : // null for value
								Timestamp.fromString(vnode.attrs.data.dueDate)
									.toCivilDate()
									.toJSON(),
						}),
						vnode.attrs.data.dueDate === null ?
							[] :
							m(FormCheckbox, {
								name: AuthAccountState.translate(WebGlobalSendReminder),
								onclick: () => {
									vnode.attrs.data.notify = ! vnode.attrs.data.notify;
								},
								value: vnode.attrs.data.notify,
							}),
						vnode.attrs.data.dueDate === null ?
							[] :
							m(FormItem, {
								input: {
									oninput: (e: string): void => {
										if (vnode.attrs.data.dueDate !== null) {
											if (e === "") {
												const timestamp = Timestamp.fromString(vnode.attrs.data.dueDate);
												timestamp.toMidnight();

												vnode.attrs.data.dueDate = timestamp.toString();
												return;
											}

											vnode.attrs.data.notify = true;
											vnode.attrs.data.dueDate = new Date(`${Timestamp.fromString(vnode.attrs.data.dueDate)
												.toCivilDate()
												.toJSON()}T${e}`)
												.toISOString();
										}
									},
									required: false,
									type: "time",
									value: Timestamp.fromString(vnode.attrs.data.dueDate)
										.toCivilTime()
										.toString(true) === "00:00" ?
										"00:00" :
										Timestamp.fromString(vnode.attrs.data.dueDate)
											.toCivilTime()
											.toString(true),
								},
								name: AuthAccountState.translate(WebFormOverlayPlanTaskReminder),
								tooltip: AuthAccountState.translate(WebFormOverlayPlanTaskReminderTooltip),
							}),
						vnode.attrs.data.dueDate === null ?
							[] :
							m(FormCheckbox, {
								name: AuthAccountState.translate(WebGlobalRecurring),
								onclick: () => {
									if (vnode.attrs.data.recurrence === null) {
										vnode.attrs.data.recurrence = Recurrence.new();
									} else {
										vnode.attrs.data.recurrence = null;
									}
								},
								value: vnode.attrs.data.recurrence !== null,
							}),
						vnode.attrs.data.recurrence === null ?
							[] :
							[
								m(FormCheckbox, {
									name: AuthAccountState.translate(WebFormOverlayPlanTaskRecurComplete),
									onclick: () => {
										vnode.attrs.data.recurOnDone = ! vnode.attrs.data.recurOnDone;
									},
									value: vnode.attrs.data.recurOnDone,
								}),
								m(FormItem, {
									input: {
										disabled: true,
										oninput: () => {},
										type: "text",
										value:
									vnode.attrs.data.lastDoneBy !== null && vnode.attrs.data.lastDoneDate !== null ?
										`${CivilDate.fromString(vnode.attrs.data.lastDoneDate)
											.toString(AuthAccountState.data().preferences.formatDateOrder, AuthAccountState.data().preferences.formatDateSeparator)} by ${AuthHouseholdState.findMemberName(vnode.attrs.data.lastDoneBy)}` :
										AuthAccountState.translate(WebGlobalNever),
									},
									name: AuthAccountState.translate(WebFormOverlayPlanTaskLastDone),
									tooltip: "",
								}),
								m(FormRecurrence, {
									endDate: vnode.attrs.data.dateEnd,
									endDateInput: (e) => {
										vnode.attrs.data.dateEnd = e;
									},
									futureNext: true,
									recurrence: vnode.attrs.data.recurrence,
									startDate: vnode.attrs.data.dueDate === null ?
										null : // null for value
										Timestamp.fromString(vnode.attrs.data.dueDate)
											.toCivilDate()
											.toJSON(),
								}),
							],
					],
			]);
		},
	};
}
