import "./PlanTasks.css";

import { Button } from "@lib/components/Button";
import { ButtonArray } from "@lib/components/ButtonArray";
import { DropdownMenu } from "@lib/components/DropdownMenu";
import { Icon } from "@lib/components/Icon";
import { Markdown } from "@lib/components/Markdown";
import { Title } from "@lib/components/Title";
import { Toolbar } from "@lib/components/Toolbar";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Color } from "@lib/types/Color";
import { Currency } from "@lib/types/Currency";
import { Duration } from "@lib/types/Duration";
import { Icons } from "@lib/types/Icons";
import { Position } from "@lib/types/Position";
import { Timestamp } from "@lib/types/Timestamp";
import { Animate, Animation } from "@lib/utilities/Animate";
import { Clone } from "@lib/utilities/Clone";
import { Drag } from "@lib/utilities/Drag";
import { ActionNew } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayPlanProject } from "../components/FormOverlayPlanProject";
import { FormOverlayPlanTask } from "../components/FormOverlayPlanTask";
import { FormOverlayShopItem } from "../components/FormOverlayShopItem";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { GlobalState } from "../states/Global";
import { InventoryItemState } from "../states/InventoryItem";
import type { PlanProject } from "../states/PlanProject";
import { PlanProjectState } from "../states/PlanProject";
import type { PlanTask } from "../states/PlanTask";
import { PlanTaskState, PlanTaskTemplateType } from "../states/PlanTask";
import { ShopCategoryState } from "../states/ShopCategory";
import type { ShopItem } from "../states/ShopItem";
import { ShopItemState } from "../states/ShopItem";
import { ShopListState } from "../states/ShopList";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectHousehold, ObjectItem, ObjectListPickUp, ObjectPlan, ObjectProject, ObjectTask, ObjectTaskAfter, ObjectTaskBefore, ObjectTaskSub, WebGlobalActionCopy, WebGlobalActionShowCompleted, WebGlobalActionShowTag, WebGlobalAll, WebGlobalPersonal, WebGlobalTemplates, WebGlobalToday, WebGlobalUpcoming, WebPlanTasksNone, WebPlanTasksOverdue, WebPlanTasksTomorrow } from "../yaml8n";

const thisWeekTime = Timestamp.now();
thisWeekTime.addDays(7);
const thisWeek = thisWeekTime
	.toCivilDate();
const today = CivilDate.now();

let route = "";

const scroll: {
	[route: string]: number,
} = {};

const state: {
	dateToday: Timestamp,
	dateTomorrow: Timestamp,
	dateWeek: Timestamp,
	dates: string[],
	datesOld: string[],
	expandID: NullUUID,
	filter: Stream<string>,
	project: PlanProject,
	projects: Stream<PlanProject[]>,
	showComplete: Stream<boolean>,
	tag: Stream<string>,
	tasks: Stream<PlanTask[]>,
} = {
	dateToday: Timestamp.now(),
	dateTomorrow: Timestamp.now(),
	dateWeek: Timestamp.now(),
	dates: [],
	datesOld: [],
	expandID: null,
	filter: Stream(""),
	project: PlanProjectState.new(),
	projects: Stream([] as PlanProject[]),
	showComplete: Stream(false as boolean), // eslint-disable-line @typescript-eslint/consistent-type-assertions
	tag: Stream(""),
	tasks:Stream([] as PlanTask[]),
};

function onDrag (srcID: string, x: number, y: number): void {
	let elNew = x === 0 && y === 0 ?
		document.elementFromPoint(Drag.state.x, Drag.state.y) as HTMLElement :
		document.elementFromPoint(x, y) as HTMLElement; // eslint-disable-line @typescript-eslint/consistent-type-assertions

	// Check if elNew is an item or list, not the main list, and isn't the same as the source
	if (elNew !== null && (elNew.classList.contains("PlanTasks__item") || elNew.classList.contains("PlanTasks__list")) && !elNew.parentElement!.classList.contains("PlanTasks")) { // eslint-disable-line @typescript-eslint/no-non-null-assertion
		const src = document.getElementById(srcID)!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

		if (elNew.classList.contains("PlanTasks__item")) {
			elNew = elNew.parentElement!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
		}

		let newType = elNew.id.split("_")[0];
		let newID = elNew.id.split("_")[1];

		let elOld = document.getElementById(Drag.state.target);

		// If targeting src ID
		if (elNew.id === srcID) {
			// If we're already in a list or targeting the srcID, return
			if (Drag.state.target === "" || Drag.state.target.includes(srcID) || Drag.state.target.includes("list")) {
				return;
			}

			elNew = document.getElementById(Drag.state.target) as HTMLElement; // eslint-disable-line @typescript-eslint/consistent-type-assertions

			// If we're already above the element, return
			if (elNew.previousElementSibling === src) {
				return;
			}

			// If we're moving the item to the right, add it to the list
			if (x > elNew.getBoundingClientRect().x + 70) {
				elOld = elNew;
				newType = `${Drag.state.target.split("_")[0]}list`;
				newID = Drag.state.target.split("_")[1];

				let list = document.getElementById(`${newType}_${newID}`);

				// If there isn't a list, add one
				if (list === null) {
					list = document.createElement("ul");
					list.classList.add("PlanTasks__list");
					list.id = `${newType}_${newID}`;
					elNew.insertAdjacentElement("afterend", list);
				}

				elNew = list;
			// Do nothing
			} else {
				return;
			}
		}

		// Move the element under or before/after element
		if (srcID.includes("task") || srcID.includes("project") && newType.includes("project")) {
			// If a task is moving to a project, change to project list
			if (srcID.includes("task") && newType === "project") {
				newType =`${newType}list`;
				elNew = document.getElementById(`${newType}_${newID}`) as HTMLElement; // eslint-disable-line @typescript-eslint/consistent-type-assertions
			}

			Drag.setDragTarget(elNew, "PlanTasks__dragtarget");

			// If the new type is a list, move into list
			if (srcID.includes("task") && newType.includes("list") || srcID.includes("project") && newType === "projectlist") {
				elNew.appendChild(src);

			// If the target is above the element, move it before the element
			} else if (Drag.isSourceAfter(y, elNew)) {
			// Move it after
				Drag.moveSrcAfter(src, elNew);
			} else if (elNew.nextElementSibling !== null && elNew.nextElementSibling.tagName === "UL") {
				elNew.nextElementSibling.insertAdjacentElement("afterend", src);
			} else {
				Drag.moveSrcBefore(src, elNew);
			}
		}

		// If there's an old element, remove it or remove the class
		if (elOld !== null && elNew !== elOld) {
			const oldType = elOld.id.split("_")[0];

			if (oldType === "tasklist" && elOld.children.length === 0) {
				elOld.remove();
			} else {
				elOld.classList.remove("PlanTasks__dragtarget");
			}
		}
	}
}

