import { CivilDate } from "@lib/types/CivilDate";
import { Recurrence } from "@lib/types/Recurrence";
import { Timestamp } from "@lib/types/Timestamp";

import seed from "../jest/seed";
import { CalendarEventState } from "./CalendarEvent";

describe("CalendarEventState", () => {
	test("data", () => {
		CalendarEventState.data(seed.calendarEvents);
		CalendarEventState.data([]);
	});

	test("findDateRange", () => {

		const start = Timestamp.fromString("2020-10-17T17:00:00Z");
		const end = Timestamp.fromString(start.toString());
		end.addMinutes(47 * 60);

		const start1 = Timestamp.fromString("2020-10-17T17:00:00Z");
		const end1 = Timestamp.fromString(start1.toString());
		end1.addMinutes(60);

		const start2 = Timestamp.fromString("2020-10-01T17:00:00Z");
		const end2 = Timestamp.fromString(start2.toString());
		end2.addMinutes(60);

		const start3 = Timestamp.fromString("2020-10-01T17:00:00Z");
		const end3 = Timestamp.fromString(start3.toString());
		end3.addMinutes(24 * 60 * 3);

		CalendarEventState.data([
			{
				...CalendarEventState.new(),
				...{
					name: "1",
					timestampEnd: end.toString(),
					timestampStart: start.toString(),
				},
			},
			{
				...CalendarEventState.new(),
				...{
					name: "1",
					recurrence: {
						...Recurrence.new(),
						...{
							separation: 5,
						},
					},
					timestampEnd: end1.toString(),
					timestampStart: start1.toString(),
				},
			},
			{
				...CalendarEventState.new(),
				...{
					name: "2",
					recurrence: {
						...Recurrence.new(),
						...{
							day: 1,
							separation: 1,
						},
					},
					timestampEnd: end2.toString(),
					timestampStart: start2.toString(),
				},
			},
			{
				...CalendarEventState.new(),
				...{
					duration: 3 * 24 * 60,
					name: "3",
					recurrence: {
						...Recurrence.new(),
						...{
							separation: 5,
						},
					},
					timestampEnd: end3.toString(),
					timestampStart: start3.toString(),
				},
			},
		]);

		start1.addDays(5);
		end1.addDays(5);

		const start31 = Timestamp.fromString(start3.toString());
		start31.addDays(15);
		const end31 = Timestamp.fromString(end3.toString());
		end31.addDays(15);

		const start32 = Timestamp.fromString(start3.toString());
		start32.addDays(20);
		const end32 = Timestamp.fromString(end3.toString());
		end32.addDays(20);

		expect(CalendarEventState.findDateRange(CivilDate.fromString("2020-10-18"), CivilDate.fromString("2020-10-24"))())
			.toStrictEqual({
				"2020-10-18" : [
					CalendarEventState.data()[0],
					{
						...CalendarEventState.data()[3],
						...{
							timestampEnd: end31.toString(),
							timestampStart: start31.toString(),
						},
					},
				],
				"2020-10-19" : [
					CalendarEventState.data()[0],
					{
						...CalendarEventState.data()[3],
						...{
							timestampEnd: end31.toString(),
							timestampStart: start31.toString(),
						},
					},
				],
				"2020-10-21" : [
					{
						...CalendarEventState.data()[3],
						...{
							timestampEnd: end32.toString(),
							timestampStart: start32.toString(),
						},
					},
				],
				"2020-10-22" : [
					{
						...CalendarEventState.data()[1],
						...{
							timestampEnd: end1.toString(),
							timestampStart: start1.toString(),
						},
					},
					{
						...CalendarEventState.data()[3],
						...{
							timestampEnd: end32.toString(),
							timestampStart: start32.toString(),
						},
					},
				],
				"2020-10-23" : [
					{
						...CalendarEventState.data()[3],
						...{
							timestampEnd: end32.toString(),
							timestampStart: start32.toString(),
						},
					},
				],
				"2020-10-24" : [
					{
						...CalendarEventState.data()[3],
						...{
							timestampEnd: end32.toString(),
							timestampStart: start32.toString(),
						},
					},
				],
			});

		start1.addDays(-5);
		end1.addDays(-5);

		expect(CalendarEventState.findDateRange(CivilDate.fromString("2020-10-17"), CivilDate.fromString("2020-10-17"))())
			.toStrictEqual({
				"2020-10-17": [
					CalendarEventState.data()[0],
					{
						...CalendarEventState.data()[1],
						...{
							timestampEnd: end1.toString(),
							timestampStart: start1.toString(),
						},
					},
					{
						...CalendarEventState.data()[3],
						...{
							timestampEnd: end31.toString(),
							timestampStart: start31.toString(),
						},
					},
				],
			});
	});
});
