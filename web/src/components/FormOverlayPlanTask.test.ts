import { CivilDate } from "@lib/types/CivilDate";
import { ColorEnum } from "@lib/types/Color";

import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { InventoryItemState } from "../states/InventoryItem";
import { PlanProjectState } from "../states/PlanProject";
import { PlanTaskState } from "../states/PlanTask";
import { FormOverlayPlanTask } from "./FormOverlayPlanTask";

test("FormOverlayPlanTask", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);
	AuthSessionState.data(seed.authSessions[0]);
	AuthSessionState.data().admin = true;
	InventoryItemState.data(seed.inventoryItems);
	PlanProjectState.data(seed.planProjects);
	PlanTaskState.create = vi.fn();
	PlanTaskState.delete = vi.fn();
	PlanTaskState.update = vi.fn();

	const planTask = {
		...PlanTaskState.new(),
		...{
			authAccountID: seed.authAccounts[1].id,
			authHouseholdID: seed.authHouseholds[0].id,
			id: "1" as NullUUID,
			name: "Test",
		},
	};

	testing.mount(FormOverlayPlanTask, {
		data: planTask,
	});

	testing.find("#form-item-owner");

	// Buttons
	testing.find("#form-update-task");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	expect(PlanTaskState.delete)
		.toBeCalledWith("1");
	testing.click("#button-cancel");
	testing.click("#button-update");
	expect(PlanTaskState.update)
		.toBeCalledTimes(1);
	testing.click("#button-cancel");
	testing.click("#button-copy");
	expect(planTask.id)
		.toBeNull();
	testing.click("#button-add");
	expect(PlanTaskState.create)
		.toBeCalledTimes(1);
	AuthHouseholdState.data()[0].subscriptionExpires = CivilDate.now()
		.toJSON();
	testing.redraw();
	testing.notFind("#button-add");
	AuthHouseholdState.data()[0].subscriptionExpires = seed.authHouseholds[0].subscriptionExpires;
	testing.redraw();

	// Name
	const name = testing.find("#form-item-input-name");
	testing.input(name, "Test2");
	expect(planTask.name)
		.toBe("Test2");
	testing.value(name, "Test2");

	// Details
	const details = testing.find("#form-item-text-area-details");
	testing.input(details, "Details!");
	expect(planTask.details)
		.toBe("Details!");
	testing.value(details, "Details!");

	// Done
	testing.notFind("#form-checkbox-input-task-completed");
	planTask.id = "1";
	testing.redraw();
	const done = testing.find("#form-checkbox-input-completed");
	testing.click(done);
	expect(planTask.done)
		.toBe(true);

	// Project
	testing.click(`#form-item-option-project-${seed.planProjects[6].id}`);
	expect(planTask.planProjectID)
		.toBe(seed.planProjects[6].id);
	testing.hasClass(`#form-item-option-project-${seed.planProjects[6].id}`,"FormItemSelectNested__option--selected");
	await testing.sleep(500);

	// Assignees
	const assignee = testing.findAll("#button-array-assignees p", 3);
	testing.click(assignee[0]);
	expect(planTask.assignees)
		.toHaveLength(2);
	testing.hasClass(assignee[2], "ButtonArray__selected");
	testing.hasClass(assignee[0], "ButtonArray__selected");
	testing.click(assignee[2]);
	testing.notHasClass(assignee[2], "ButtonArray__selected");

	// Color
	testing.input("#form-item-select-color", `${ColorEnum.Red}`);
	expect(planTask.color)
		.toBe(ColorEnum.Red);

	// Tags
	const tags = testing.find("#form-item-input-tags");
	testing.input(tags, "a ");
	expect(planTask.tags)
		.toStrictEqual([
			"a",
		]);

	// Inventory
	const inventory = testing.find("#form-item-select-inventory-item");
	testing.input(inventory, seed.inventoryItems[0].id);
	expect(planTask.inventoryItemID)
		.toBe(seed.inventoryItems[0].id);
	testing.value(inventory, seed.inventoryItems[0].id);

	// Duration
	const duration = testing.find("#form-item-multi-duration");
	testing.input(`#${duration.id} input:nth-of-type(2)`, "30");
	expect(planTask.duration)
		.toBe(30);

	// Due Date
	testing.notFind("#form-item-input-due-time");
	const dueDate = testing.find("#form-item-input-due-date");
	testing.input(dueDate, "2020-01-01");
	expect(planTask.dueDate)
		.toBe("2020-01-01T06:00:00.000Z");
	testing.value(dueDate, "2020-01-01");
	await testing.sleep(100);

	// Reminder
	const reminder = testing.find("#form-checkbox-input-send-reminder");
	testing.click(reminder);
	expect(planTask.notify)
		.toBe(true);

	// Due Time
	const dueTime = testing.find("#form-item-input-due-time");
	testing.input(dueTime, "00:30");
	expect(planTask.dueDate)
		.toBe("2020-01-01T06:30:00.000Z");
	testing.value(dueTime, "00:30");
	await testing.sleep(100);

	// Recurrence
	testing.notFind("#form-item-label-recurrence");
	testing.click("#form-checkbox-input-recurring");
	testing.find("#form-item-label-recurrence");
	testing.click("#form-checkbox-input-recur-based-on-completion-date");
	expect(planTask.recurOnDone)
		.toBeTruthy();

	// Template
	testing.click("#form-checkbox-input-use-as-template");
	await testing.sleep(100);
	expect(planTask.template)
		.toBeTruthy();
	testing.click("#form-checkbox-input-global-template");
	expect(planTask.authAccountID)
		.toBeNull();
	expect(planTask.authHouseholdID)
		.toBeNull();
	testing.notFind("#form-item-select-project");
	testing.notFind("#form-item-input-due-date");
});
