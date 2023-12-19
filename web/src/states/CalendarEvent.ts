import type { IconName } from "@lib/components/Icon";
import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import type { RecurrenceInterval } from "@lib/types/Recurrence";
import { Recurrence } from "@lib/types/Recurrence";
import { Timestamp } from "@lib/types/Timestamp";
import type Stream from "mithril/stream";

import { Astronomy2023, Astronomy2024, HolidaysUS } from "../dates";
import { HolidaysCA, HolidaysCA2024 } from "../dates/HolidaysCA";
import { HolidaysUK, HolidaysUK2024 } from "../dates/HolidaysUK";
import { DataTypeEnum } from "../types/DataType";
import { Permission, PermissionComponentsEnum, PermissionEnum } from "../types/Permission";
import { ObjectEventCreated, ObjectEventDeleted, ObjectEventUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthSessionState } from "./AuthSession";
import type { BudgetRecurrence } from "./BudgetRecurrence";
import type { CookMealPlan } from "./CookMealPlan";
import { DataArrayManager } from "./DataArray";
import type { HealthLog } from "./HealthLog";
import type { PlanTask } from "./PlanTask";

export interface CalendarEvent {
	authAccountID: NullUUID,
	authHouseholdID: NullUUID,
	budgetRecurrence?: BudgetRecurrence, // not sent by API
	calendarICalendarID: NullUUID,
	color: string,
	cookMealPlans?: CookMealPlan[], // not sent by API
	created: NullTimestamp,
	dateStart: string,
	dateEnd: NullCivilDate,
	details: string,
	duration: number,
	healthLogInputs?: HealthLog[], // not sent by API
	healthLogOutputs?: HealthLog[], // not sent by API
	icon?: IconName, // not sent by API
	id: NullUUID,
	location: string,
	name: string,
	notifyOffset: null | number,
	participants: string[],
	planTask?: PlanTask, // not sent by API
	recurrence: RecurrenceInterval | null,
	recurrenceDate?: NullCivilDate, // not sent by API
	skipDays: string[],
	timeStart: string,
	timestampEnd: NullTimestamp,
	timestampStart: NullTimestamp,
	timeZone: string,
	travelTime: number,
	updated: NullTimestamp,
}

export interface CalendarEventRange {
	[date: string]: CalendarEvent[],
}

class CalendarEventManager extends DataArrayManager<CalendarEvent> {
	constructor () {
		super(
			"/api/v1/calendar/events",
			"dateStart",
			false,
			DataTypeEnum.CalendarEvent,
		);
	}

	override alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";

		switch (a) {
		case ActionsEnum.Create:
			msg = AuthAccountState.translate(ObjectEventCreated);
			break;
		case ActionsEnum.Delete:
			msg = AuthAccountState.translate(ObjectEventDeleted);
			break;
		case ActionsEnum.Update:
			msg = AuthAccountState.translate(ObjectEventUpdated);
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}


