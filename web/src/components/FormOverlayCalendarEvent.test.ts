import { CivilDate } from "@lib/types/CivilDate";
import { Recurrence } from "@lib/types/Recurrence";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { CalendarEventState } from "../states/CalendarEvent";
import { FormOverlayCalendarEvent } from "./FormOverlayCalendarEvent";

const id = UUID.new();
let data = CalendarEventState.new();

beforeEach(() => {
	data = {
		...CalendarEventState.new(),
		...{
			id: id,
		},
	};
});

describe("FormOverlayCalendarEvent", () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	CalendarEventState.create = vi.fn(async () => {
		return Promise.resolve(CalendarEventState.new());
	});
	CalendarEventState.delete = vi.fn();
	CalendarEventState.update = vi.fn(async () => {
		return Promise.resolve();
	});

	test("buttons", async () => {
		testing.mount(FormOverlayCalendarEvent, {
			data: data,
		});
		await testing.sleep(100);
		testing.find("#form-update-event");
		testing.click("#button-delete");
		testing.click("#button-confirm-delete");
		expect(CalendarEventState.delete)
			.toBeCalledWith(data.id);
		testing.click("#button-cancel");
		testing.click("#button-update");
		expect(CalendarEventState.update)
			.toBeCalledTimes(1);
		data.id = null;
		testing.redraw();
		testing.click("#button-add");
		expect(CalendarEventState.create)
			.toBeCalledTimes(1);
		testing.notFind("#button-delete-occurrence");
		data.id = id;
		data.recurrence = Recurrence.new();
		testing.redraw();
		testing.click("#button-delete-occurrence");
		expect(CalendarEventState.update)
			.toBeCalledTimes(1);
		testing.click("#button-copy");
		testing.redraw();
		testing.notFind("#button-copy");
		data.id = id;
		data.recurrence = Recurrence.new();
		data.recurrenceDate = CivilDate.now()
			.toJSON();
		testing.redraw();
		testing.click("#button-update-occurrence");
		await testing.sleep(100);
		expect(CalendarEventState.update)
			.toBeCalledTimes(2);
		expect(CalendarEventState.create)
			.toBeCalledTimes(2);
		AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now()
			.toJSON();
		testing.redraw();
		testing.notFind("#button-add");
		AuthHouseholdState.data()[0].subscriptionExpires = seed.authHouseholds[0].subscriptionExpires;
		testing.redraw();
	});

	test("inputs", async () => {
		AuthAccountState.data(seed.authAccounts[0]);
		AuthHouseholdState.data(seed.authHouseholds);
		AuthSessionState.data(seed.authSessions[0]);

		const data = {
			...CalendarEventState.new(),
			...{
				authHouseholdID: seed.authHouseholds[0].id,
				recurrenceDate: CivilDate.now()
					.toJSON(),
			},
		};
		testing.mount(FormOverlayCalendarEvent, {
			data: data,
		});

		await testing.sleep(100);
		testing.find("#form-item-owner");

		// Name
		const name = testing.find("#form-item-input-name");
		testing.input(name, "Test2");
		expect(data.name)
			.toBe("Test2");
		testing.value(name, "Test2");

		// Participants
		testing.find("#button-array-participants");

		// Details
		const details = testing.find("#form-item-text-area-details");
		testing.input(details, "a test 1");
		expect(data.details)
			.toBe("a test 1");
		testing.value(details, "a test 1");

		// Location
		const location = testing.find("#form-item-input-location");
		testing.input(location, "Janes General Store");
		expect(data.location)
			.toBe("Janes General Store");
		testing.value(location, "Janes General Store");

		// Travel Time
		testing.input("#form-item-multi-travel-time input", "2");
		expect(data.travelTime)
			.toBe(120);

		// Start Date
		const startDate = testing.find("#form-item-input-start-date");
		testing.input(startDate, "2020-10-24");
		expect(data.dateStart)
			.toBe("2020-10-24");
		testing.value(startDate, "2020-10-24");

		// Start Time
		const startTime = testing.find("#form-item-input-start-time");
		testing.input(startTime, "20:00");
		expect(data.timeStart)
			.toBe("20:00");
		testing.value(startTime, "20:00");
		await testing.sleep(100);

		// End Date
		const endDate = testing.find("#form-item-input-end-date");
		testing.value(endDate, "2020-10-24");
		testing.input(endDate, "2020-10-25");
		expect(data.duration)
			.toBe(25*60);
		testing.value(endDate, "2020-10-25");

		// End Time
		const endTime = testing.find("#form-item-input-end-time");
		testing.value(endTime, "21:00");
		testing.input(endTime, "22:00");
		expect(data.duration)
			.toBe(26*60);
		testing.value(endTime, "22:00");

		// All Day
		const allDay = testing.find("#form-checkbox-input-all-day");
		testing.hasAttribute(allDay, "checked", "null");
		testing.click(allDay);
		testing.hasAttribute(allDay, "checked", "");
		expect(data.duration)
			.toBe(0);
		testing.notFind("#form-item-input-start-time");
		testing.notFind("#form-item-input-end-time");

		// Send reminder
		testing.findAll("#form-item-select-send-reminder option", 6);
		expect(data.notifyOffset)
			.toBe(60 * 12);
		testing.value("#form-item-select-send-reminder", "4");
		testing.input("#form-item-select-send-reminder", "2");
		expect(data.notifyOffset)
			.toBe(30);

		// Custom reminder
		testing.notFind("#form-item-multi-custom-reminder");
		testing.input("#form-item-select-send-reminder", "5");
		testing.redraw();
		testing.input("#form-item-multi-custom-reminder input", "2");
		expect(data.notifyOffset)
			.toBe(120);

		// Color
		const color = testing.find("#form-item-select-color");
		testing.input(color, "2");
		expect(data.color)
			.toBe(2);
		testing.value(color, "2");

		// Time Zone
		const timeZone = testing.find("#form-item-select-time-zone");
		testing.value(timeZone, data.timeZone);
		testing.input(timeZone, "US/Pacific");
		expect(data.timeZone)
			.toBe("US/Pacific");
		testing.value(timeZone, "US/Pacific");

		// Recurrence
		testing.notFind("#form-item-label-recurrence");
		testing.click("#form-checkbox-input-recurring");
		testing.find("#form-item-label-recurrence");
		expect(data.recurrence)
			.toStrictEqual({
				...Recurrence.new(),
				...{
					separation: 1,
				},
			});
	});
});
