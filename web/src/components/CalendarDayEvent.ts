import "./CalendarDayEvent.css";

import { Icon } from "@lib/components/Icon";
import { Markdown } from "@lib/components/Markdown";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { CivilTime } from "@lib/types/CivilTime";
import { Color } from "@lib/types/Color";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { Animate, Animation } from "@lib/utilities/Animate";
import m from "mithril";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import type { CalendarEvent } from "../states/CalendarEvent";
import { CookRecipeState } from "../states/CookRecipe";
import { HealthItemState } from "../states/HealthItem";
import { Colors } from "../types/Colors";
import { FormOverlayBudgetTransaction } from "./FormOverlayBudgetTransaction";
import { FormOverlayCalendarEvent } from "./FormOverlayCalendarEvent";
import { FormOverlayCookMealPlan } from "./FormOverlayCookMealPlan";
import { FormOverlayHealthLogs } from "./FormOverlayHealthLogs";
import { FormOverlayPlanTask } from "./FormOverlayPlanTask";

export interface CalendarDayEventAttrs {
	/** Date for when CalendarDayEvent. */
	date: CivilDate,

	/** Whether the data for the CalendarDayEvent is loaded. */
	loaded: boolean,

	/** The event to create an view from. */
	event: CalendarEvent,
}