async function onDragEndProject (project: PlanProject): Promise<void | Err> {
	const updateProject = Clone(project);

	Drag.end("PlanTasks__dragtarget");

	if (Drag.state.target !== "") {
		const id = Drag.state.target.split("_")[1];
		const type = Drag.state.target.split("_")[0];

		switch (type) {
		case "project":
			const projectAfter = PlanProjectState.findID(id);
			updateProject.parentID = projectAfter.parentID;

			updateProject.position = Position.adjacent(projectAfter, PlanProjectState.findAdjacent(projectAfter), Drag.state.before);

			break;
		case "projectlist":
			const projectParent = PlanProjectState.findID(id);
			updateProject.parentID = projectParent.id;

			if (projectParent.children === undefined || projectParent.children.length === 0) {
				updateProject.position = "0";
			} else {
				updateProject.position = Position.increase(projectParent.children[projectParent.children.length - 1].position, true);
			}
			break;
		}
	}

	const el = document.getElementById(`project_${project.id}`)!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

	delete updateProject.children;

	return PlanProjectState.update(updateProject)
		.then(async (err) => {
			if (IsErr(err)) {
				if (Drag.state.parent !== null) {
					Drag.state.parent.insertBefore(el, Drag.state.parent.children[Drag.state.position]);
				}

				return;
			}
			if (updateProject.parentID === project.parentID) { // If the element moves out of its list, remove it
				el.classList.remove("PlanTasks__item--dragging"); // Or just remove the class
			} else {
				el.remove();
			}

			if (AuthAccountState.data().collapsedPlanProjects.includes(project.id!)) { // eslint-disable-line @typescript-eslint/no-non-null-assertion
				return AuthAccountState.collapsePlanProject(project.id);
			}

			m.redraw();
		});
}

async function onDragEndTask (task: PlanTask): Promise<void | Err> {
	const updateTask = Clone(task);

	Drag.end("PlanTasks__dragtarget");

	if (Drag.state.target!== "") {
		const id = Drag.state.target.split("_")[1];
		const type = Drag.state.target.split("_")[0];

		switch (type) {
		case "project":
		case "projectlist":
			const tasks = PlanTaskState.findPlanProjectID(id);
			updateTask.parentID = null;
			updateTask.planProjectID = id;

			if (tasks.length > 0) {
				updateTask.position = Position.increase(tasks[tasks.length - 1].position, true);
			} else {
				updateTask.position = "0";
			}
			break;
		case "task":
			const taskAfter = PlanTaskState.findID(id);
			updateTask.parentID = taskAfter.parentID;
			updateTask.planProjectID = taskAfter.planProjectID;

			updateTask.position = Position.adjacent(taskAfter, PlanTaskState.findAdjacent(taskAfter), Drag.state.before);

			break;
		case "tasklist":
			const taskParent = PlanTaskState.findID(id);
			updateTask.parentID = taskParent.id;
			updateTask.planProjectID = taskParent.planProjectID;

			if (taskParent.children === undefined || taskParent.children.length === 0) {
				updateTask.position = "0";
			} else {
				updateTask.position = Position.increase(taskParent.children[taskParent.children.length - 1].position, true);
			}
			break;
		}
	}

	const el = document.getElementById(`task_${task.id}`)!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

	delete updateTask.children;

	return PlanTaskState.update(updateTask)
		.then(async (err) => {
			if (IsErr(err)) {
				if (Drag.state.parent !== null) {
					Drag.state.parent.insertBefore(el, Drag.state.parent.children[Drag.state.position]); // eslint-disable-line @typescript-eslint/no-non-null-assertion
				}

				return;
			}

			if (updateTask.parentID !== task.parentID || updateTask.planProjectID !== task.planProjectID) { // If the element moves out of its list, remove it
				el.remove();
			} else {
				el.classList.remove("PlanTasks__item--dragging"); // Or just remove the class
			}

			if (AuthAccountState.data().collapsedPlanTasks.includes(task.id!)) { // eslint-disable-line @typescript-eslint/no-non-null-assertion
				return AuthAccountState.collapsePlanTask(task.id);
			}

			m.redraw();
		});
}

async function onDragStart (projectID: NullUUID, taskID: NullUUID): Promise<void | Err> {
	let id = "";
	if (taskID === null) {
		id = `project_${projectID}`;
	} else {
		id = `task_${taskID}`;
	}

	Drag.start(document.getElementById(id) as HTMLElement, "PlanTasks__item--dragging");

	if (projectID !== null && ! AuthAccountState.data().collapsedPlanProjects.includes(projectID)) {
		return AuthAccountState.collapsePlanProject(projectID);
	} else if (taskID !== null && ! AuthAccountState.data().collapsedPlanProjects.includes(taskID)) {
		return AuthAccountState.collapsePlanTask(taskID);
	}
}

