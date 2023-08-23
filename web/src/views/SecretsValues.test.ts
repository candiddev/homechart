import { App } from "@lib/layout/App";

import seed from "../jest/seed";
import { routeOptions } from "../routes";
import { AuthAccountState } from "../states/AuthAccount";
import { SecretsValueState } from "../states/SecretsValue";
import { SecretsVaultState } from "../states/SecretsVault";
import { SecretsValues } from "./SecretsValues";

test("SecretsValues", async () => {
	AuthAccountState.data(seed.authAccounts[0]);
	await AuthAccountState.decryptPrivateKeys("");
	SecretsVaultState.data(seed.secretsVaults);
	SecretsValueState.data(seed.secretsValues);
	await testing.sleep(100);

	testing.mount(App, routeOptions, SecretsValues);

	testing.findAll("tbody tr", 4);

	testing.click("#table-header-name > i");

	testing.text(`#table-data-${seed.secretsValues[0].id}-name`, "Homecharttagjanetagapp");
	testing.text(`#table-data-${seed.secretsValues[0].id}-username`, "********visibility_offcontent_paste");
	testing.click(`#table-data-${seed.secretsValues[0].id}-username i`);
	testing.text(`#table-data-${seed.secretsValues[0].id}-username`, "janevisibilitycontent_paste");
	testing.click("#button-array-show-columns-note");
	testing.find(`#table-data-${seed.secretsValues[1].id}-note`);

	// Filtering
	testing.input("#form-item-input-name", "Homechart");
	testing.redraw();
	testing.findAll("tbody tr", 1);
	testing.input("#form-item-input-name", "");
	testing.redraw();
	testing.findAll("tbody tr", 4);
	testing.input("#form-item-input-table", "Local");
	await testing.sleep(600);
	testing.findAll("tbody tr", 1);
	testing.input("#form-item-input-table", "");
	await testing.sleep(600);
	testing.findAll("tbody tr", 4);
	testing.click("#button-array-show-tag-app");
	testing.findAll("tbody tr", 2);

	// Edit vault
	testing.notFind("#button-edit-vault");
	testing.mocks.params.id = seed.secretsVaults[0].id;
	testing.mount(App, routeOptions, SecretsValues);
	testing.findAll("tbody tr", 2);
	testing.click("#button-edit-vault");
	testing.value("#form-item-input-name", "Jane's Vault");
});