export function CalendarDayEvent (): m.Component<CalendarDayEventAttrs> {
	let expand = false;

	return {
		view: (vnode): m.Children => {
			const start = Timestamp.fromString(vnode.attrs.event.timestampStart!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
			start.addMinutes(vnode.attrs.event.travelTime);
			const end = Timestamp.fromString(vnode.attrs.event.timestampStart!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
			end.addMinutes(vnode.attrs.event.travelTime + vnode.attrs.event.duration);

			const color = vnode.attrs.event.color === "" ?
				vnode.attrs.event.participants.length > 0 && AuthHouseholdState.findMember(vnode.attrs.event.participants[0]).color === "" ?
					AuthAccountState.data().preferences.colorPrimary :
					AuthHouseholdState.findMember(vnode.attrs.event.participants[0]).color :
				vnode.attrs.event.color;

			return vnode.attrs.loaded ?
				m("div.CalendarDayEvent__item", {
					onclick: (e: m.Event<MouseEvent>) => {
						e.preventDefault();

						vnode.attrs.event.recurrenceDate = vnode.attrs.date.toJSON();

						if (vnode.attrs.event.budgetRecurrence !== undefined) {
							AppState.setLayoutAppForm(FormOverlayBudgetTransaction, vnode.attrs.event.budgetRecurrence);
							return;
						}
						if (vnode.attrs.event.cookMealPlans !== undefined) {
							return;
						} else if (vnode.attrs.event.healthLogInputs !== undefined && vnode.attrs.event.healthLogOutputs !== undefined) {
							AppState.setLayoutAppForm(FormOverlayHealthLogs, {
								authAccountID: vnode.attrs.event.authAccountID,
								date: vnode.attrs.date.toJSON(),
								logs: [
									...vnode.attrs.event.healthLogInputs,
									...vnode.attrs.event.healthLogOutputs,
								],
							} as unknown as Data);
							return;
						} else if (vnode.attrs.event.planTask !== undefined) {
							AppState.setLayoutAppForm(FormOverlayPlanTask, vnode.attrs.event.planTask);
							return;
						} else if (vnode.attrs.event.id === null) {
							vnode.attrs.event.dateStart = vnode.attrs.date.toJSON();
						}

						AppState.setLayoutAppForm(FormOverlayCalendarEvent, vnode.attrs.event);
					},
					style: {
						"background": Timestamp.now() < end && Timestamp.now() > start ?
							"linear-gradient(rgba(255, 255, 255, 0.3), rgba(0, 0, 0, 0))" :
							undefined,
						"background-color": Color.toHex(Colors.calendarEvent(color)),
						"color": Color.contentColor(color),
						"filter": vnode.attrs.event.duration !== 0 && Timestamp.now() > end || CivilDate.now() > Timestamp.fromString(vnode.attrs.event.timestampStart!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
							.toCivilDate() ?
							"var(--filter_light)" :
							undefined,
					},
				}, [
					m("span.CalendarDayEvent__event", [
						m("div.CalendarDayEvent__title", [
							m(Icon, {
								icon: vnode.attrs.event.icon === undefined ?
									Icons.Calendar :
									vnode.attrs.event.icon,
							}),
							m(Markdown, {
								value: vnode.attrs.event.name,
							}),
						]),
						vnode.attrs.event.duration !== 0 && vnode.attrs.event.duration % (60 * 24) !== 0 && (vnode.attrs.date.toJSON() === Timestamp.fromString(vnode.attrs.event.timestampStart!) // eslint-disable-line @typescript-eslint/no-non-null-assertion

							.toCivilDate()
							.toJSON() || vnode.attrs.date.toJSON() === end.toCivilDate()
							.toJSON()) ?
							m("span",
								`${vnode.attrs.date.toJSON() === Timestamp.fromString(vnode.attrs.event.timestampStart!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
									.toCivilDate()
									.toJSON() ?
									start.toCivilTime()
										.toString(AuthAccountState.data().preferences.formatTime24) :
									CivilTime.fromString("00:00")
										.toString(AuthAccountState.data().preferences.formatTime24)} - ${vnode.attrs.date.toJSON() === end.toCivilDate()
									.toJSON() ?
									end.toCivilTime()
										.toString(AuthAccountState.data().preferences.formatTime24) :
									CivilTime.fromString("00:00")
										.toString(AuthAccountState.data().preferences.formatTime24)}`) :
							[],
					]),
					vnode.attrs.event.participants.length > 0 || vnode.attrs.event.travelTime > 0 || vnode.attrs.event.location !== "" || vnode.attrs.event.details !== "" || vnode.attrs.event.cookMealPlans !== undefined ?
						m("div.CalendarDayEvent__description", [
							vnode.attrs.event.participants.length === 0 ?
								[] :
								vnode.attrs.event.participants.map((participant) => {
									const p = AuthHouseholdState.findMemberName(participant);

									return p === "" ?
										[] :
										m("p.CalendarDayEvent__participant", [
											m(Icon, {
												icon: Icons.Personal,
											}),
											m("span", AuthHouseholdState.findMemberName(participant)),
										]);
								}),
							vnode.attrs.event.travelTime > 0 ?
								m("p", [
									m(Icon, {
										icon: Icons.Warning,
									}),
									m("span", `Leave by ${Timestamp.fromString(vnode.attrs.event.timestampStart!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
										.toCivilTime()
										.toString(AuthAccountState.data().preferences.formatTime24)}`,
									),
								]) :
								[],
							vnode.attrs.event.location === "" ?
								[] :
								m("a.GlobalLink.CalendarDayEvent__location", {
									href: `https://www.google.com/maps/search/?api=1&query=${vnode.attrs.event.location}`,
									onclick: (e: m.Event<MouseEvent>) => {
										e.stopPropagation();
									},
									target: "_blank",
								}, [
									m(Icon, {
										icon: Icons.Location,
									}),
									m("span", vnode.attrs.event.location),
								]),
							vnode.attrs.event.details === "" ?
								[] :
								m("div.CalendarDayEvent__details", {
									onclick: (e: m.Event<MouseEvent>) => {
										e.stopPropagation();

										expand = !expand;
									},
								}, [
									vnode.attrs.event.id === null ?
										[] :
										m(Icon, {
											icon: expand ?
												Icons.UnfoldLess :
												Icons.UnfoldMore,
										}),
									m("div", {
										class: vnode.attrs.event.id !== null && expand ?
											"CalendarDayEvent__details--expand" :
											undefined,
									}, m(Markdown, {
										value: vnode.attrs.event.details,
									})),
								]),
							vnode.attrs.event.cookMealPlans === undefined ?
								[] :
								vnode.attrs.event.cookMealPlans.map((plan) => {
									const recipe = CookRecipeState.findID(plan.cookRecipeID);

									return m("div.CalendarDayEvent__extra", {
										onclick: () => {
											AppState.setLayoutAppForm(FormOverlayCookMealPlan, plan);
										},
									},
									m(Icon, {
										icon: Icons.CookMealPlan,
									}),
									plan.customRecipe === "" ?
										m(m.route.Link, {
											class: "GlobalLink",
											href: `/cook/recipes/${recipe.id}`,
										}, m("span", recipe.name)) :
										m("span", plan.customRecipe),
									);
								}),
							vnode.attrs.event.healthLogInputs !== undefined && vnode.attrs.event.healthLogInputs.length > 0 ?
								m("div.CalendarDayEvent__extra", [
									m("div.CalendarDayEvent__extra--container", vnode.attrs.event.healthLogInputs.map((log) => {
										const item = HealthItemState.findID(log.healthItemID);

										return m("div.GlobalLink", [
											m(Icon, {
												icon: Icons.HealthItemInput,
											}),
											m(m.route.Link, {
												class: "GlobalLink",
												href: `/health/items?type=inputs&id=${AuthHouseholdState.findMember(log.authAccountID).id}`,
											}, m("span", item.name)),
										]);
									})),
								]) :
								[],
							vnode.attrs.event.healthLogOutputs !== undefined && vnode.attrs.event.healthLogOutputs.length > 0 ?
								m("div.CalendarDayEvent__extra", [
									m("div.CalendarDayEvent__extra--container", vnode.attrs.event.healthLogOutputs.map((log) => {
										const item = HealthItemState.findID(log.healthItemID);

										return m("div.GlobalLink", {
											class: "GlobalLink",
										}, [
											m(Icon, {
												icon: Icons.HealthItemOutput,
											}),
											m(m.route.Link, {
												class: "GlobalLink",
												href: `/health/items?type=outputs&id=${AuthHouseholdState.findMember(log.authAccountID).id}`,
											}, m("span", item.name)),
										]);
									})),
								]) :
								[],
						]) :
						[],
				]) :
				m(`div.CalendarDayEvent__item.CalendarDayEvent__item--loading.${Animate.class(Animation.Pulse)}`);
		},
	};
}
