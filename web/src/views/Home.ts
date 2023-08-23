import "./Home.css";

import { Form } from "@lib/components/Form";
import { Icon } from "@lib/components/Icon";
import { Markdown } from "@lib/components/Markdown";
import { Table } from "@lib/components/Table";
import { Title } from "@lib/components/Title";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { DisplayEnum } from "@lib/types/Display";
import type { FilterType } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { StringToID } from "@lib/utilities/StringToID";
import m from "mithril";
import Stream from "mithril/stream";

import { CalendarDayEvent } from "../components/CalendarDayEvent";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BookmarkState } from "../states/Bookmark";
import { BudgetRecurrenceState } from "../states/BudgetRecurrence";
import type { CalendarEvent } from "../states/CalendarEvent";
import { CalendarEventState } from "../states/CalendarEvent";
import type { Change } from "../states/Change";
import { ChangeState } from "../states/Change";
import { CookMealPlanState } from "../states/CookMealPlan";
import { PlanProjectState } from "../states/PlanProject";
import { PlanTaskState } from "../states/PlanTask";
import { GetHelp } from "../utilities/GetHelp";
import { ObjectBookmarks, ObjectChange, WebGlobalDate, WebHomeAgenda, WebHomeAgendaNothing, WebHomeChanges } from "../yaml8n";

export function Home (): m.Component {
	function change (): m.Component<{
		authAccountID: NullUUID,
		change: string,
		names: string[],
	}> {
		return  {
			view: (vnode): m.Children => {
				const member = AuthHouseholdState.findMember(vnode.attrs.authAccountID);

				return m("div.Home__change", [
					m("p", [
						m("span", `${member.name === "" ?
							member.emailAddress :
							member.name} `),
						m(Markdown, {
							value: ` ${vnode.attrs.change}: `,
						}),
					]),
					m(Markdown, {
						value: vnode.attrs.names.join(", "),
					}),
				]);
			},
		};
	}
	const now = CivilDate.now();

	const columns = Stream<FilterType>({
		updated: "",
		change: "", // eslint-disable-line sort-keys
	});

	let events: Stream<CalendarEvent[]>;

	return {
		oncreate: (): void => {
			if (AppState.getSessionDisplay() === DisplayEnum.XLarge) {
				AppState.toggleLayoutAppMenuOpen(true);
			}
		},
		oninit: (): void => {
			events = Stream.lift((_budget, _calendarEvents, _cookMealPlanState, _planProjects, _planTasks) => {
				const events: CalendarEvent[] = [];

				const budget = BudgetRecurrenceState.findDateRange(now, now)();
				if (budget[now.toJSON()] !== undefined) {
					events.push(...budget[now.toJSON()]);
				}

				const calendar = CalendarEventState.findDateRange(now, now)();
				if (calendar[now.toJSON()] !== undefined) {
					events.push(...calendar[now.toJSON()]);
				}

				const cook = CookMealPlanState.findDateRange(now, now)();
				if (cook[now.toJSON()] !== undefined) {
					events.push(...cook[now.toJSON()]);
				}

				const plan = PlanTaskState.findDateRange(now, now)();
				if (plan[now.toJSON()] !== undefined) {
					events.push(...plan[now.toJSON()]);
				}
				return events.sort((a, b) => {
					return a.timestampStart! === b.timestampStart! ? // eslint-disable-line @typescript-eslint/no-non-null-assertion
						0 :
						a.timestampStart! > b.timestampStart! ? // eslint-disable-line @typescript-eslint/no-non-null-assertion
							1 :
							-1;
				});
			}, BudgetRecurrenceState.data, CalendarEventState.data, CookMealPlanState.data, PlanProjectState.data, PlanTaskState.data),

			AppState.setLayoutApp({
				...GetHelp(),
				breadcrumbs: [],
				toolbarActionButtons: [],
			});
		},
		onremove: (): void => {
			events.end(true);
		},
		view: (): m.Children => {
			return m("div.Home#home", [
				m("div.Home__contents", [
					m(Form, {
						title: {
							name: AuthAccountState.translate(WebHomeAgenda),
						},
						wrap: true,
					}, BudgetRecurrenceState.isLoaded() && CalendarEventState.isLoaded() && CookMealPlanState.isLoaded() && PlanTaskState.isLoaded() ?
						events().length > 0 ?
							events()
								.map((event) => {
									return m(CalendarDayEvent, {
										date: now,
										event: event,
										loaded: true,
									});
								}) :
							[
								m("div.Home__nothing", [
									m(Icon, {
										classes:"Home__icon",
										icon: Icons.NotFound,
									}),
									m("p.Home__agenda", AuthAccountState.translate(WebHomeAgendaNothing)),
								]),
							] :
						[
							...Array(5),
						].map(() => {
							return m(CalendarDayEvent, {
								date: now,
								event: CalendarEventState.new(),
								loaded: false,
							});
						}),
					),
					m("div.Home__right", [
						BookmarkState.data().length > 0 ?
							m("div.Home__bookmarks", [
								m(Title, {
									name: AuthAccountState.translate(ObjectBookmarks),
								}),
								m("div.Home__bookmarks-buttons", BookmarkState.data()
									.map((bookmark) => {
										if (! bookmark.home) {
											return null;
										}

										return m(bookmark.link.startsWith("/") ?
											m.route.Link :
											"a" as any, { // eslint-disable-line @typescript-eslint/no-explicit-any
											class: "Button Home__bookmarks-button",
											href: bookmark.link,
											id: `bookmark${StringToID(bookmark.name)}`,
											target: bookmark.link.startsWith("/") ?
												undefined :
												"_blank",
										}, [
											bookmark.iconLink === "" ?
												m(Icon, {
													icon: bookmark.iconName,
												}) :
												m("img", {
													src: bookmark.iconLink,
												}),
											m("span", bookmark.name),
										]);
									})),
							]) :
							[],
						m(Table, {
							actions: [],
							data: ChangeState.table(),
							filters: [],
							getKey: (c: Change) => {
								return `${c.id}`;
							},
							id: "changes",
							loaded: ChangeState.isLoaded(),
							noFilters: true,
							noNewButton: true,
							staticColumns: true,
							tableColumns: [
								{
									formatter: (c: {
										updated: NullTimestamp,
									}): string => {
										return Timestamp.fromString(`${c.updated}`)
											.toPrettyString(AuthAccountState.data().preferences.formatDateOrder, AuthAccountState.data().preferences.formatDateSeparator, AuthAccountState.data().preferences.formatTime24);
									},
									name: AuthAccountState.translate(WebGlobalDate),
									property: "updated",
								},
								{
									name: AuthAccountState.translate(ObjectChange),
									property: "change",
									render: change,
								},
							],
							tableColumnsNameEnabled: columns,
							title: {
								name: AuthAccountState.translate(WebHomeChanges),
							},
						}),
					]),
				]),
			]);
		},
	};
}
