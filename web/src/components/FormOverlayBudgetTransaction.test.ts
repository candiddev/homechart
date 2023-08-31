import { CivilDate } from "@lib/types/CivilDate";
import { Timestamp } from "@lib/types/Timestamp";
import { UUID } from "@lib/types/UUID";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { BudgetAccountState } from "../states/BudgetAccount";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { BudgetRecurrenceState } from "../states/BudgetRecurrence";
import { BudgetTransactionState } from "../states/BudgetTransaction";
import { InfoState } from "../states/Info";
import { FormOverlayBudgetTransaction } from "./FormOverlayBudgetTransaction";

const id = UUID.new();
let data = BudgetRecurrenceState.new();

beforeEach(() => {
	data = {
		...BudgetRecurrenceState.new(),
		...{
			budgetAccountID: seed.budgetAccounts[0].id,
			id: id,
			template: {
				...BudgetTransactionState.new(),
				...{
					id: id,
				},
			},
		},
	};
});

describe("FormOverlayBudgetTransaction", () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	BudgetAccountState.data(seed.budgetAccounts);
	BudgetCategoryState.data(seed.budgetCategories);
	BudgetPayeeState.data(seed.budgetPayees);
	BudgetRecurrenceState.delete = vi.fn();
	BudgetRecurrenceState.create = vi.fn(async () => {
		return Promise.resolve(BudgetRecurrenceState.new());
	});
	BudgetRecurrenceState.update = vi.fn();
	BudgetTransactionState.create = vi.fn(async () => {
		return Promise.resolve();
	});
	BudgetTransactionState.delete = vi.fn(async () => {
		return Promise.resolve();
	});
	BudgetTransactionState.read = vi.fn();
	BudgetTransactionState.update = vi.fn();


	test("buttons", async () => {
		testing.mount(FormOverlayBudgetTransaction, {
			data: data,
		});

		testing.find("#form-update-transaction");

		// Recurrence
		data.recurrence.separation = 1;
		data.template.date = CivilDate.now()
			.toJSON();
		testing.click("#button-delete");
		testing.click("#button-confirm-delete");
		expect(BudgetRecurrenceState.delete)
			.toBeCalledWith(id);
		testing.click("#button-cancel");
		data.template.id = null;
		testing.click("#button-update");
		const tomorrow = Timestamp.now();
		tomorrow.addDays(1);
		expect(data.template.date)
			.toBe(CivilDate.now()
				.toJSON());
		expect(BudgetRecurrenceState.update)
			.toBeCalledTimes(1);
		testing.redraw();
		data.budgetAccountID = null;
		data.template.id = id;
		testing.click("#button-update");
		expect(BudgetTransactionState.update)
			.toBeCalledTimes(1);
		data.id = null;
		data.template.date = CivilDate.now()
			.toJSON();
		data.template.id = null;
		data.recurrence.separation = 1;
		testing.redraw();
		testing.click("#button-add");
		await testing.sleep(100);
		expect(BudgetTransactionState.create)
			.toBeCalledTimes(1);
		expect(BudgetRecurrenceState.create)
			.toBeCalledTimes(1);
		data.id = id;
		data.recurrence.separation = 0;
		data.template.date = null;
		data.template.id = id;
		testing.redraw();
		InfoState.data().cloud = false;
		testing.redraw();
		testing.notFind("#button-add");
		InfoState.data().cloud = true;
		testing.redraw();

		// Import
		testing.mocks.params.import = true;
		BudgetTransactionState.data([
			{
				...data.template,
				...{
					amount: 1000,
				} },
		]);
		testing.click("#button-update");
		expect(BudgetTransactionState.data()[0].amount)
			.toBe(0);
		testing.click("#button-delete");
		testing.click("#button-confirm-delete");
		expect(BudgetTransactionState.data())
			.toHaveLength(0);
		testing.mocks.params = {};

		// Transaction
		testing.redraw();
		testing.click("#button-cancel");
		testing.click("#button-delete");
		testing.click("#button-confirm-delete");
		expect(BudgetTransactionState.delete)
			.toBeCalledWith(id);
	});

	test("form", async () => {
		testing.mount(FormOverlayBudgetTransaction, {
			data: data,
		});

		testing.find("#form-item-owner");

		// Account
		testing.input("#form-item-select-account", seed.budgetAccounts[0].id);
		testing.value("#form-item-select-account", seed.budgetAccounts[0].id);
		expect(data.template.accounts![0].budgetAccountID)
			.toBe(seed.budgetAccounts[0].id);

		// Date
		testing.input("#form-item-input-date", "2019-11-01");
		expect(data.template.date)
			.toBe("2019-11-01");

		// Amount, no categories/accounts
		testing.input("#form-item-input-amount", "1000");
		await testing.sleep(500);
		testing.value("#form-item-input-amount", " $10.00");
		expect(data.template.amount)
			.toBe(0);
		expect(data.template.accounts![0].amount)
			.toBe(1000);

		// Payee field, transfer to off budget, amount
		data.template.categories = seed.budgetTransactions[1].categories;
		testing.findAll("#form-item-datalist-payee > option", seed.budgetAccounts.length - 1 + seed.budgetPayees.length);
		testing.input("#form-item-input-payee", "Transfer To Cash Buried Outside");
		expect(data.template.accounts![1].budgetAccountID)
			.toBe(seed.budgetAccounts[1].id);
		expect(data.template.accounts![1].amount)
			.toBe(-1000);
		testing.input("#form-item-input-amount", "5000");
		expect(data.template.amount)
			.toBe(5000);
		expect(data.template.accounts![0].amount)
			.toBe(5000);
		expect(data.template.accounts![1].amount)
			.toBe(-5000);
		testing.find("#form-item-select-category");

		// Payee field, transfer to on budget, amount
		testing.input("#form-item-input-payee", "Transfer To Platinum Credit Card");
		expect(data.template.accounts![1].budgetAccountID)
			.toBe(seed.budgetAccounts[2].id);
		expect(data.template.accounts![1].amount)
			.toBe(-5000);
		testing.input("#form-item-input-amount", "6000");
		testing.redraw();
		expect(data.template.amount)
			.toBe(0);
		expect(data.template.accounts![0].amount)
			.toBe(6000);
		expect(data.template.accounts![1].amount)
			.toBe(-6000);
		expect(data.template.categories)
			.toHaveLength(0);
		testing.notFind("#form-item-select-category");

		// Payee field, multiple accounts
		testing.click("#button-add-account");
		testing.input("#form-item-select-name", "Checking");
		testing.value("#form-item-select-name", "Checking");
		testing.input("#form-item-input-amount", "3000");
		testing.value("#form-item-input-amount", "3000");
		testing.click("#button-add");
		await testing.sleep(100);
		testing.text("#table-container-accounts #subtitle-remaining", "Remaining: $30.00");
		const r = testing.findAll("#table-accounts tbody tr", 3);
		testing.click(r[2]);
		testing.input("#form-item-input-amount", "1000");
		testing.click("#button-update");
		await testing.sleep(100);
		testing.text("#table-container-accounts #subtitle-remaining", "Remaining: $10.00");
		testing.click(r[2]);
		testing.click("#button-delete");
		await testing.sleep(100);
		testing.notFind("#table-container-accounts");

		// Payee field, transfer to a budget payee, amount
		testing.input("#form-item-input-payee", seed.budgetPayees[0].name);
		expect(data.template.accounts!)
			.toHaveLength(1);
		expect(data.template.accounts![0].amount)
			.toBe(6000);
		expect(data.template.amount)
			.toBe(6000);
		testing.input("#form-item-input-amount", "7000");
		testing.redraw();
		expect(data.template.amount)
			.toBe(7000);
		expect(data.template.accounts![0].amount)
			.toBe(7000);
		testing.find("#form-item-select-category");
		expect(data.template.categories[0].amount)
			.toBe(7000);
		expect(data.template.categories[0].budgetCategoryID)
			.toBe(seed.budgetPayees[0].budgetCategoryID);

		testing.input("#form-item-input-note", "a note");
		expect(data.template.note)
			.toBe("a note");
		testing.click("#form-checkbox-input-dont-rollup-transaction");
		expect(data.template.keep)
			.toBe(true);

		testing.notFind("#form-item-recurrence");
		testing.click("#form-checkbox-input-recurring");
		testing.find("#form-item-recurrence");
	});

	test("categories", async () => {
		testing.mount(FormOverlayBudgetTransaction, {
			data: data,
		});
		data.template.date = "2019-11-01";

		testing.input("#form-item-select-account", seed.budgetAccounts[0].name);
		testing.input("#form-item-input-payee", `Transfer To ${seed.budgetAccounts[1].name}`);
		testing.input("#form-item-input-amount", "1000");
		testing.redraw();
		testing.value("#form-item-select-category", "");
		testing.input("#form-item-select-category", BudgetCategoryState.findName("Utilities").id as string);
		expect(data.template.categories)
			.toStrictEqual([
				{
					...BudgetTransactionState.newCategory(),
					...{
						amount: 1000,
						budgetCategoryID: BudgetCategoryState.findName("Utilities").id,
						id: data.template.categories![0].id,
						yearMonth: CivilDate.now()
							.toYearMonth()
							.toNumber(),
					},
				},
			]);
		testing.input("#form-item-select-category", BudgetCategoryState.findName("Restaurants").id as string);
		expect(data.template.categories)
			.toStrictEqual([
				{
					...BudgetTransactionState.newCategory(),
					...{
						amount: 1000,
						budgetCategoryID: BudgetCategoryState.findName("Restaurants").id,
						id: data.template.categories![0].id,
						yearMonth: CivilDate.now()
							.toYearMonth()
							.toNumber(),
					},
				},
			]);
		await testing.sleep(500);
		testing.value("#form-item-input-month", CivilDate.now()
			.toYearMonth()
			.toValue());
		testing.input("#form-item-input-month", "2019-11");
		expect(data.template.categories)
			.toStrictEqual([
				{
					...BudgetTransactionState.newCategory(),
					...{
						amount: 1000,
						budgetCategoryID: BudgetCategoryState.findName("Restaurants").id,
						id: data.template.categories![0].id,
						yearMonth: 201911,
					},
				},
			]);

		testing.click("#button-add-category");
		await testing.sleep(500);
		let categoryForm = testing.find("#form-new-category");
		const categoryName = categoryForm.querySelector("#form-item-select-name") as HTMLSelectElement;
		expect(categoryName.options)
			.toHaveLength(seed.budgetCategories.length);
		testing.input(categoryName, `${seed.budgetCategories[1].grouping} > ${seed.budgetCategories[1].name}`);
		testing.value(categoryName, `${seed.budgetCategories[1].grouping} > ${seed.budgetCategories[1].name}`);
		const categoryAmount = categoryForm.querySelector("#form-item-input-amount") as HTMLInputElement;
		testing.input(categoryAmount, "1000");
		const categoryYearMonth = categoryForm.querySelector("#form-item-input-month") as HTMLInputElement;
		testing.value(categoryYearMonth, "2019-11");
		testing.input(categoryYearMonth, "2019-10");
		testing.click(categoryForm.querySelector("#button-add") as HTMLElement);
		await testing.sleep(500);
		expect(data.template.categories![1].budgetCategoryID)
			.toBe(seed.budgetCategories[1].id);
		expect(data.template.categories![1].amount)
			.toBe(1000);
		expect(data.template.categories![1].yearMonth)
			.toBe(201910);
		testing.text(".Table__container #subtitle-remaining", "Remaining: $10.00");
		const categoryRow = testing.findAll("#table-categories > tbody > tr", 2);
		testing.click(categoryRow[1]);
		categoryForm = testing.find("#form-update-category");
		testing.click(categoryForm.querySelector("#button-delete") as HTMLElement);
		expect(data.template.categories)
			.toHaveLength(1);
	});
});
