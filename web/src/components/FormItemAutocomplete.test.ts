import seed from "../jest/seed";
import { AuthAccountState } from "../states/AuthAccount";
import { BookmarkState } from "../states/Bookmark";
import { BudgetAccountState } from "../states/BudgetAccount";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { CookRecipeState } from "../states/CookRecipe";
import { InventoryCollectionState } from "../states/InventoryCollection";
import { InventoryItemState } from "../states/InventoryItem";
import { NotesPageState } from "../states/NotesPage";
import { PlanProjectState } from "../states/PlanProject";
import { PlanTaskState } from "../states/PlanTask";
import { RewardCardState } from "../states/RewardCard";
import { SecretsValueState } from "../states/SecretsValue";
import { SecretsVaultState } from "../states/SecretsVault";
import { ShopListState } from "../states/ShopList";
import { FormItemAutocomplete } from "./FormItemAutocomplete";

beforeAll(async () => {
	AuthAccountState.data(seed.authAccounts[0]);

	await AuthAccountState.decryptPrivateKeys("");
	await testing.sleep(100);
});

describe("FormItemAutocomplete", () => {
	BookmarkState.data(seed.bookmarks);
	BudgetAccountState.data(seed.budgetAccounts);
	BudgetCategoryState.data(seed.budgetCategories);
	BudgetPayeeState.data(seed.budgetPayees);
	CookRecipeState.data(seed.cookRecipes);
	InventoryCollectionState.data(seed.inventoryCollections);
	InventoryItemState.data(seed.inventoryItems);
	NotesPageState.data(seed.notesPages);
	PlanProjectState.data(seed.planProjects);
	PlanTaskState.data(seed.planTasks);
	RewardCardState.data(seed.rewardCards);
	SecretsValueState.data(seed.secretsValues);
	SecretsVaultState.data(seed.secretsVaults);
	ShopListState.data(seed.shopLists);

	test.each([
		[
			"Bookmark",
			BookmarkState.names(),
			seed.bookmarks[0].name,
			`${seed.bookmarks[0].shortID}`,
		],
		[
			"Budget > Account",
			BudgetAccountState.names(),
			seed.budgetAccounts[0].name,
			seed.budgetAccounts[0].shortID,
		],
		[
			"Budget > Category",
			BudgetCategoryState.names(),
			`${seed.budgetCategories[0].grouping} > ${seed.budgetCategories[0].name}`,
			seed.budgetCategories[0].shortID,
		],
		[
			"Budget > Payee",
			BudgetPayeeState.names(),
			seed.budgetPayees[0].name,
			seed.budgetPayees[0].shortID,
		],
		[
			"Cook > Recipe",
			CookRecipeState.names(),
			seed.cookRecipes[1].name,
			seed.cookRecipes[1].shortID,
		],
		[
			"Inventory > Collection",
			InventoryCollectionState.names(),
			seed.inventoryCollections[0].name,
			seed.inventoryCollections[0].shortID,
		],
		[
			"Inventory > Item",
			InventoryItemState.names(),
			seed.inventoryItems[0].name,
			seed.inventoryItems[0].shortID,
		],
		[
			"Notes > Page",
			NotesPageState.names(),
			seed.notesPages[0].name,
			`${seed.notesPages[0].shortID}`,
		],
		[
			"Plan > Project",
			PlanProjectState.names(),
			seed.planProjects[0].name,
			`${seed.planProjects[0].shortID}`,
		],
		[
			"Plan > Task",
			PlanTaskState.names(),
			seed.planTasks[0].name,
			`${seed.planTasks[0].shortID}`,
		],
		[
			"Reward > Card",
			RewardCardState.names(),
			seed.rewardCards[0].name,
			seed.rewardCards[0].shortID,
		],
		[
			"Shop > List",
			ShopListState.names(),
			seed.shopLists[0].name,
			`${seed.shopLists[0].shortID}`,
		],
		[
			"Secrets > Value",
			[
				"Homechart",
				"Jennifer Doe",
				"Local Credit Union",
				"Mom's Garage Code",
			],
			"Homechart",
			seed.secretsValues[0].shortID,
		],
		[
			"Secrets > Vault",
			SecretsVaultState.names(),
			seed.secretsVaults[0].name,
			seed.secretsVaults[0].shortID,
		],
		[
			"Shop > Store",
			BudgetPayeeState.storeNames(),
			seed.budgetPayees[0].name,
			seed.budgetPayees[0].shortID,
		],
	])("parse: %s", (input1, options, input2, splice) => {
		expect(FormItemAutocomplete.parse(input1))
			.toStrictEqual({
				options: options,
				splice: `${input1.toLowerCase()
					.replace(" > ", "")}/`,
				visible: true,
			});
		expect(FormItemAutocomplete.parse(input2))
			.toStrictEqual({
				options: [],
				splice: `${splice} `,
				visible: false,
			});
	});
});
