import { Permission, PermissionEnum } from "../types/Permission";
import { FormPermissions } from "./FormPermissions";

test("FormPermissions", async () => {
	const permissions = Permission.new();

	permissions.budget = PermissionEnum.None;

	testing.mount(FormPermissions, {
		limit: true,
		permissions: permissions,
	});

	testing.hasAttribute("#form-item-select-budget","disabled", "");
	testing.find("#form-item-select-calendar");
	testing.find("#form-item-select-cook");
	testing.find("#form-item-select-health");
	testing.find("#form-item-select-inventory");
	testing.find("#form-item-select-notes");
	const settings = testing.find("#form-item-select-settings");
	testing.value(settings, "Edit");
	const shop = testing.find("#form-item-select-shop");
	testing.value(shop, "Edit");
	testing.find("#form-item-select-shop");
	const plan = testing.find("#form-item-select-plan");
	testing.value(plan, "Edit");
	testing.input(plan, "None");
	testing.find("#form-item-select-plan");
	await testing.sleep(500);
	testing.value(settings, "View");

	testing.mount(FormPermissions, {
		limit: true,
		permissions: permissions,
		personal: true,
	});

	testing.find("#form-item-select-calendar");
	testing.notFind("#form-item-select-cook");
	testing.notFind("#form-item-select-inventory");
});
