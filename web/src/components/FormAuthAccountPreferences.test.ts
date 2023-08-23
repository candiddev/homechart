import { CivilDateOrderEnum, CivilDateSeparator, CivilDateSeparatorEnum } from "@lib/types/CivilDate";
import { ColorEnum } from "@lib/types/Color";

import { AuthAccountState } from "../states/AuthAccount";
import { FormAuthAccountPreferences } from "./FormAuthAccountPreferences";

test("FormAuthAccountPreferences", async () => {
	const state = AuthAccountState.new();
	testing.mount(FormAuthAccountPreferences, {
		authAccount: state,
	});

	testing.input("#form-item-input-email-address", "test@example.com");
	expect(state.emailAddress)
		.toBe("test@example.com");
	testing.input("#form-item-input-name", "test");
	expect(state.name)
		.toBe("test");
	testing.notFind("#form-item-select-date-order");
	testing.click("#form-expander-language-date-and-time");
	testing.input("#form-item-select-time-zone", "America/New_York");
	expect(state.timeZone)
		.toBe("America/New_York");
	const d = testing.find("#form-item-select-date-order");
	testing.input(d, (testing.findAll(`#${d.id} option`)[2] as HTMLOptionElement).value);
	expect(state.preferences.formatDateOrder)
		.toBe(CivilDateOrderEnum.YMD);
	testing.input("#form-item-select-date-separator", CivilDateSeparator[CivilDateSeparatorEnum.Dash]);
	expect(state.preferences.formatDateSeparator)
		.toBe(CivilDateSeparatorEnum.Dash);
	await testing.sleep(100);
	testing.input("#form-item-select-start-of-the-week", "yes");
	expect(state.preferences.formatWeek8601)
		.toBeTruthy();
	testing.input("#form-item-select-time-format", "21:00");
	expect(state.preferences.formatTime24)
		.toBeTruthy();
	testing.notFind("#form-checkbox-input-dark-mode");
	testing.click("#form-expander-color-and-theme");
	testing.click("#form-checkbox-input-dark-mode");
	expect(state.preferences.darkMode)
		.toBeFalsy();
	testing.input("#form-item-select-primary-color", `${ColorEnum.Red}`);
	expect(state.preferences.colorPrimary)
		.toBe(ColorEnum.Red);
	testing.input("#form-item-select-secondary-color", `${ColorEnum.Yellow}`);
	expect(state.preferences.colorSecondary)
		.toBe(ColorEnum.Yellow);
	testing.input("#form-item-select-accent-color", `${ColorEnum.Blue}`);
	expect(state.preferences.colorAccent)
		.toBe(ColorEnum.Blue);
	testing.input("#form-item-select-positive-color", `${ColorEnum.Teal}`);
	expect(state.preferences.colorPositive)
		.toBe(ColorEnum.Teal);
	testing.input("#form-item-select-negative-color", `${ColorEnum.Pink}`);
	expect(state.preferences.colorNegative)
		.toBe(ColorEnum.Pink);
	testing.find("#button-randomize-colors");

	state.child = true;
	testing.redraw();
	await testing.sleep(100);

	testing.notFind("#form-item-input-email-address");
	testing.hasClass("#form-item-input-name", "FormItem__disabled");
});