function RenderObjects (): m.Component<{
	authAccountID: NullUUID,
	authHouseholdID: NullUUID,
	id: NullUUID,
	items: ShopItem[],
	noHeaders?: boolean,
	tasks: PlanTask[],
}> {
	return {
		view: (vnode): m.Children  => {
			return vnode.attrs.items.length === 0 && vnode.attrs.noHeaders === true && vnode.attrs.tasks.length === 0 ?
				m("div.PlanTasks__none", [
					m(Icon, {
						icon: Icons.NotFound,
					}),
					m("span", AuthAccountState.translate(WebPlanTasksNone)),
					AppState.data.layoutAppToolbarActionButtons.map((action) => {
						if (action.permitted && AppState.isSessionOnline() || !action.requireOnline) {
							return m(Button, {
								icon: Icons.Add,
								name: `${AuthAccountState.translate(ActionNew)} ${action.name}`,
								onclick: async (): Promise<void> => {
									switch (action.name) {
									case AuthAccountState.translate(ObjectItem):
										AppState.setLayoutAppForm(FormOverlayShopItem, {
											...ShopItemState.new(),
											...{
												authAccountID: vnode.attrs.authAccountID,
												authHouseholdID: vnode.attrs.authHouseholdID,
												planProjectID: vnode.attrs.id,
											},
										});
										break;
									case AuthAccountState.translate(ObjectProject):
										AppState.setLayoutAppForm(FormOverlayPlanProject, {
											...PlanProjectState.new(),
											...{
												authAccountID: vnode.attrs.authAccountID,
												authHouseholdID: vnode.attrs.authHouseholdID,
												parentID: vnode.attrs.id,
											},
										});
										break;
									default:
										AppState.setLayoutAppForm(FormOverlayPlanTask, {
											...PlanTaskState.new(),
											...{
												authAccountID: vnode.attrs.authAccountID,
												authHouseholdID: vnode.attrs.authHouseholdID,
												planProjectID: vnode.attrs.id,
											},
										});
									}
								},
								permitted: true,
								primary: true,
								requireOnline: true,
							});
						}

						return null;
					}),
				]) :
				[
					vnode.attrs.items.map((item) => {
						return m("li", {
							id: `item_${item.id}`,
							key: `item_${item.id}`,
						}, [
							m("div.PlanTasks__item.PlanTasks__item--item.PlanTasks__item--info", {
								onclick: () => {
									AppState.setLayoutAppForm(FormOverlayShopItem, item);
								},
							}, [
								m(Icon, {
									classes: "PlanTasks__button PlanTasks__button--drag PlanTask__button--hidden",
									icon: Icons.Drag,
									style: {
										visibility: "hidden",
									},
								}),
								GlobalState.permitted(PermissionComponentsEnum.Shop, true, item.authHouseholdID) ?
									m(Icon, {
										classes: "PlanTasks__button PlanTasks__button--checkbox",
										icon: item.inCart ?
											Icons.ShopItemInCart :
											Icons.ShopItemToGet,
										onclick: async (e: m.Event<MouseEvent>) => {
											e.stopPropagation();
											const i = Clone(item);
											i.inCart = ! i.inCart;

											return ShopItemState.update(i);
										},
										style: {
											color: "var(--color_primary)",
										},
									}) :
									[],
								m("div.PlanTasks__name", {
									style: {
										cursor: AppState.isSessionOnline() ?
											undefined :
											"default",
									},
								}, [
									m(Markdown, {
										value: item.name,
									}),
									m("div.PlanTasks__details", [
										item.price === 0 ?
											[] :
											m("span.ButtonArray__item.ButtonArray__item--small", [
												m("span", Currency.toString(item.price, AuthHouseholdState.findID(AuthAccountState.data().primaryAuthHouseholdID).preferences.currency)),
											]),
										item.shopCategoryID === null ?
											[] :
											m("span.ButtonArray__item.ButtonArray__item--small", [
												m(Icon, {
													icon: Icons.ShopCategory,
												}),
												m("span", ShopCategoryState.findID(item.shopCategoryID).name),
											]),
										item.budgetPayeeID === null ?
											[] :
											m(m.route.Link, {
												class: "ButtonArray__item ButtonArray__item--small",
												href: `/shop/items?store=${BudgetPayeeState.findID(item.budgetPayeeID).id}`,
												onclick: (e: m.Event<MouseEvent>) => {
													e.stopPropagation();
												},
												options: {
													state: {
														key: Date.now(),
													},
												},
											}, [
												m(Icon, {
													icon: Icons.BudgetPayee,
												}),
												m("span", BudgetPayeeState.findID(item.budgetPayeeID).name),
											]),
										m("span.ButtonArray__item.ButtonArray__item--small", [
											m(Icon, {
												icon: Icons.ShopList,
											}),
											m("span", item.shopListID === null ?
												AuthAccountState.translate(ObjectListPickUp) :
												ShopListState.findID(item.shopListID).name),
										]),
									]),
								]),
							]),
						]);
					}),
					vnode.attrs.tasks.map((task) => {
						if (! state.showComplete() && task.done || state.showComplete() && (! task.done && PlanTaskState.getChildrenDone(task) === 0)) {
							return m("div", {
								key: `task_${task.id}`,
							}, []);
						}

						return m(`li.${Animate.class(Animation.Fade)}`, {
							id: `task_${task.id}`,
							key: `task_${task.id}`,
							onbeforeremove: Animate.onbeforeremove(Animation.Fade),
						}, [
							m("div.PlanTasks__item.PlanTasks__item--task", {
								onclick: () => {
									if (task.authAccountID === null && task.authHouseholdID === null && ! AppState.isSessionAdmin()) {
										return;
									}

									AppState.setLayoutAppForm(FormOverlayPlanTask, task);
								},
							}, [
								m("div.PlanTasks__item--info", [
									AppState.isSessionOnline() && state.dates.length === 0 && (task.authAccountID !== null || task.authHouseholdID !== null || AuthSessionState.data().admin === true) ?
										m(Icon, {
											classes: "PlanTasks__button PlanTasks__button--drag",
											draggable: true,
											icon: Icons.Drag,
											ondrag: (e: m.Event<DragEvent>) => {
												e.redraw = false;
												onDrag(`task_${task.id}`, e.clientX, e.clientY);
											},
											ondragend: async () => {
												return onDragEndTask(task);
											},
											ondragstart: async (e: m.Event<DragEvent>) => {
												if (process.env.NODE_ENV !== "test") {
													e.dataTransfer!.setDragImage(e.target.parentElement!.parentElement!, 0, 0); // eslint-disable-line @typescript-eslint/no-non-null-assertion
												}

												return onDragStart(null, task.id);
											},
											ontouchend: async () => {
												return onDragEndTask(task);
											},
											ontouchmove: async (e: m.Event<TouchEvent>) => { // eslint-disable-line @typescript-eslint/no-explicit-any
												e.redraw = false;
												e.preventDefault();
												const touches = e.changedTouches[0];
												onDrag(`task_${task.id}`, touches.clientX, touches.clientY);
											},
											ontouchstart: async () => {
												return onDragStart(null, task.id);
											},
										}) :
										[],
									GlobalState.permitted(PermissionComponentsEnum.Plan, true, task.authHouseholdID) ?
										m(Icon, {
											classes: "PlanTasks__button PlanTasks__button--checkbox",
											icon: task.done ?
												Icons.CheckYes :
												Icons.CheckNo,
											onclick: async (e: m.Event<MouseEvent>) => {
												e.stopPropagation();
												return PlanTaskState.updateDone(task)
													.then(async (err) => {
														if (IsErr(err)) {
															return;
														}

														if (! task.done && task.recurrence === null) {
															e.target.textContent = "check_box";
														}
													});
											},
											style: {
												color: Color.toHex(task.color) === "" ?
													"var(--color_content)" :
													Color.toHex(task.color, AuthAccountState.data().preferences.darkMode),
												display: task.template ?
													"none" :
													undefined,
											},
										}) :
										[],
									m("div.PlanTasks__name", {
										class: task.done ?
											"PlanTasks__name--done" :
											undefined,
										style: {
											cursor: AppState.isSessionOnline() ?
												undefined :
												"default",
										},
									}, [
										m(Markdown, {
											value: task.name,
										}),
										m("div.PlanTasks__details", [
											state.dates.length !== 0 || state.projects === null ?
												m(m.route.Link, {
													class: "ButtonArray__item ButtonArray__item--small",
													href: `/plan/tasks?project=${task.planProjectID}`,
													onclick: (e: m.Event<MouseEvent>) => {
														e.stopPropagation();
													},
													options: {
														state: {
															key: Date.now(),
														},
													},
												}, [
													m(Icon, {
														icon:Icons.PlanProject,
														style: {
															color: Color.toHex(PlanProjectState.findID(task.planProjectID).color, AuthAccountState.data().preferences.darkMode),
														},
													}),
													m("span", task.planProjectID === null ?
														task.authHouseholdID === null ?
															AuthAccountState.translate(WebGlobalPersonal) :
															AuthAccountState.translate(ObjectHousehold) :
														PlanProjectState.findID(task.planProjectID).name),
												]) :
												[],
											task.dueDate === null ?
												[] :
												m(m.route.Link, {
													class: "ButtonArray__item ButtonArray__item--small",
													href: `/plan/tasks?date=${Timestamp.fromString(task.dueDate)
														.toCivilDate()
														.toJSON()}`,
													options: {
														state: {
															key: Date.now(),
														},
													},
												}, [
													m(Icon, {
														icon: Icons.Calendar,
														style: {
															color: task.dueDate < state.dateToday.toString() ?
																"var(--color_negative)" :
																"var(--color_positive)",
														},
													}),
													m("span", Timestamp.fromString(task.dueDate)
														.toDueDate(AuthAccountState.data().preferences.formatTime24)),
													task.notify ?
														m(Icon, {
															classes: "PlanTasks__notification",
															icon: Icons.Notification,
														}) :
														[],
													task.recurrence === null ?
														[] :
														m(Icon, {
															classes: "PlanTasks__recurrence",
															icon: Icons.Recurring,
														}),
												]),
											task.duration > 0 ?
												m("span.ButtonArray__item.ButtonArray__item--small", [
													m(Icon, {
														icon: Icons.CookMealTime,
													}),
													m("span", Duration.toString(task.duration)),
												]) :
												[],
											task.authHouseholdID !== null && task.authAccountID !== null ?
												m("span.ButtonArray__item.ButtonArray__item--small", [
													m(Icon, {
														icon: Icons.Personal,
														style: {
															color: Color.toHex(AuthHouseholdState.findMember(task.authAccountID).color, AuthAccountState.data().preferences.darkMode),
														},
													}),
													m("span", AuthHouseholdState.findMemberName(task.authAccountID)),
												]) :
												[],
											task.inventoryItemID === null ?
												[] :
												m(m.route.Link, {
													class: "ButtonArray__item ButtonArray__item--small",
													href: `/inventory/all?id=${task.inventoryItemID}`,
												}, [
													m(Icon, {
														icon: Icons.Inventory,
													}),
													m("span", InventoryItemState.findID(task.inventoryItemID).name),
												]),
											m(ButtonArray, {
												icon: Icons.Tag,
												name: "tags",
												small: true,
												value: task.tags,
												valueLinkPrefix: "/plan/tasks?tag=",
											}),
										]),
									]),
									m("div.PlanTasks__actions", [
										task.details !== undefined && task.details !== "" ?
											m(Icon, {
												classes: "PlanTasks__arrow",
												icon: state.expandID === task.id ?
													Icons.UnfoldMore :
													Icons.UnfoldLess,
												id: `taskshowdetails_${task.id}`,
												onclick: async (e: m.Event<MouseEvent>) => {
													e.stopPropagation();

													if (state.expandID === task.id) {
														state.expandID = null;
													} else {
														state.expandID = task.id;
													}
												},
											}) :
											[],
										AppState.isSessionOnline() && GlobalState.permitted(PermissionComponentsEnum.Plan, true, task.authHouseholdID) ?
											m("div.PlanTasks__menu-container", [
												m(Icon, {
													classes: "GlobalButtonIconAdd PlanTasks__arrow",
													icon: Icons.Add,
													id: `taskmenutoggle_${task.id}`,
													onclick: async (e: m.Event<MouseEvent>) => {
														e.stopPropagation();

														AppState.setComponentsDropdownMenu(`taskmenu_${task.id}`, e.clientY);
													},
												}),
												m(DropdownMenu, {
													id: `taskmenu_${task.id}`,
													items: [
														{
															icon: Icons.Before,
															name: AuthAccountState.translate(ObjectTaskBefore),
															onclick: (): void => {
																const t = PlanTaskState.new();
																t.authAccountID = task.authAccountID;
																t.authHouseholdID = task.authHouseholdID;
																t.parentID = task.parentID;
																t.planProjectID = task.planProjectID;
																t.position = Position.adjacent(task, PlanTaskState.findAdjacent(task), true);
																AppState.setLayoutAppForm(FormOverlayPlanTask, t);
															},
															permitted: task.authAccountID !== null || task.authHouseholdID !== null || AuthSessionState.data().admin === true,
															requireOnline: true,
														},
														{
															icon: Icons.After,
															name: AuthAccountState.translate(ObjectTaskAfter),
															onclick: (): void => {
																const t = PlanTaskState.new();
																t.authAccountID = task.authAccountID;
																t.authHouseholdID = task.authHouseholdID;
																t.parentID = task.parentID;
																t.planProjectID = task.planProjectID;
																t.position = Position.adjacent(task, PlanTaskState.findAdjacent(task), false);
																AppState.setLayoutAppForm(FormOverlayPlanTask, t);
															},
															permitted: task.authAccountID !== null || task.authHouseholdID !== null || AuthSessionState.data().admin === true,
															requireOnline: true,
														},
														{
															icon: Icons.Sub,
															name: AuthAccountState.translate(ObjectTaskSub),
															onclick: (): void => {
																const t = PlanTaskState.new();
																t.authAccountID = task.authAccountID;
																t.authHouseholdID = task.authHouseholdID;
																t.color = task.color;
																t.parentID = task.id;

																if (task.children !== undefined && task.children.length > 0) {
																	t.position = Position.increase(task.children[task.children.length - 1].position, true);
																}

																t.planProjectID = task.planProjectID;

																AppState.setLayoutAppForm(FormOverlayPlanTask, t);
															},
															permitted: task.authAccountID !== null || task.authHouseholdID !== null || AuthSessionState.data().admin === true,
															requireOnline: true,
														},
														{
															icon: Icons.Template,
															name: AuthAccountState.translate(WebGlobalActionCopy),
															onclick: (): void => {
																const t = Clone(task);
																t.id = null;
																t.authAccountID = AuthAccountState.data().id;
																t.authHouseholdID = AuthAccountState.data().primaryAuthHouseholdID;
																t.template = false;

																AppState.setLayoutAppForm(FormOverlayPlanTask, t);
															},
															permitted: true,
															requireOnline: true,
														},
													],
												}),
											]) :
											[],
										m(`i.PlanTasks__arrow.GlobalButtonIconExpand${AuthAccountState.data().collapsedPlanTasks.includes(`${task.id}`) ?
											"" :
											".GlobalButtonIconExpand--active"}`, {
											id: `taskexpand_${task.id}`,
											onclick: async (e: m.Event<MouseEvent>) => {
												e.stopPropagation();
												return AuthAccountState.collapsePlanTask(task.id);
											},
											style: {
												visibility:
									task.children === undefined || task.children !== undefined && task.children.length === 0 || ! state.showComplete() && PlanTaskState.getChildrenDone(task) === 2 || state.showComplete() && PlanTaskState.getChildrenDone(task) === 0 ?
										"hidden" :
										undefined,
											},
										}, Icons.Expand),
									]),
								]),
								state.expandID === task.id ?
									m(`div.PlanTasks__item--details.${Animate.class(Animation.Expand)}`, {
										id: `taskdetails_${task.id}`,
										onbeforeremove: Animate.onbeforeremove(Animation.Expand),
										onclick: (e: m.Event<MouseEvent>) => {
											e.stopPropagation();
										},
									}, m(Markdown, {
										value: task.details,
									})) :
									[],
							]),
							task.children !== undefined && task.children.length === 0 || ! state.showComplete() && PlanTaskState.getChildrenDone(task) === 2 || state.showComplete() && PlanTaskState.getChildrenDone(task) === 0 || AuthAccountState.data().collapsedPlanTasks.includes(`${task.id}`) ?
								[] :
								m(`ul.PlanTasks__list.${Animate.class(Animation.Expand)}`, {
									id: `tasklist_${task.id}`,
									onbeforeremove: Animate.onbeforeremove(Animation.Expand),
								}, m(RenderObjects, {
									authAccountID: task.authAccountID,
									authHouseholdID: task.authHouseholdID,
									id: task.planProjectID,
									items: [] as ShopItem[], // eslint-disable-line @typescript-eslint/consistent-type-assertions
									tasks: task.children === undefined ?
										[] :
										task.children,
								})),
						]);
					}),
				];
		},
	};
}

