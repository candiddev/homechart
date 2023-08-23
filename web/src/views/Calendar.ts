import "./Calendar.css";

import { Button } from "@lib/components/Button";
import { Form } from "@lib/components/Form";
import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { Icon } from "@lib/components/Icon";
import { Or } from "@lib/components/Or";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import { Title } from "@lib/components/Title";
import { Toolbar } from "@lib/components/Toolbar";
import type { Err } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Color, ColorEnum } from "@lib/types/Color";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { Weekday } from "@lib/types/Weekday";
import type { YearMonth } from "@lib/types/YearMonth";
import { Clone } from "@lib/utilities/Clone";
import { PushPopStringArray } from "@lib/utilities/PushPopStringArray";
import { SetClass } from "@lib/utilities/SetClass";
import { ActionAdd, ActionCancel, ActionDelete, ActionNew, ActionShow, ActionUpdate } from "@lib/yaml8n";
import m from "mithril";
import Stream from "mithril/stream";

import { CalendarDay } from "../components/CalendarDay";
import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { FormOverlayCalendarEvent } from "../components/FormOverlayCalendarEvent";
import { FormOverlayCookMealPlan } from "../components/FormOverlayCookMealPlan";
import { FormOverlayHealthLogs } from "../components/FormOverlayHealthLogs";
import { FormOverlayPlanTask } from "../components/FormOverlayPlanTask";
import { FormShopItemIngredients } from "../components/FormShopItemIngredients";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { apiEndpoint } from "../services/API";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BudgetRecurrenceState } from "../states/BudgetRecurrence";
import type { CalendarEvent, CalendarEventRange } from "../states/CalendarEvent";
import { CalendarEventState } from "../states/CalendarEvent";
import type { CalendarICalendar } from "../states/CalendarICalendar";
import { CalendarICalendarState } from "../states/CalendarICalendar";
import type { CookMealPlan } from "../states/CookMealPlan";
import { CookMealPlanState } from "../states/CookMealPlan";
import { GlobalState } from "../states/Global";
import type { HealthLog } from "../states/HealthLog";
import { HealthLogState } from "../states/HealthLog";
import { PlanProjectState } from "../states/PlanProject";
import type { PlanTask } from "../states/PlanTask";
import { PlanTaskState } from "../states/PlanTask";
import { Colors } from "../types/Colors";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectCalendar, ObjectEvent, ObjectEvents, ObjectHealth, ObjectiCalendarFeed, ObjectiCalendarFeeds, ObjectLogs, ObjectMealPlan, ObjectMealPlans, ObjectTask, ObjectTasks, ObjectTransactions, WebCalendarDisableiCalendar, WebCalendarEnableiCalendar, WebCalendarGenerateNewiCalendarURL, WebCalendariCalendarURLTooltip, WebCalendarICSImport, WebCalendarICSImported, WebCalendarImportiCalendarFeed, WebCalendarOtherCalendars, WebCalendarOtherCalendarsAstronomy, WebCalendarShowCalendars, WebGlobalActionExportCalendar, WebGlobalActionImportCalendars, WebGlobalBudgetMonth, WebGlobalDisplay, WebGlobalDisplayDay, WebGlobalDisplayWeek, WebGlobalName, WebGlobalNameTooltip, WebGlobalRecipeIngredients, WebGlobalToday, WebGlobalURL } from "../yaml8n";

enum formVisible {
	None,
	AuthAccountIDICalendar,
	CalendarEvent,
	CalendarICalendar,
	CookMealPlan,
	HealthLogs,
	PlanTask,
	ShopItemIngredients,
}

const columnsAccounts = Stream<FilterType>({
	name: "",
	url: "", // eslint-disable-line sort-keys
	hidden: "", // eslint-disable-line sort-keys
});

const state: {
	dateRange: {
		from: CivilDate,
		to: CivilDate,
	},
	display: Stream<string>,
	form: formVisible,
	formCalendarICalendar: {
		data: CalendarICalendar,
		visible: boolean,
	},
	formCookMealPlan: CookMealPlan,
	formHealthLogsState: {
		authAccountID: NullUUID,
		date: NullCivilDate,
		logs: HealthLog[],
	},
	formICalendarTasks: boolean,
	formPlanTask: PlanTask,
	formShopItemIngredients: CookMealPlan[],
	from: YearMonth,
	next: CivilDate,
	picker: Stream<YearMonth>,
	previous: CivilDate,
	today: CivilDate,
} = {
	dateRange: {
		from: CivilDate.now(),
		to: CivilDate.now(),
	},
	display: Stream("week"),
	form: formVisible.None,
	formCalendarICalendar: {
		data: CalendarICalendarState.new(),
		visible: false,
	},
	formCookMealPlan: CookMealPlanState.new(),
	formHealthLogsState: {
		authAccountID: null,
		date: null,
		logs: [],
	},
	formICalendarTasks: true,
	formPlanTask: PlanTaskState.new(),
	formShopItemIngredients: [],
	from: CivilDate.now()
		.toYearMonth(),
	next: CivilDate.now(),
	picker: Stream(CivilDate.now()
		.toYearMonth()),
	previous: CivilDate.now(),
	today: CivilDate.now(),
};