	findDateRange (from: CivilDate, to: CivilDate): Stream<CalendarEventRange> {
		return this.data.map((calendarEvents) => {
			const allEvents = [
				...calendarEvents.filter((event) => {
					return event.calendarICalendarID === null || ! AuthAccountState.data().hideCalendarICalendars.includes(event.calendarICalendarID);
				}),
			];

			if (AuthAccountState.data().preferences.showCalendarEventAstronomy) {
				let events: {
					date: string,
					details?: string,
					name: string,
					time?: string,
				}[] = [];

				if (from.year === 2023 || to.year === 2023) {
					events = Astronomy2023;
				}

				if (from.year === 2024 || to.year === 2024) {
					events = Astronomy2024;
				}

				for (const event of events) {
					const timestamp = Timestamp.fromString(`${event.date}T${event.time === undefined ?
						"00:00" :
						event.time}:00Z`)
						.toString();

					const index = allEvents.findIndex((e) => {
						return (
							e.name === event.name &&
								Timestamp.fromString(e.timestampStart!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
									.toString() === timestamp
						);
					});

					if (index !== -1) {
						continue;
					}

					allEvents.push({
						...this.new(),
						...{
							authAccountID: AuthAccountState.data().id,
							details: event.details === undefined
								? ""
								: event.details,
							duration: 0,
							icon: Icons.CalendarAstronomy,
							name: event.name,
							timeStart: "00:00",
							timestampEnd: timestamp,
							timestampStart: timestamp,
						},
					});
				}
			}

			if (AuthAccountState.data().preferences.showCalendarEventHolidaysCA) {
				const t = Timestamp.fromCivilDate(from);
				t.addDays(-20);

				let holidays = HolidaysCA;

				if (from.year === 2024 || to.year === 2024) {
					holidays = holidays.concat(HolidaysCA2024 as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				}

				const timestamp = t.toString();

				for (const holiday of holidays) {
					const index = allEvents.findIndex((e) => {
						return e.name === holiday.name;
					});

					if (index >= 0) {
						continue;
					}

					allEvents.push({
						...this.new(),
						...{
							authAccountID: AuthAccountState.data().id,
							duration: 0,
							icon: Icons.CalendarHoliday,
							name: holiday.name,
							recurrence: holiday.recurrence === undefined ?
								null :
								{
									...Recurrence.new(),
									...holiday.recurrence,
									...{
										separation: 1,
									},
								},
							timeStart: "00:00",
							timestampEnd: timestamp,
							timestampStart: timestamp,
						},
					});
				}
			}

			if (AuthAccountState.data().preferences.showCalendarEventHolidaysUK) {
				const t = Timestamp.fromCivilDate(from);
				t.addDays(-20);

				let holidays = HolidaysUK;

				if (from.year === 2024 || to.year === 2024) {
					holidays = holidays.concat(HolidaysUK2024 as any); // eslint-disable-line @typescript-eslint/no-explicit-any
				}

				const timestamp = t.toString();

				for (const holiday of holidays) {
					const index = allEvents.findIndex((e) => {
						return e.name === holiday.name;
					});

					if (index >= 0) {
						continue;
					}

					allEvents.push({
						...this.new(),
						...{
							authAccountID: AuthAccountState.data().id,
							duration: 0,
							icon: Icons.CalendarHoliday,
							name: holiday.name,
							recurrence: holiday.recurrence === undefined ?
								null :
								{
									...Recurrence.new(),
									...holiday.recurrence,
									...{
										separation: 1,
									},
								},
							timeStart: "00:00",
							timestampEnd: timestamp,
							timestampStart: timestamp,
						},
					});
				}
			}

			if (AuthAccountState.data().preferences.showCalendarEventHolidaysUS) {
				const t = Timestamp.fromCivilDate(from);
				t.addDays(-20);

				const timestamp = t.toString();

				for (const holiday of HolidaysUS) {
					const index = allEvents.findIndex((e) => {
						return e.name === holiday.name;
					});

					if (index >= 0) {
						continue;
					}

					allEvents.push({
						...this.new(),
						...{
							authAccountID: AuthAccountState.data().id,
							details: holiday.details === undefined
								? ""
								: holiday.details,
							duration: 0,
							icon: Icons.CalendarHoliday,
							name: holiday.name,
							recurrence: {
								...Recurrence.new(),
								...holiday.recurrence,
								...{
									separation: 1,
								},
							},
							timeStart: "00:00",
							timestampEnd: timestamp,
							timestampStart: timestamp,
						},
					});
				}
			}

			return this.toCalendarEventsRange(allEvents, from, to);
		});
	}

	toCalendarEventsRange (allEvents: CalendarEvent[], from: CivilDate, to: CivilDate): CalendarEventRange {
		const events: CalendarEventRange = {};

		for (const event of allEvents) {
			const start = Timestamp.fromString(event.timestampStart!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
			const end = Timestamp.fromString(event.timestampEnd!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
			let diff = start.getDiffDays(end);

			if (event.recurrence === null) {
				if (
					start.toCivilDate()
						.valueOf() <= to.valueOf() &&
							end
								.toCivilDate()
								.valueOf() >= from.valueOf()
				) {
					for (let i = 0; i <= diff; i++) {
						const t = Timestamp.fromString(start.toString());
						t.addDays(i);

						const date = t.toCivilDate();

						if (date
							.valueOf() < from.valueOf() ||
							date
								.valueOf() > to.valueOf()) {
							continue;
						}

						const dateString = date.toJSON();

						if (events[dateString] === undefined) {
							events[dateString] = [];
						}

						events[dateString].push(event);
					}
				}
			} else {
				diff = start.getDiffDays(end);

				for (let i = 0; i <= diff; i++) {
					start.addDays(i);

					const rec = Recurrence.findCivilDates(
						event.recurrence,
						start,
						from,
						to,
						event.skipDays,
						event.dateEnd,
					);

					start.addDays(-1 * i);

					for (const date of rec) {
						let start = CivilDate.fromString(date);

						if (i > 0) {
							const r = Timestamp.fromCivilDate(CivilDate.fromString(date));
							r.addDays(-1 * i);
							start = r.toCivilDate();
						}

						if (events[date] === undefined) {
							events[date] = [];
						}

						if (! events[date].includes(event)) {
							const tStart = Timestamp.fromString(event.timestampStart as string);
							tStart.setDate(start);

							const tEnd = Timestamp.fromString(tStart.toString());
							tEnd.addMinutes(event.travelTime + event.duration);

							events[date].push({
								...event,
								...{
									timestampEnd: tEnd.toString(),
									timestampStart: tStart.toString(),
								},
							});
						}
					}
				}
			}
		}

		return events;
	}

	override new (): CalendarEvent {
		const p = Permission.isPermitted(AuthSessionState.data().permissionsHouseholds, PermissionComponentsEnum.Calendar, PermissionEnum.Edit, AuthAccountState.data().primaryAuthHouseholdID);

		return {
			authAccountID:
				p ?
					null :
					AuthAccountState.data().id,
			authHouseholdID:
				p ?
					AuthAccountState.data().primaryAuthHouseholdID :
					null,
			calendarICalendarID: null,
			color: "",
			created: null,
			dateEnd: null,
			dateStart: "",
			details: "",
			duration: 60,
			id: null,
			location: "",
			name: "",
			notifyOffset: 10,
			participants: [],
			recurrence: null,
			skipDays: [],
			timeStart: "",
			timeZone: Intl.DateTimeFormat()
				.resolvedOptions().timeZone,
			timestampEnd: null,
			timestampStart: null,
			travelTime: 0,
			updated: null,
		};
	}
}

export const CalendarEventState = new CalendarEventManager();