function RenderHeaders (): m.Component<{
	headers?: (PlanProject | string)[],
}> {
	return {
		view: (vnode): m.Children => {
			return vnode.attrs.headers !== undefined && vnode.attrs.headers.length > 0 ?
				vnode.attrs.headers
					.map((header) => {
						const budgetCategory = BudgetCategoryState.findID(typeof header === "string" ?
							"" :
							header.budgetCategoryID);

						const items = typeof header === "string" ?
							[] :
							ShopItemState.findPlanProjectID(header.id);
						const tasks = typeof header === "string" ?
							header === AuthAccountState.translate(WebPlanTasksOverdue) ?
								state.showComplete() ?
									[] :
									PlanTaskState.dueDatePast() :
								PlanTaskState.findDueDate(header === AuthAccountState.translate(WebGlobalToday) || header === AuthAccountState.translate(WebPlanTasksTomorrow) ?
									header === AuthAccountState.translate(WebGlobalToday) ?
										state.dateToday.toCivilDate()
											.toJSON() :
										state.dateTomorrow.toCivilDate()
											.toJSON() :
									header) :
							header.created === null ?
								PlanTaskState.findTemplates(header.templateType) :
								PlanTaskState.findPlanProjectID(header.id);

						const cost = ShopItemState.costItems(items);
						const duration = PlanTaskState.getDuration(tasks);

						return m("li", {
							id: typeof header === "string" ?
								`date_${header}` :
								`project_${header.id}`,
							key: typeof header === "string" ?
								`date_${header}` :
								`project_${header.id}`,
						}, [
							m("div.PlanTasks__item.PlanTasks__item--header", {
								onclick: () => {
									if (typeof header !== "string" && AppState.isSessionOnline()) {
										AppState.setLayoutAppForm(FormOverlayPlanProject, header);
									}
								},
							}, [
								typeof header !== "string" && header.created !== null && AppState.isSessionOnline() ?
									m(Icon, {
										classes: "PlanTasks__button PlanTasks__button--drag",
										draggable: true,
										icon: Icons.Drag,
										ondrag: (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
											e.redraw = false;

											onDrag(`project_${header.id}`, e.clientX, e.clientY);
										},
										ondragend: async () => {
											return onDragEndProject(header);
										},
										ondragstart: async (e: m.Event<DragEvent>) => {
											if (process.env.NODE_ENV !== "test") {
												e.dataTransfer!.setDragImage(e.target.parentElement!.parentElement!, 0, 0); // eslint-disable-line @typescript-eslint/no-non-null-assertion
											}

											return onDragStart(header.id, null);
										},
										ontouchend: async () => {
											return onDragEndProject(header);
										},
										ontouchmove: async (e: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
											e.redraw = false;

											e.preventDefault();
											const touches = e.changedTouches[0];
											onDrag(`project_${header.id}`, touches.clientX, touches.clientY);
										},
										ontouchstart: async () => {
											return onDragStart(header.id, null);
										},
									}) :
									[],
								typeof header === "string" ?
									[] :
									m(Icon, {
										classes: "PlanTasks__label",
										icon: header.icon === "" ?
											Icons.PlanProject :
											header.icon,
										style: {
											color: header.color === "" ?
												undefined :
												Color.toHex(header.color, AuthAccountState.data().preferences.darkMode),
										},
									}),
								m("div.PlanTasks__name", [
									typeof header === "string" || header.created === null ?
										m("span.PlanTasks__name.PlanTasks__name--header", [
											typeof header === "string" ?
												header === "Tomorrow" || header === "Today" || header === "Overdue"  ?
													header :
													CivilDate.fromString(header) <= thisWeek && CivilDate.fromString(header) >= today ?
														Timestamp.fromCivilDate(CivilDate.fromString(header))
															.toDay() :
														CivilDate.fromString(header)
															.toString(AuthAccountState.data().preferences.formatDateOrder, AuthAccountState.data().preferences.formatDateSeparator) :
												header.name,
										]) :
										m(m.route.Link, {
											class: "PlanTasks__name PlanTasks__name--header",
											href: `/plan/tasks?project=${header.id}`,
											onclick: (e: m.Event<MouseEvent>) => {
												e.stopPropagation();
											},
											options: {
												state: {
													key: Date.now(),
												},
											},
										}, [
											header.name,
											PlanProjectState.findCount(header) > 0 ?
												m("span.GlobalCount", PlanProjectState.findCount(header)) :
												[],
										]),
									m("div.PlanTasks__details", [
										typeof header === "string" || header.budgetCategoryID === null ?
											[] :
											m("span.ButtonArray__item.ButtonArray__item--small", [
												m(Icon, {
													icon: Icons.BudgetCategory,
												}),
												m("span", budgetCategory.name),
												m("span", {
													style: {
														"color": budgetCategory.budgetMonthCategoryAmount + budgetCategory.budgetTransactionAmount >= cost ?
															"var(--color_positive)" :
															"var(--color_negative)",
														"filter": "none",
														"padding-left": "5px",
													},
												}, `${Currency.toString(budgetCategory.budgetMonthCategoryAmount + budgetCategory.budgetTransactionAmount, AuthHouseholdState.findID(budgetCategory.authHouseholdID).preferences.currency)}/${Currency.toString(cost, AuthHouseholdState.findID(budgetCategory.authHouseholdID).preferences.currency)}`),
											]),
										duration > 0 ?
											m("span.ButtonArray__item.ButtonArray__item--small", [
												m(Icon, {
													icon: Icons.CookMealTime,
												}),
												m("span", Duration.toString(duration)),
											]) :
											[],
										typeof header === "string" ?
											[] :
											m(ButtonArray, {
												icon: Icons.Tag,
												name: "tags",
												small: true,
												value: header.tags,
												valueLinkPrefix: "/plan/tasks?tag=",
											}),
									]),
								]),
								m("div.PlanTasks__actions", [
									typeof header === "string" || header.id === "homechart" && AuthSessionState.data().admin !== true ?
										[] :
										m("div.PlanTasks__menu-container", [
											m(Icon, {
												classes: "PlanTasks__arrow GlobalButtonIconAdd",
												icon: Icons.Add,
												id: `headermenutoggle_${header.id}`,
												onclick: async (e: m.Event<MouseEvent>) => {
													e.stopPropagation();
													AppState.setComponentsDropdownMenu(`headermenu_${header.id}`, e.clientY);
												},
											}),
											m(DropdownMenu, {
												id: `headermenu_${header.id}`,
												items: [
													{
														icon: Icons.PlanTask,
														name: AuthAccountState.translate(ObjectTask),
														onclick: (): void => {
															const t  = PlanTaskState.new();
															const tasks = PlanTaskState.findPlanProjectID(header.id);

															if (header.id === "homechart" || header.id === "household" || header.id === "personal") {
																t.template = true;

																switch (header.id) {
																case "homechart":
																	t.authAccountID = null;
																	t.authHouseholdID = null;
																	break;
																case "household":
																	t.authAccountID = null;
																	t.authHouseholdID = header.authHouseholdID;
																	break;
																case "personal":
																	t.authAccountID = header.authAccountID;
																	t.authHouseholdID = null;
																}
															} else {
																t.authAccountID = header.authAccountID;
																t.authHouseholdID = header.authHouseholdID;
																t.dueDate = state.dateTomorrow.toString();
																t.planProjectID = header.id;
															}

															if (tasks.length > 0) {
																t.position = Position.increase(tasks[tasks.length - 1].position, true);
															} else {
																t.position = "0";
															}

															AppState.setLayoutAppForm(FormOverlayPlanTask, t);
														},
														permitted: header.authAccountID !== null && GlobalState.permitted(PermissionComponentsEnum.Plan, true) || header.authHouseholdID !== null && GlobalState.permitted(PermissionComponentsEnum.Plan, true) || AuthSessionState.data().admin === true,
														requireOnline: true,
													},
													{
														icon: Icons.PlanProject,
														name: AuthAccountState.translate(ObjectProject),
														onclick: (): void => {
															const p = PlanProjectState.new();
															p.authAccountID = header.authAccountID;
															p.authHouseholdID = header.authHouseholdID;
															p.color = header.color;
															const projects = PlanProjectState.findChildren(header.id);

															if (projects.length > 0) {
																p.position = Position.increase(projects[projects.length - 1].position, true);
															} else {
																p.position = "0";
															}

															p.parentID = header.id;

															AppState.setLayoutAppForm(FormOverlayPlanProject, p);
														},
														permitted: header.authAccountID !== null && GlobalState.permitted(PermissionComponentsEnum.Plan, true) || header.authHouseholdID !== null && GlobalState.permitted(PermissionComponentsEnum.Plan, true) || AuthSessionState.data().admin === true,
														requireOnline: true,
													},
													{
														icon: Icons.ShopItem,
														name: AuthAccountState.translate(ObjectItem),
														onclick: (): void => {
															AppState.setLayoutAppForm(FormOverlayShopItem, {
																...ShopItemState.new(),
																...{
																	planProjectID: header.id,
																},
															});
														},
														permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true) && header.id !== "household" && header.id !== "personal",
														requireOnline: true,
													},
													{
														icon: Icons.Template,
														name: AuthAccountState.translate(WebGlobalActionCopy),
														onclick: (): void => {
															AppState.setLayoutAppForm(FormOverlayPlanProject, {
																...header,
																...{
																	id: null,
																	planProjectID: header.id,
																	position: Position.increase(header.position, false),
																},
															});
														},
														permitted: header.authAccountID !== null && GlobalState.permitted(PermissionComponentsEnum.Plan, true) || header.authHouseholdID !== null && GlobalState.permitted(PermissionComponentsEnum.Plan, true),
														requireOnline: true,
													},
												],
											}),
										]),
									typeof header === "string" ?
										[] :
										m(`i.PlanTasks__arrow.GlobalButtonIconExpand${AuthAccountState.data().collapsedPlanProjects.includes(`${header.id}`) ?
											"" :
											".GlobalButtonIconExpand--active"}`, {
											id: `headerexpand_${header.id}`,
											onclick: async (e: m.Event<MouseEvent>) => {
												e.stopPropagation();
												return AuthAccountState.collapsePlanProject(header.id);
											},
											style: {
												visibility: header.children !== undefined && header.children.length === 0 && PlanTaskState.findPlanProjectID(header.id)
													.filter((task) => {
														return task.done === state.showComplete();
													}).length === 0 ?
													"hidden" :
													undefined,
											},
										}, Icons.Expand),
								]),
							]),
							typeof header !== "string" && AuthAccountState.data().collapsedPlanProjects.includes(`${header.id}`) ?
								[] :
								m(`ul.PlanTasks__list.PlanTasks__list--header.${Animate.class(Animation.Expand)}`, {
									id: typeof header === "string" ?
										`datelist_${header}` :
										`projectlist_${header.id}`,
									onbeforeremove: Animate.onbeforeremove(Animation.Expand),
								}, [
									m(RenderObjects, {
										authAccountID: typeof header === "string" ?
											null : // null for value
											header.authAccountID,
										authHouseholdID: typeof header === "string" ?
											null : // null for value
											header.authHouseholdID,
										id: typeof header === "string" ?
											null : // null for value
											header.id,
										items: items,
										noHeaders: typeof header !== "string" && header.children !== undefined && header.children.length === 0,
										tasks: tasks,
									}),
									typeof header === "string" ?
										[] :
										m(RenderHeaders, {
											headers: header.children,
										}),
								]),
						]);
					}) :
				[];
		},
	};
}

