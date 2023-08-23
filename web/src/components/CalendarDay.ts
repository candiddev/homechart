import "./CalendarDay.css";

import type { DropdownMenuAttrsItem } from "@lib/components/DropdownMenu";
import { DropdownMenu } from "@lib/components/DropdownMenu";
import { Icon } from "@lib/components/Icon";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import type { YearMonth } from "@lib/types/YearMonth";
import m from "mithril";

import { CalendarDayEvent } from "../components/CalendarDayEvent";
import type { CalendarEvent } from "../states/CalendarEvent";

export interface CalendarDayAttrs {
	/** A list of events for the day to display. */
	events: CalendarEvent[],

	/** The date of the day. */
	date: CivilDate,

	/** A list of dropdowns to render for the day. */
	dropdownItems: DropdownMenuAttrsItem[],

	/** Whether the day is loaded. */
	loaded: boolean,

	/** The picker year/month. */
	picker: YearMonth,
}

export function CalendarDay (): m.Component<CalendarDayAttrs> {
	return {
		view: (vnode): m.Children => {
			return m("div.CalendarDay__container#calendar-day", {
				class: vnode.attrs.picker.month === vnode.attrs.date.month ?
					undefined :
					"CalendarDay__container--outside",
				key: vnode.attrs.date.valueOf(),
			}, [
				m("div.CalendarDay__date", {
					class: CivilDate.now()
						.valueOf() === vnode.attrs.date.valueOf() ?
						"CalendarDay__date--today" :
						undefined,
				}, [
					m("span", vnode.attrs.date.day),
					m(Icon, {
						classes: "GlobalButtonIconAdd",
						icon: Icons.Add,
						id: `calendarday_${vnode.attrs.date}`,
						onclick: async (e: m.Event<MouseEvent>) => {
							e.stopPropagation();
							AppState.setComponentsDropdownMenu(`calendarday_${vnode.attrs.date.toJSON()}`, e.clientY);
						},
					}),
					m(DropdownMenu, {
						id: `calendarday_${vnode.attrs.date.toJSON()}`,
						items: vnode.attrs.dropdownItems,
					}),
				]),
				m("div.CalendarDay__items", vnode.attrs.events.map((event) => {
					return m(CalendarDayEvent, {
						date: vnode.attrs.date,
						event: event,
						loaded: vnode.attrs.loaded,
					});
				})),
			]);
		},
	};
}
