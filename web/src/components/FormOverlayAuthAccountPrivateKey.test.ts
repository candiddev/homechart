import { AuthAccountState } from "../states/AuthAccount";
import { FormOverlayAuthAccountPrivateKey } from "./FormOverlayAuthAccountPrivateKey";

test("FormOverlayAuthAccountPrivateKey", async () => {
	AuthAccountState.deletePrivateKey = vi.fn();
	AuthAccountState.setPrivateKey = vi.fn();

	const key = {
		id: "" as NullUUID,
		key: "",
		name: "testing",
		provider: "",
	};

	testing.mount(FormOverlayAuthAccountPrivateKey, {
		data: key,
	});


	// Buttons
	testing.find("#form-update-passphrase");
	testing.click("#button-delete");
	testing.click("#button-confirm-delete");
	expect(AuthAccountState.deletePrivateKey)
		.toBeCalledWith("testing");
	testing.click("#button-cancel");
	testing.click("#button-update");
	expect(AuthAccountState.setPrivateKey)
		.toBeCalled();
	key.id = null;
	testing.redraw();
	testing.click("#button-add");
	expect(AuthAccountState.setPrivateKey)
		.toBeCalled();

	// Name
	const name = testing.find("#form-item-input-name");
	testing.input(name, "Test2");
	expect(key.name)
		.toBe("Test2");
	testing.value(name, "Test2");

	// Password
	const password = testing.find("#form-item-input-new-passphrase");
	testing.input(password, "Test2");
	testing.value(password, "Test2");
	testing.hasAttribute(password, "autocomplete", "off");
	testing.input("#form-item-input-confirm-new-passphrase", "Test2");
});