export function PlanTasks (): m.Component {
	return {
		oninit: async (): Promise<void> => {
			Telemetry.spanStart("PlanTasks");

			state.filter("all");
			state.project = PlanProjectState.new();
			state.showComplete(false);
			state.tag("");

			AppState.setLayoutApp({
				...GetHelp("plan"),
				breadcrumbs: [
					{
						name: AuthAccountState.translate(ObjectPlan),
					},
				],
				toolbarActionButtons: [
					{
						...AppToolbarActions().newPlanTask,
						...{
							onclick: (): void => {
								const task  = PlanTaskState.new();
								let tasks: PlanTask[] = [];
								const filter = m.route.param().filter;
								const project = m.route.param().project;

								if (filter === "household") {
									task.authAccountID = null;
									task.authHouseholdID = AuthAccountState.data().primaryAuthHouseholdID;
									tasks = PlanTaskState.personal();
								} else if (project !== undefined) { // eslint-disable-line no-negated-condition
									const planProject = PlanProjectState.findID(project);
									task.authAccountID = planProject.authAccountID;
									task.authHouseholdID = planProject.authHouseholdID;
									task.planProjectID = project;
									tasks = PlanTaskState.findPlanProjectID(planProject.id);
								} else {
									task.authAccountID = AuthAccountState.data().id;
									task.authHouseholdID = null;
									tasks = PlanTaskState.personal();
								}
								if (tasks.length > 0) {
									task.position = Position.increase(tasks[tasks.length - 1].position, true);
								} else {
									task.position = "0";
								}

								AppState.setLayoutAppForm(FormOverlayPlanTask, task);
							},
						},
					},
					{
						...AppToolbarActions().newPlanProject,
						...{
							onclick: (): void => {
								const project = PlanProjectState.new();
								let projects: PlanProject[] = [];
								const filter = m.route.param().filter;
								const projectID = m.route.param().project;

								if (filter === "household") {
									project.authAccountID = null;
									project.authHouseholdID = AuthAccountState.data().primaryAuthHouseholdID;
									projects = PlanProjectState.household();
								} else if (projectID !== undefined) { // eslint-disable-line no-negated-condition
									const parent = PlanProjectState.findID(projectID);
									project.authAccountID = parent.authAccountID;
									project.authHouseholdID = parent.authHouseholdID;
									project.color = parent.color;
									project.parentID = parent.id;
									projects = PlanProjectState.findChildren(parent.id);
								} else {
									project.authAccountID = AuthAccountState.data().id;
									project.authHouseholdID = null;
									projects = PlanProjectState.personal();
								}

								if (projects.length > 0) {
									project.position = Position.increase(projects[projects.length - 1].position, true);
								} else {
									project.position = "0";
								}

								AppState.setLayoutAppForm(FormOverlayPlanProject, project);
							},
						},
					},
					{
						...AppToolbarActions().newShopItem,
						...{
							onclick: (): void => {
								AppState.setLayoutAppForm(FormOverlayShopItem, {
									...ShopItemState.new(),
									...{
										planProjectID: m.route.param().project,
									},
								});
							},
						},
					},
				],
			});

			state.dates = [];
			state.dateToday = Timestamp.midnight();
			state.dateTomorrow = Timestamp.midnight();
			state.dateTomorrow.addDays(1);
			state.dateWeek = Timestamp.midnight();
			state.dateWeek.addDays(6);

			state.projects = Stream.lift((_projects, _projectsNested, filter, tag) => {
				if (m.route.param().project !== undefined) {
					state.project = PlanProjectState.findID(m.route.param().project);
					state.project.children = PlanProjectState.findChildren(state.project.id);
					return [];
				}

				let projects = _projects;

				if (tag === "") {
					projects = PlanProjectState.nested();
				} else {
					return PlanProjectState.findTag(tag);
				}

				if (filter === "templates") {
					return [ // eslint-disable-line @typescript-eslint/consistent-type-assertions
						{
							...PlanProjectState.new(),
							...{
								authAccountID: AuthAccountState.data().id,
								color: AuthAccountState.data().preferences.colorPrimary === "" ?
									"teal" :
									AuthAccountState.data().preferences.colorPrimary,
								id: "personal",
								name: AuthAccountState.translate(WebGlobalPersonal),
								templateType: PlanTaskTemplateType.Account,
							},
						},
						{
							...PlanProjectState.new(),
							...{
								authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
								color: AuthAccountState.data().preferences.colorSecondary === "" ?
									"indigo" :
									AuthAccountState.data().preferences.colorSecondary,
								id: "household",
								name: AuthAccountState.translate(ObjectHousehold),
								templateType: PlanTaskTemplateType.Household,
							},
						},
						{
							...PlanProjectState.new(),
							...{
								authAccountID: AuthSessionState.data().admin === true ?
									null : // null for value
									AuthAccountState.data().id,
								color: AuthAccountState.data().preferences.colorAccent === "" ?
									"pink" :
									AuthAccountState.data().preferences.colorAccent,
								id: "homechart",
								name: "Homechart",
								templateType: PlanTaskTemplateType.Homechart,
							},
						},
					];
				}

				projects = projects.filter((project) => {
					switch(filter) {
					case "household":
						if (project.authHouseholdID === null) {
							return false;
						}

						break;
					case "personal":
						if (project.authAccountID === null) {
							return false;
						}

						break;
					case "today":
					case "upcoming":
						return false;
					}

					if (tag !== "" && ! project.tags.includes(tag)) {
						return false;
					}

					return true;
				});

				m.redraw();

				return projects;
			}, PlanProjectState.data, PlanProjectState.nested ,state.filter, state.tag);

			state.tasks = Stream.lift((_tasks, _tasksNested, filter, tag) => {
				if (filter === "templates" || m.route.param().project !== undefined || m.route.param().date !== undefined) {
					return [];
				}

				let tasks = _tasks;

				if (tag === "") {
					tasks = PlanTaskState.nested();
				} else {
					return PlanTaskState.findTag(tag);
				}

				tasks = tasks.filter((task) => {
					if (task.planProjectID !== null) {
						return false;
					}

					if (task.template) {
						return false;
					}

					switch (filter) {
					case "household":
						if (task.authHouseholdID === null) {
							return false;
						}

						break;
					case "personal":
						if (task.authAccountID === null) {
							return false;
						}

						break;
					case "today":
					case "upcoming":
						return false;
					}

					if (tag !== "" && ! task.tags.includes(tag)) {
						return false;
					}

					return true;
				});

				m.redraw();

				return tasks;
			}, PlanTaskState.data, PlanTaskState.nested, state.filter, state.tag);

			if (m.route.param().filter !== undefined) {
				state.filter(m.route.param().filter);
			}

			if (m.route.param().project !== undefined) {
				if (AuthAccountState.data().collapsedPlanProjects.includes(m.route.param().project)) {
					await AuthAccountState.collapsePlanProject(m.route.param().project);
				}
			}

			if (m.route.param().tag !== undefined) {
				state.tag(m.route.param().tag);
				state.filter(state.tag());
			}

			switch (state.filter()) {
			case "upcoming":
				state.dates.push(AuthAccountState.translate(WebPlanTasksTomorrow));
				for (let i = 2; i < 7; i++) {
					const d = Timestamp.fromString(state.dateToday.toString());
					d.addDays(i);
					state.dates.push(d.toCivilDate()
						.toJSON());
				}

			case "today": // eslint-disable-line no-fallthrough
				state.dates.unshift(AuthAccountState.translate(WebGlobalToday));
				state.dates.unshift(AuthAccountState.translate(WebPlanTasksOverdue));
			}

			if (m.route.param().date !== undefined) {
				state.filter("");
				state.dates = [
					m.route.param().date,
				];
			}

			Telemetry.spanEnd("PlanTasks");
		},
		onremove: (): void => {
			state.projects.end(true);
			state.tasks.end(true);
		},
		view: (): m.Children => {
			const loaded = PlanProjectState.isLoaded() && PlanTaskState.isLoaded() && ShopItemState.isLoaded();

			return [
				m("div.PlanTasks", {
					oncreate: (tvnode): void => {
						route = m.route.get();

						if (scroll[route] !== undefined) {
							tvnode.dom.scrollTop = scroll[route];
						}
					},
					onremove: (tvnode): void => {
						scroll[route] = tvnode.dom.scrollTop;
					},
				}, [
					m(Title, {
						loaded: loaded,
						tabs: [
							{
								active: m.route.param().filter === "today",
								count: PlanTaskState.getCountToday(),
								href: "/plan/tasks?filter=today",
								name: AuthAccountState.translate(WebGlobalToday),
							},
							{
								active: m.route.param().filter === "upcoming",
								count: PlanTaskState.getCountUpcoming(),
								href: "/plan/tasks?filter=upcoming",
								name: AuthAccountState.translate(WebGlobalUpcoming),
							},
							{
								active: m.route.param().filter === undefined && m.route.param().project === undefined && m.route.param().date === undefined,
								count: PlanTaskState.data().length,
								href: "/plan/tasks",
								name: AuthAccountState.translate(WebGlobalAll),
							},
							{
								active: m.route.param().filter === "templates",
								count: PlanTaskState.templates().length,
								href: "/plan/tasks?filter=templates",
								name: AuthAccountState.translate(WebGlobalTemplates),
							},
							{
								active: m.route.param().filter === "personal",
								count: PlanTaskState.getCountPersonal(),
								href: "/plan/tasks?filter=personal",
								name: AuthAccountState.translate(WebGlobalPersonal),
							},
							{
								active: m.route.param().filter === "household",
								count: PlanTaskState.getCountHousehold(),
								href: "/plan/tasks?filter=household",
								name: AuthAccountState.translate(ObjectHousehold),
							},
							...m.route.param().project !== undefined && state.project.parentID !== null ?
								[
									{
										active: false,
										href: `/plan/tasks?project=${state.project.parentID}`,
										name: PlanProjectState.findID(state.project.parentID).name,
									},
								] :
								[],
							...m.route.param().project === undefined ?
								[] :
								[
									{
										active: true,
										href: m.route.get(),
										name: state.project.name,
									},
								],
						],
					}),
					loaded ?
						m(Toolbar, {
							actions: state.filter() === "today" || state.filter() === "upcoming" ?
								[] :
								[
									{
										icon: Icons.Show,
										name: AuthAccountState.translate(WebGlobalActionShowCompleted),
										onclick: async (): Promise<void> => {
											return new Promise((resolve) => {
												state.showComplete(!state.showComplete());

												return resolve();
											});
										},
										permitted: true,
										requireOnline: false,
										secondary: state.showComplete(),
									},
								],
							filters: state.filter() === "today" || state.filter() === "upcoming" ?
								[] :
								[
									{
										icon: Icons.Tag,
										name: AuthAccountState.translate(WebGlobalActionShowTag),
										onclick: (e): void => {
											state.tag() === e ?
												state.tag("") :
												state.tag(e);
										},
										selected: (): string[] => {
											return[
												state.tag(),
											];
										},
										value: PlanProjectState.allTagNames(),
									},
								],
						}) :
						[],
					m("ul.PlanTasks__list", loaded ?
						[
							m(RenderObjects, {
								authAccountID: state.filter() === "personal" ?
									AuthAccountState.data().id :
									null, // null for value
								authHouseholdID: state.filter() === "personal" ?
									null : // null for value
									AuthAccountState.data().primaryAuthHouseholdID,
								id: null,
								items: [],
								tasks: state.tasks(),
							}),
							m(RenderHeaders, {
								headers: state.dates.length > 0 ?
									state.dates :
									state.project.id === null ?
										state.projects === null ?
											[] :
											state.projects() :
										[
											state.project,
										],
							}),
						] :
						[
							...Array(5),
						].map(() => {
							return m(`div.PlanTasks__item.PlanTasks__item--loading.${Animate.class(Animation.Pulse)}`, [
								m("span"),
								m("span"),
							]);
						})),
				]),
			];
		},
	};
}
