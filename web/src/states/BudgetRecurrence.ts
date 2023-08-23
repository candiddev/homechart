import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { CivilDate } from "@lib/types/CivilDate";
import { Icons } from "@lib/types/Icons";
import type { RecurrenceInterval } from "@lib/types/Recurrence";
import { Recurrence } from "@lib/types/Recurrence";
import { Timestamp } from "@lib/types/Timestamp";
import type Stream from "mithril/stream";

import { Colors } from "../types/Colors";
import { DataTypeEnum } from "../types/DataType";
import { ObjectRecurringTransactionCreated, ObjectRecurringTransactionDeleted, ObjectRecurringTransactionUpdated } from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { BudgetAccountState } from "./BudgetAccount";
import { BudgetPayeeState } from "./BudgetPayee";
import type { BudgetTransaction } from "./BudgetTransaction";
import { BudgetTransactionState } from "./BudgetTransaction";
import type { CalendarEvent, CalendarEventRange } from "./CalendarEvent";
import { CalendarEventState } from "./CalendarEvent";
import { DataArrayManager } from "./DataArray";

export interface BudgetRecurrence {
	authHouseholdID: NullUUID,
	budgetAccountID: NullUUID,
	created: NullTimestamp,
	id: NullUUID,
	recurrence: RecurrenceInterval,
	template: BudgetTransaction,
	updated: NullTimestamp,
}

class BudgetRecurrenceManager extends DataArrayManager<BudgetRecurrence> {
	constructor () {
		super(
			"/api/v1/budget/recurrences",
			"budgetAccountID",
			false,
			DataTypeEnum.BudgetRecurrence,
		);
	}

	override alertAction (a: ActionsEnum, hideAlert?: boolean, actions?: {
		name: string,
		onclick(): Promise<void>,
	}[]): void {
		let msg = "";
		switch (a) {
		case ActionsEnum.Create:
			msg = AuthAccountState.translate(ObjectRecurringTransactionCreated);
			break;
		case ActionsEnum.Delete:
			msg = AuthAccountState.translate(ObjectRecurringTransactionDeleted);
			break;
		case ActionsEnum.Update:
			msg = AuthAccountState.translate(ObjectRecurringTransactionUpdated);
			break;
		}

		AppState.setLayoutAppAlert({
			actions: actions,
			message: msg,
		}, hideAlert);
	}

	findBudgetAccountID (
		recurrences: BudgetRecurrence[],
		budgetAccountID: NullUUID,
	): BudgetRecurrence[] {
		return recurrences.filter((recurrence: BudgetRecurrence) => {
			return recurrence.budgetAccountID === budgetAccountID;
		});
	}

	findBudgetAccountIDToday (id: NullUUID): number {
		const transactions = this.findBudgetAccountID(this.data(), id);

		const today = Timestamp.now();

		return transactions.filter((transaction) => {
			return CivilDate.fromString(`${transaction.template.date}`) <= today.toCivilDate();
		}).length;
	}

	findDateRange (from: CivilDate, to: CivilDate): Stream<CalendarEventRange> {
		return this.data.map((recurrences) => {
			const events: CalendarEvent[] = [];

			for (const recurrence of recurrences) {
				if (recurrence.template.date !== null) {
					const d = CivilDate.fromString(recurrence.template.date);
					const dates: string[] = Recurrence.findCivilDates(
						recurrence.recurrence,
						Timestamp.fromCivilDate(d),
						from,
						to,
						[],
						null,
					);

					if (dates.length > 0) {
						events.push({
							...CalendarEventState.new(),
							...{
								authHouseholdID: recurrence.authHouseholdID,
								budgetRecurrence: recurrence,
								civilDates: dates,
								color: Colors.budgetRecurrrence(AuthHouseholdState.findID(recurrence.authHouseholdID).preferences.colorBudgetRecurrenceEvents),
								details: `#budgetaccount/${
									BudgetAccountState.findID(recurrence.budgetAccountID)
										.shortID
								}`,
								duration: 0,
								icon: Icons.BudgetTransaction,
								name: `${recurrence.template.amount > 0
									? "Deposit"
									: "Pay"} ${
									BudgetPayeeState.findID(recurrence.template.budgetPayeeID)
										.name
								}`,
								timeStart: "00:00",
								timestampEnd: Timestamp.fromCivilDate(d)
									.toString(),
								timestampStart: Timestamp.fromCivilDate(d)
									.toString(),
							},
						});
					}
				}
			}

			return CalendarEventState.toCalendarEventsRange(events, from, to);
		});
	}

	override new (): BudgetRecurrence {
		return {
			authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
			budgetAccountID: null,
			created: null,
			id: null,
			recurrence: Recurrence.new(),
			template: BudgetTransactionState.new(),
			updated: null,
		};
	}

	updateCategoryYearMonthRecurrence (budgetRecurrence: BudgetRecurrence): void {
		if (budgetRecurrence.template.date !== null) {
			const dateYM = CivilDate.fromString(budgetRecurrence.template.date)
				.toYearMonth();
			const nextYM = Recurrence.nextTimestamp(budgetRecurrence.recurrence, Timestamp.fromCivilDate(CivilDate.fromString(budgetRecurrence.template.date)))
				.toCivilDate()
				.toYearMonth();
			if (dateYM !== nextYM && budgetRecurrence.template.categories !== null) {
				for (let i = 0; i < budgetRecurrence.template.categories.length; i++) {
					budgetRecurrence.template.categories[i].yearMonth = nextYM.toNumber();
				}
			}
		}
	}
}

export const BudgetRecurrenceState = new BudgetRecurrenceManager();