export function Calendar (): m.Component {
	function toggleFormShopItemIngredients (visible: boolean): void {
		if (visible) {
			state.form = formVisible.ShopItemIngredients;
		} else {
			state.form = formVisible.None;
		}
	}

	function setDateRange (from: Timestamp): void {
		switch (state.display()) {
		case "day":
			const dateRange = state.dateRange;
			dateRange.from = from
				.toCivilDate();
			dateRange.to = CivilDate.fromString(dateRange.from
				.toJSON());
			state.dateRange = dateRange;

			const day = Timestamp.fromString(from
				.toString());
			day.addDays(1);
			state.next = day.toCivilDate();
			day.addDays(-2);
			state.previous = day.toCivilDate();

			break;
		case "month":
			state.dateRange = from
				.toCivilDateRangeCalendar(AuthAccountState.data().preferences.formatWeek8601);
			from.addDays(15);

			const month = Timestamp.fromString(from
				.toString());
			month.addMonths(1);
			state.next = month.toCivilDate();
			state.next.day = 1;
			month.addMonths(-2);
			state.previous = month.toCivilDate();
			state.previous.day = 1;
			break;
		default:
			state.dateRange = from
				.toCivilDateRangeWeek(AuthAccountState.data().preferences.formatWeek8601);

			state.next = Timestamp.fromCivilDate(state.dateRange.from)
				.toCivilDateWeekFrom(false);
			state.previous = Timestamp.fromCivilDate(state.dateRange.to)
				.toCivilDateWeekFrom(true);
		}
	}

	function setFormShopItemIngredients (cookMealPlans: CookMealPlan[]): void {
		state.formShopItemIngredients= Clone(cookMealPlans);
		toggleFormShopItemIngredients(true);
	}

	function newCalendarEvent (): CalendarEvent {
		const event = CalendarEventState.new();

		if (state.dateRange.from.toJSON() === state.dateRange.to.toJSON()) {
			event.dateStart = state.dateRange.to.toJSON();
		} else {
			event.dateStart = Timestamp.now()
				.toCivilDate()
				.toJSON();
		}

		const time = Timestamp.now();
		time.addMinutes(-1 * time.timestamp.getMinutes() + 60);
		event.timeStart = time.toCivilTime()
			.toString(true);

		return event;
	}

	const eventRanges = Stream.lift((_calendarEvents, _cookMealPlans, _healthLogs, _planProjects, _planTasks, picker, authAccount) => {
		const dateRange = Timestamp.fromCivilDate(CivilDate.fromString(`${picker.getYear()}-${picker.getMonth()}-01`))
			.toCivilDateRangeCalendar(AuthAccountState.data().preferences.formatWeek8601);

		if (picker !== state.from) {
			state.from = picker;
			setDateRange(Timestamp.fromCivilDate(CivilDate.fromString(`${picker.getYear()}-${picker.getMonth()}-01`)));
		}

		const events = [
			authAccount.preferences.hideCalendarEvents ?
				[] :
				CalendarEventState.findDateRange(dateRange.from, dateRange.to)(),
			GlobalState.hideComponentIncludes("Health") ?
				[] :
				HealthLogState.findDateRange(dateRange.from, dateRange.to)(),
			authAccount.preferences.hideCalendarBudgetRecurrences || GlobalState.hideComponentIncludes("Budget") ?
				[] :
				BudgetRecurrenceState.findDateRange(dateRange.from, dateRange.to)(),
			authAccount.preferences.hideCalendarCookMealPlans || GlobalState.hideComponentIncludes("Cook")?
				[] :
				CookMealPlanState.findDateRange(dateRange.from, dateRange.to)(),
			authAccount.preferences.hideCalendarPlanTasks || GlobalState.hideComponentIncludes("Plan")?
				[] :
				PlanTaskState.findDateRange(dateRange.from, dateRange.to)(),
		] as CalendarEventRange[];

		m.redraw();

		return events;
	}, CalendarEventState.data, CookMealPlanState.data, HealthLogState.data, PlanProjectState.data, PlanTaskState.data, state.picker, AuthAccountState.data);

	return {
		oninit: async (): Promise<void> => {
			Telemetry.spanStart("Calendar");

			AppState.setLayoutApp({
				...GetHelp("calendar"),
				breadcrumbs: [
					{
						name: AuthAccountState.translate(ObjectCalendar),
					},
				],
				toolbarActionButtons: [
					{
						...AppToolbarActions().newCalendarEvent,
						...{
							onclick: (): void => {
								AppState.setLayoutAppForm(FormOverlayCalendarEvent, {
									...CalendarEventState.new(),
									...{
										dateStart: state.dateRange.from.toJSON() === state.dateRange.to.toJSON() ?
											state.dateRange.to.toJSON() :
											CivilDate.now()
												.toJSON(),
									},
								});
							},
						},
					},
					{
						icon: Icons.ShopItem,
						name: AuthAccountState.translate(WebGlobalRecipeIngredients),
						onclick: (): void => {
							state.formShopItemIngredients = CookMealPlanState.data()
								.filter((plan) => {
									const date = CivilDate.fromString(plan.date as string);
									return date <= state.dateRange.to && date >= state.dateRange.from;
								});

							toggleFormShopItemIngredients(true);
						},
						permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true) && ! GlobalState.hideComponentIncludes("Shop"),
						requireOnline: true,
					},
					{
						...AppToolbarActions().newHealthLogs,
						...{
							onclick: (): void => {
								AppState.setLayoutAppForm(FormOverlayHealthLogs, {
									authAccountID: AuthAccountState.data().id,
									date: state.dateRange.from.toJSON() === state.dateRange.to.toJSON() ?
										state.dateRange.to.toJSON() :
										CivilDate.now()
											.toJSON(),
									id: null,
									logs: [],
								} as FormOverlayHealthLogs);
							},
						},
					},
					{
						...AppToolbarActions().newCookMealPlan,
						...{
							onclick: (): void => {
								AppState.setLayoutAppForm(FormOverlayCookMealPlan, {
									...CookMealPlanState.new(),
									...{
										date: state.dateRange.from.toJSON() === state.dateRange.to.toJSON() ?
											state.dateRange.to.toJSON() :
											CivilDate.now()
												.toJSON(),
									},
								});
							},
						},
					},
					{
						...AppToolbarActions().newPlanTask,
						...{
							onclick: (): void => {
								AppState.setLayoutAppForm(FormOverlayPlanTask, {
									...PlanTaskState.new(),
									...{
										dueDate:  state.dateRange.from.toJSON() === state.dateRange.to.toJSON() ?
											Timestamp.fromCivilDate(state.dateRange.to)
												.toString() :
											[],
									},
								});
							},
						},
					},
				],
			});

			if (m.route.param().display !== undefined) {
				state.display(m.route.param().display);
			}

			if (m.route.param().display === undefined && AppState.getSessionDisplay() === 0) {
				state.display("day");
			}

			let date = Timestamp.now();
			if (m.route.param().from !== undefined || m.route.param().from === "") {
				date = Timestamp.fromCivilDate(CivilDate.fromString(m.route.param().from));
			}

			state.picker(date
				.toCivilDate()
				.toYearMonth());
			setDateRange(date);

			Telemetry.spanEnd("Calendar");
		},
		view: (): m.Children => {
			const loaded = BudgetRecurrenceState.isLoaded() && CalendarEventState.isLoaded() && CookMealPlanState.isLoaded() && PlanTaskState.isLoaded();

			return [
				m("div.Calendar__picker", [
					m("div.Calendar__title-container#picker-title", [
						m(Icon, {
							icon: Icons.Previous,
							onclick: async () => {
								state.picker(state.picker()
									.addMonths(-1));
							},
						}),
						m("input.FormItem__field.Calendar__title", {
							oninput: (e: m.Input) => {
								if (e.target.value !== "") {
									const yearMonth = state.picker();
									yearMonth.fromInput(e.target.value);
									state.picker(yearMonth);
								}
							},
							type: "month",
							value: state.picker()
								.toValue(),
						}),
						m(Icon, {
							icon: Icons.Next,
							onclick: async () => {
								state.picker(state.picker()
									.addMonths(1));
							},
						}),
					]),
					m("div.Calendar__calendar.Calendar__calendar--picker#picker", [
						Weekday.getValues(AuthAccountState.data().preferences.formatWeek8601)
							.map((day) => {
								return m("span.Calendar__date.Calendar__date--day", {
									key: day,
								}, m("span", day[0]));
							}),
						Timestamp.getCivilDatesFromDateRange(Timestamp.fromCivilDate(CivilDate.fromString(`${state.picker()
							.getYear()}-${state.picker()
							.getMonth()}-01`))
							.toCivilDateRangeCalendar(AuthAccountState.data().preferences.formatWeek8601))
							.map((date) => {
								return m(m.route.Link, {
									class: SetClass({
										"Calendar__date": true,
										"Calendar__date--active": date.valueOf() === state.dateRange.from.valueOf() && date.valueOf() === state.dateRange.to.valueOf() || date.valueOf() >= state.dateRange.from.valueOf() && date.valueOf() <= state.dateRange.to.valueOf(),
										"Calendar__date--active-end": date.valueOf() === state.dateRange.to.valueOf(),
										"Calendar__date--active-start": date.valueOf() === state.dateRange.from.valueOf(),
										"Calendar__date--outside": date.getMonth() !== state.picker()
											.getMonth(),
										"Calendar__date--today": date.valueOf() === state.today.valueOf(),
									}),
									href: `${m.parsePathname(m.route.get()).path}?display=${state.display()}&from=${date.toJSON()}`,
									key: date.valueOf(),
									options: {
										state: {
											key: Date.now(),
										},
									},
								}, [
									date.day,
									m("div", eventRanges()
										.map((range) => {
											return range[date.toJSON()] === undefined ?
												[] :
												m("span", {
													style: {
														color: range[date.toJSON()][0].color === ColorEnum.Default || range[date.toJSON()][0].id !== null ?
															"var(--color_primary)" :
															`var(--color_${Color.getValue(range[date.toJSON()][0].color)
																.toLowerCase()})`,
													},
												}, "•");
										}),
									),
								]);
							}),
					]),
				]),
				m("div.Calendar__container", [
					m(Title, {
						buttonLeft: {
							href: `${m.buildPathname(m.parsePathname(m.route.get()).path, {
								display: state.display(),
								from: state.previous.toJSON(),
							})}`,
							icon: Icons.Previous,
							name: state.previous.toString(AuthAccountState.data().preferences.formatDateOrder, AuthAccountState.data().preferences.formatDateSeparator),
							permitted: true,
							requireOnline: true,
						},
						buttonRight: {
							href: `${m.buildPathname(m.parsePathname(m.route.get()).path, {
								display: state.display(),
								from: state.next.toJSON(),
							})}`,
							icon: Icons.Next,
							iconRight: true,
							name: state.next.toString(AuthAccountState.data().preferences.formatDateOrder, AuthAccountState.data().preferences.formatDateSeparator),
							permitted: true,
							requireOnline: true,
						},
						name: state.display() === "month" ?
							state.picker()
								.toString() :
							AppState.formatCivilDate(state.dateRange.from),
					}),
					m(Toolbar, {
						actions: [
							{
								icon: Icons.Calendar,
								name: AuthAccountState.translate(WebGlobalActionImportCalendars),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										state.form = formVisible.CalendarICalendar;
										return resolve();
									});
								},
								permitted: true,
								primary: true,
								requireOnline: true,
							},
							{
								accent: true,
								icon: Icons.Calendar,
								name: AuthAccountState.translate(WebGlobalActionExportCalendar),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										state.form = formVisible.AuthAccountIDICalendar;
										return resolve();
									});
								},
								permitted: true,
								requireOnline: true,
								secondary: true,
							},
						],
						filters: [
							{
								name: AuthAccountState.translate(WebGlobalDisplay),
								onclick: (e): void => {
									m.route.set(m.parsePathname(m.route.get()).path, {
										display: e === "today" ?
											state.display() :
											e,
										from: e === "today" ?
											state.today :
											m.route.param().from,
									}, {
										state: {
											key: Date.now(),
										},
									});
								},
								selected: (): string[] => {
									return [
										state.today.valueOf() >= state.dateRange.from.valueOf() && state.today.valueOf() <= state.dateRange.to.valueOf() ?
											"today" :
											"",
										state.display(),
									];
								},
								value: [
									{
										id: "today",
										name: AuthAccountState.translate(WebGlobalToday),
									},
									{
										id: "day",
										name: AuthAccountState.translate(WebGlobalDisplayDay),
									},
									{
										id: "week",
										name: AuthAccountState.translate(WebGlobalDisplayWeek),
									},
									...AppState.getSessionDisplay() === DisplayEnum.XLarge ?
										[
											{
												id: "month",
												name: AuthAccountState.translate(WebGlobalBudgetMonth),
											},
										] :
										[],
								],
							},
							{
								name: AuthAccountState.translate(WebCalendarShowCalendars),
								onclick: async (e): Promise<void | Err> => {
									if (e.startsWith("health")) {
										await AuthAccountState.hideCalendarHealthLogs(AuthHouseholdState.findMember(e.replace("health_", "")).id);
									} else {
										switch (e) {
										case "events":
											return AuthAccountState.update({
												...AuthAccountState.data(),
												...{
													preferences: {
														...AuthAccountState.data().preferences,
														...{
															hideCalendarEvents: !AuthAccountState.data().preferences.hideCalendarEvents,
														},
													},
												},
											}, true);
										case "meals":
											return AuthAccountState.update({
												...AuthAccountState.data(),
												...{
													preferences: {
														...AuthAccountState.data().preferences,
														...{
															hideCalendarCookMealPlans: !AuthAccountState.data().preferences.hideCalendarCookMealPlans,
														},
													},
												},
											}, true);
										case "tasks":
											return AuthAccountState.update({
												...AuthAccountState.data(),
												...{
													preferences: {
														...AuthAccountState.data().preferences,
														...{
															hideCalendarPlanTasks: !AuthAccountState.data().preferences.hideCalendarPlanTasks,
														},
													},
												},
											}, true);
										case "transactions":
											return AuthAccountState.update({
												...AuthAccountState.data(),
												...{
													preferences: {
														...AuthAccountState.data().preferences,
														...{
															hideCalendarBudgetRecurrences: !AuthAccountState.data().preferences.hideCalendarBudgetRecurrences,
														},
													},
												},
											}, true);
										}
									}
								},
								selected: (): string[] => {
									return [
										AuthAccountState.data().preferences.hideCalendarEvents ?
											"" :
											"events",
										...AuthHouseholdState.members()
											.map((member) => {
												if (! AuthAccountState.data().preferences.hideCalendarHealthLogs.includes(`${member.id}`)) {
													return `health_${member.name}`;
												}

												return "";
											}),
										AuthAccountState.data().preferences.hideCalendarCookMealPlans ?
											"" :
											"meals",
										AuthAccountState.data().preferences.hideCalendarPlanTasks ?
											"" :
											"tasks",
										AuthAccountState.data().preferences.hideCalendarBudgetRecurrences ?
											"" :
											"transactions",
									];
								},
								value: [
									{
										color: Colors.calendarEvent(AuthAccountState.data().preferences.colorPrimary),
										icon: Icons.Calendar,
										id: "events",
										name: AuthAccountState.translate(ObjectEvents),
									},
									...GlobalState.hideComponentIncludes("Health") ?
										[] :
										AuthHouseholdState.findMemberNames(null, true)
											.map((name) => {
												const member = AuthHouseholdState.findMember(name);

												return {
													color: member.color,
													icon: Icons.Health,
													id: `health_${member.name}`,
													name: `${AuthAccountState.translate(ObjectHealth)} - ${member.name}`,
												};
											}),
									...GlobalState.hideComponentIncludes("Cook") ?
										[] :
										[
											{
												color: Colors.cookMealPlan(AuthHouseholdState.findID(AuthAccountState.data().primaryAuthHouseholdID).preferences.colorCookMealPlanEvents),
												icon: Icons.CookMealPlan,
												id: "meals",
												name: AuthAccountState.translate(ObjectMealPlans),
											},
										],
									...GlobalState.hideComponentIncludes("Plan") ?
										[] :
										[
											{
												color: Colors.planTask(AuthHouseholdState.findID(AuthAccountState.data().primaryAuthHouseholdID).preferences.colorPlanTaskEvents, ColorEnum.Default),
												icon: Icons.PlanTask,
												id: "tasks",
												name: AuthAccountState.translate(ObjectTasks),
											},
										],
									...GlobalState.hideComponentIncludes("Budget") ?
										[] :
										[
											{
												color: Colors.budgetRecurrrence(AuthHouseholdState.findID(AuthAccountState.data().primaryAuthHouseholdID).preferences.colorBudgetRecurrenceEvents),
												icon: Icons.BudgetTransaction,
												id: "transactions",
												name: AuthAccountState.translate(ObjectTransactions),
											},
										],
								],
							},
							{
								name: AuthAccountState.translate(WebCalendarOtherCalendars),
								onclick: async (e): Promise<void | Err> => {
									switch (e) {
									case "astronomy":
										return AuthAccountState.update({
											...AuthAccountState.data(),
											...{
												preferences: {
													...AuthAccountState.data().preferences,
													...{
														showCalendarEventAstronomy: !AuthAccountState.data().preferences.showCalendarEventAstronomy,
													},
												},
											},
										}, true);
									case "holidays_CA":
										return AuthAccountState.update({
											...AuthAccountState.data(),
											...{
												preferences: {
													...AuthAccountState.data().preferences,
													...{
														showCalendarEventHolidaysCA: !AuthAccountState.data().preferences.showCalendarEventHolidaysCA,
													},
												},
											},
										}, true);
									case "holidays_UK":
										return AuthAccountState.update({
											...AuthAccountState.data(),
											...{
												preferences: {
													...AuthAccountState.data().preferences,
													...{
														showCalendarEventHolidaysUK: !AuthAccountState.data().preferences.showCalendarEventHolidaysUK,
													},
												},
											},
										}, true);
									case "holidays_US":
										return AuthAccountState.update({
											...AuthAccountState.data(),
											...{
												preferences: {
													...AuthAccountState.data().preferences,
													...{
														showCalendarEventHolidaysUS: !AuthAccountState.data().preferences.showCalendarEventHolidaysUS,
													},
												},
											},
										}, true);
									default:
										const c = CalendarICalendarState.data()
											.find((icalendar) => {
												return icalendar.name === e;
											});

										if (c !== undefined && c.id !== null) {
											return AuthAccountState.update({
												...AuthAccountState.data(),
												...{
													hideCalendarICalendars: PushPopStringArray(c.id, AuthAccountState.data().hideCalendarICalendars),
												},
											});
										}
									}

								},
								selected: (): string[] => {
									return [
										AuthAccountState.data().preferences.showCalendarEventAstronomy ?
											"astronomy" :
											"",
										AuthAccountState.data().preferences.showCalendarEventHolidaysCA ?
											"holidays_CA" :
											"",
										AuthAccountState.data().preferences.showCalendarEventHolidaysUK ?
											"holidays_UK" :
											"",
										AuthAccountState.data().preferences.showCalendarEventHolidaysUS ?
											"holidays_US" :
											"",
										...CalendarICalendarState.data()
											.filter((icalendar) => {
												return ! AuthAccountState.data().hideCalendarICalendars.includes(`${icalendar.id}`);
											})
											.map((icalendar) => {
												return icalendar.name;
											}),
									];
								},
								value: [
									{
										id: "astronomy",
										name: AuthAccountState.translate(WebCalendarOtherCalendarsAstronomy),
									},
									{
										id: "holidays_CA",
										name: "Holidays - CA",
									},
									{
										id: "holidays_UK",
										name: "Holidays - UK",
									},
									{
										id: "holidays_US",
										name: "Holidays - US",
									},
									...CalendarICalendarState.names(),
								],
							},
						],
					}),
					state.form === formVisible.AuthAccountIDICalendar ?
						m(Form, {
							buttons: [
								{
									name: AuthAccountState.translate(ActionCancel),
									onclick: async (): Promise<void> => {
										return new Promise((resolve) => {
											state.form = formVisible.None;
											return resolve();
										});
									},
									permitted: true,
									requireOnline: true,
								},
							],
							overlay: true,
							title: {
								name: AuthAccountState.translate(WebGlobalActionExportCalendar),
							},
						}, [
							m(FormItem, {
								name: "Homechart iCalendar URL",
								textArea: {
									disabled: true,
									oninput: () => {},
									value: AuthAccountState.data().icalendarID === null ?
										"iCalendar access disabled." :
										`<${apiEndpoint().hostname === "" ?
											document.location.origin :
											apiEndpoint().hostname}/api/v1/icalendar/${AuthAccountState.data().icalendarID}.ics${state.formICalendarTasks ?
											"" :
											"?plantasks=no"}>`,
								},
								tooltip: "",
							}),
							AuthAccountState.data().icalendarID === null ?
								[] :
								m(FormCheckbox, {
									name: `${AuthAccountState.translate(ActionShow)} ${AuthAccountState.translate(ObjectTasks)}`,
									onclick: () => {
										state.formICalendarTasks = ! state.formICalendarTasks;
									},
									value: state.formICalendarTasks,
								}),
							m(Button, {
								accent: true,
								name:  AuthAccountState.translate(WebCalendarDisableiCalendar),
								onclick: async (): Promise<void> => {
									return AuthAccountState.deleteICalendarID();
								},
								permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true) && AuthAccountState.data().icalendarID !== null,
								requireOnline: true,
							}),
							m(Button, {
								name: AuthAccountState.data().icalendarID === null ?
									AuthAccountState.translate(WebCalendarEnableiCalendar) :
									AuthAccountState.translate(WebCalendarGenerateNewiCalendarURL),
								onclick: async (): Promise<void> => {
									return AuthAccountState.updateICalendarID()
										.then(() => {
											m.redraw();
										});
								},
								permitted: GlobalState.permitted(PermissionComponentsEnum.Auth, true),
								primary: true,
								requireOnline: true,
							}),
						]) :
						[],
					state.form === formVisible.CalendarICalendar ?
						m(Form, {
							buttons: [
								{
									name: AuthAccountState.translate(ActionCancel),
									onclick: async (): Promise<void> => {
										return new Promise((resolve) => {
											state.form = formVisible.None;

											return resolve();
										});
									},
									permitted: true,
									requireOnline: false,
								},
							],
							overlay: true,
							title: {
								name: AuthAccountState.translate(WebGlobalActionImportCalendars),
							},
						}, [
							m(Table, {
								actions: [],
								data: CalendarICalendarState.data(),
								editOnclick: (i: CalendarICalendar) => {
									state.formCalendarICalendar.data = i;
									state.formCalendarICalendar.visible = true;
								},
								filters: [],
								id: "icalendars",
								loaded: true,
								noFilters: true,
								noNewButton: true,
								staticColumns: true,
								tableColumns: [
									{
										name: AuthAccountState.translate(WebGlobalName),
										noFilter: true,
										property: "name",
									},
									{
										name: AuthAccountState.translate(WebGlobalURL),
										noFilter: true,
										property: "url",
										type: TableDataType.Link,
									},
								],
								tableColumnsNameEnabled: columnsAccounts,
								title: {
									name: AuthAccountState.translate(ObjectiCalendarFeeds),
								},
							}),
							m(Button, {
								icon: Icons.Add,
								name: AuthAccountState.translate(WebCalendarImportiCalendarFeed),
								onclick: async (): Promise<void> => {
									return new Promise((resolve) => {
										state.formCalendarICalendar = {
											data: CalendarICalendarState.new(),
											visible: true,
										};

										return resolve();
									});
								},
								permitted: true,
								primary: true,
								requireOnline: true,
							}),
							state.formCalendarICalendar.visible ?
								m(Form, {
									buttons: [
										{
											accent: true,
											name: AuthAccountState.translate(ActionDelete),
											onclick: async (): Promise<void> => {
												return CalendarICalendarState.delete(state.formCalendarICalendar.data.id)
													.then(() => {
														state.formCalendarICalendar.visible = false;
													});
											},
											permitted: state.formCalendarICalendar.data.id !== null && GlobalState.permitted(PermissionComponentsEnum.Calendar, true, state.formCalendarICalendar.data.authHouseholdID),
											requireOnline: false,
										},
										{
											name: AuthAccountState.translate(ActionCancel),
											onclick: async (): Promise<void> => {
												return new Promise((resolve) => {
													state.formCalendarICalendar.visible = false;

													return resolve();
												});
											},
											permitted: true,
											requireOnline: false,
										},
										{
											name: state.formCalendarICalendar.data.id === null ?
												AuthAccountState.translate(ActionAdd) :
												AuthAccountState.translate(ActionUpdate),
											onclick: async (): Promise<void> => {
												if (state.formCalendarICalendar.data.id === null) {
													return CalendarICalendarState.create(state.formCalendarICalendar.data)
														.then(() => {
															state.formCalendarICalendar.visible = false;
														});
												}

												return CalendarICalendarState.update(state.formCalendarICalendar.data)
													.then(() => {
														state.formCalendarICalendar.visible = false;
													});
											},
											permitted: GlobalState.permitted(PermissionComponentsEnum.Calendar, true, state.formCalendarICalendar.data.authHouseholdID),
											primary: true,
											requireOnline: false,
										},
									],
									overlay: true,
									title: {
										name: `${state.formCalendarICalendar.data.id === null ?
											AuthAccountState.translate(ActionNew) :
											AuthAccountState.translate(ActionUpdate)} ${AuthAccountState.translate(ObjectiCalendarFeed)}`,

									},
								}, [
									m(FormItemSelectAuthHousehold, {
										item: state.formCalendarICalendar.data,
										permissionComponent: PermissionComponentsEnum.Calendar,
									}),
									m(FormItem, {
										input: {
											oninput: (e: string): void => {
												state.formCalendarICalendar.data.name = e;
											},
											required: true,
											type: "text",
											value: state.formCalendarICalendar.data.name,
										},
										name: AuthAccountState.translate(WebGlobalName),
										tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
									}),
									state.formCalendarICalendar.data.ics === "" ?
										[
											m(FormItem, {
												input: {
													oninput: (e: string): void => {
														state.formCalendarICalendar.data.url = e;
													},
													type: "url",
													value: state.formCalendarICalendar.data.url,
												},
												name: AuthAccountState.translate(WebGlobalURL),
												tooltip: AuthAccountState.translate(WebCalendariCalendarURLTooltip),
											}),
											m(Or),
										] :
										[],
									m(Button, {
										accept: "text/calendar",
										name: state.formCalendarICalendar.data.ics === "" ?
											AuthAccountState.translate(WebCalendarICSImport) :
											AuthAccountState.translate(WebCalendarICSImported),
										oninput: async (file) => {
											const reader = new FileReader();
											reader.onload = async (): Promise<void> => {
												if (typeof reader.result === "string") {
													state.formCalendarICalendar.data.ics = reader.result;

													m.redraw();
												}
											};

											reader.readAsText(file);
										},
										permitted: true,
										primary: true,
										requireOnline: true,
									}),
								]) :
								[],
						]) :
						[],
					m(FormShopItemIngredients, {
						cookMealPlans: state.formShopItemIngredients,
						toggle: toggleFormShopItemIngredients,
						visible: state.form === formVisible.ShopItemIngredients,
					}),
					m("div.Calendar__calendar#calendar", [
						state.display() === "day" ?
							[] :
							Weekday.getValues(AuthAccountState.data().preferences.formatWeek8601)
								.map((weekday) => {
									return m("div.CalendarDay__container.CalendarDay__container--day", m("p", weekday));
								}),
						Timestamp.getCivilDatesFromDateRange(state.dateRange)
							.map((date: CivilDate, i) => {
								return m(CalendarDay, {
									date: date,
									dropdownItems: [
										{
											icon: Icons.Calendar,
											name: AuthAccountState.translate(ObjectEvent),
											onclick: (): void => {
												AppState.setLayoutAppForm(FormOverlayCalendarEvent, {
													...newCalendarEvent(),
													...{
														dateStart: date.toJSON(),
													},
												});
											},
											permitted: GlobalState.permitted(PermissionComponentsEnum.Calendar, true),
											requireOnline: true,
										},
										{
											icon: Icons.CookMealPlan,
											name: AuthAccountState.translate(ObjectMealPlan),
											onclick: (): void => {
												AppState.setLayoutAppForm(FormOverlayCookMealPlan, {
													...CookMealPlanState.new(),
													...{
														date: date.toJSON(),
													},
												});
											},
											permitted: GlobalState.permitted(PermissionComponentsEnum.Cook, true),
											requireOnline: true,
										},
										{
											icon: Icons.Health,
											name: AuthAccountState.translate(ObjectLogs),
											onclick: (): void => {
												AppState.setLayoutAppForm(FormOverlayHealthLogs, {
													authAccountID: AuthAccountState.data().id,
													date: date.toJSON(),
													id: null,
													logs: [],
												} as FormOverlayHealthLogs);
											},
											permitted: GlobalState.permitted(PermissionComponentsEnum.Health, true),
											requireOnline: true,
										},
										{
											icon: Icons.PlanTask,
											name: AuthAccountState.translate(ObjectTask),
											onclick: (): void => {
												AppState.setLayoutAppForm(FormOverlayPlanTask, {
													...PlanTaskState.new(),
													...{
														authAccountID: AuthAccountState.data().id,
														dueDate: Timestamp.fromCivilDate(date)
															.toString(),
													},
												});
											},
											permitted: GlobalState.permitted(PermissionComponentsEnum.Plan, true),
											requireOnline: true,
										},
										{
											icon: Icons.ShopItem,
											name: AuthAccountState.translate(WebGlobalRecipeIngredients),
											onclick: (): void => {
												setFormShopItemIngredients(CookMealPlanState.data()
													.filter((plan) => {
														return plan.date === date.toJSON();
													}));
											},
											permitted: GlobalState.permitted(PermissionComponentsEnum.Shop, true) && eventRanges()[2][date.toJSON()] !== undefined && eventRanges()[2][date.toJSON()].length > 0,
											requireOnline: true,
										},
									],
									events: loaded ?
										eventRanges()
											.map((range) => {
												let events = [] as CalendarEvent[];

												if (range[date.toJSON()] !== undefined) {
													events = events.concat(range[date.toJSON()]);
												}

												return events;
											})
											.flat()
											.sort((a, b) => {
												return a.timestampStart! === b.timestampStart! ? // eslint-disable-line @typescript-eslint/no-non-null-assertion
													0 :
													a.timestampStart! > b.timestampStart! ? // eslint-disable-line @typescript-eslint/no-non-null-assertion
														1 :
														-1;
											}) :
										[
											...Array(i === 0 ?
												3 :
												i === 1 ?
													2 :
													i === 2 ?
														1 :
														0),
										].map(() => {
											return CalendarEventState.new();
										}),
									loaded: loaded,
									picker: state.picker(),
								});
							}),
					]),
				]),
			];
		},
	};
}
