import seed from "../jest/seed";
import { CalendarICalendarState } from "./CalendarICalendar";

describe("CalendarICalendarState", () => {
	test("data", () => {
		CalendarICalendarState.data(seed.calendarICalendars);
		CalendarICalendarState.data([]);
	});
});
