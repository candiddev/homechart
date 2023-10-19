import type { EncryptedValue, Key } from "@lib/encryption/Encryption";
import { KeyTypeAES128, KeyTypeRSA2048Private, NewKey } from "@lib/encryption/Encryption";
import { Icons } from "@lib/types/Icons";

import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
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
import { MarkdownLinks } from "./MarkdownLinks";

beforeAll(async () => {
	const keys = await NewKey(KeyTypeRSA2048Private) as {
		publicKey: Key,
		privateKey: Key,
	};
	AuthAccountState.data().publicKey = keys.publicKey.string();
	AuthAccountState.privateKey(keys.privateKey);

	const key = (await NewKey(KeyTypeAES128) as {
		key: Key,
	}).key;
	const name = await key.encrypt("Value 1") as EncryptedValue;
	SecretsValueState.data([
		{
			...SecretsValueState.data()[0],
			...{
				dataEncrypted: [
					(await key.encrypt(JSON.stringify({
						value: "123",
					})) as EncryptedValue).string(),
				],
				nameEncrypted: name.string() ,
				updated: "1",
			},
		},
	]);
	SecretsVaultState.data([
		{
			...SecretsVaultState.data()[0],
			...{
				keys: [
					{
						authAccountID: "1",
						key: (await keys.publicKey.encrypt(key.string()) as EncryptedValue).string() ,
					},
				],
			},
		},
	]);

	await testing.sleep(100);
});

describe("MarkdownLinks", () => {
	AuthAccountState.data().id = "1";
	AuthAccountState.data().primaryAuthHouseholdID = "1";
	AuthHouseholdState.data([
		{
			...AuthHouseholdState.new(),
			...{
				id: "1",
			},
		},
	]);
	BookmarkState.data([
		{
			...BookmarkState.new(),
			...{
				authAccountID: "1",
				authHouseholdID: null,
				id: "2",
				link: "http://example.com/personal",
				name: "Bookmark 3",
				shortID: "1",
			},
		},
		{
			...BookmarkState.new(),
			...{
				authHouseholdID: "1",
				id: "3",
				link: "http://example.com/household",
				name: "Bookmark 2",
				shortID: "2",
			},
		},
	]);
	BudgetAccountState.data([
		{
			...BudgetAccountState.new(),
			...{
				authHouseholdID: "1",
				id: "2",
				name: "Account 1",
				shortID: "1",
			},
		},
	]);
	BudgetCategoryState.data([
		{
			...BudgetCategoryState.new(),
			...{
				authHouseholdID: "1",
				id: "3",
				name: "Category 2",
				shortID: "2",
			},
		},
	]);
	BudgetPayeeState.data([
		{
			...BudgetPayeeState.new(),
			...{
				authHouseholdID: "1",
				id: "3",
				name: "Payee 3",
				shopStore: true,
				shortID: "3",
			},
		},
	]);
	CookRecipeState.data([
		{
			...CookRecipeState.new(),
			...{
				authHouseholdID: "1",
				id: "2",
				name: "Recipe 1",
				shortID: "1",
			},
		},
		{
			...CookRecipeState.new(),
			...{
				authHouseholdID: "1",
				id: "3",
				name: "Recipe 2",
				shortID: "2",
			},
		},
	]);
	InventoryCollectionState.data([
		{
			...InventoryCollectionState.new(),
			...{
				authHouseholdID: "1",
				id: "1",
				name: "Collection 1",
				shortID: "1",
			},
		},
	]),
	InventoryItemState.data([
		{
			...InventoryItemState.new(),
			...{
				authHouseholdID: "1",
				id: "1",
				name: "Item 1",
				shortID: "1",
			},
		},
	]),
	NotesPageState.data([
		{
			...NotesPageState.new(),
			...{
				authAccountID: "1",
				authHouseholdID: null,
				id: "2",
				name: "Page 2",
				shortID: "1",
			},
		},
		{
			...NotesPageState.new(),
			...{
				authHouseholdID: "1",
				id: "3",
				name: "Page 1",
				shortID: "2",
			},
		},
	]);
	PlanProjectState.data([
		{
			...PlanProjectState.new(),
			...{
				authAccountID: "1",
				authHouseholdID: null,
				id: "2",
				name: "Project 2",
				shortID: "1",
			},
		},
		{
			...PlanProjectState.new(),
			...{
				authHouseholdID: "1",
				id: "3",
				name: "Project 1",
				shortID: "2",
			},
		},
	]);
	PlanTaskState.data([
		{
			...PlanTaskState.new(),
			...{
				authAccountID: "1",
				authHouseholdID: null,
				id: "2",
				name: "Task 3",
				shortID: "1",
			},
		},
		{
			...PlanTaskState.new(),
			...{
				authHouseholdID: "1",
				id: "3",
				name: "Task 1",
				shortID: "2",
			},
		},
		{
			...PlanTaskState.new(),
			...{
				authAccountID: null,
				authHouseholdID: "1",
				id: "4",
				name: "Task 2",
				planProjectID: "1",
				shortID: "3",
			},
		},
	]);
	RewardCardState.data([
		{
			...RewardCardState.new(),
			...{
				id: "2",
				name: "Card 1",
				senders: [
					"1",
				],
				shortID: "1",
			},
		},
		{
			...RewardCardState.new(),
			...{
				id: "3",
				name: "Card 2",
				senders: [
					"2",
				],
				shortID: "2",
			},
		},
	]);

	SecretsValueState.data([
		{
			...SecretsValueState.new(),
			...{
				id: "1",
				secretsVaultID: "1",
				shortID: "1",
			},
		},
	]);

	SecretsVaultState.data([
		{
			...SecretsVaultState.new(),
			...{
				id: "1",
				name: "Vault 1",
				shortID: "1",
			},
		},
	]);
	ShopListState.data([
		{
			...ShopListState.new(),
			...{
				authAccountID: "1",
				authHouseholdID: null,
				id: "2",
				name: "List 1",
				shortID: "1",
			},
		},
		{
			...ShopListState.new(),
			...{
				authAccountID: null,
				authHouseholdID: "1",
				id: "3",
				name: "List 2",
				shortID: "2",
			},
		},
	]);
	test.each([
		[
			"#bookmark/1",
			{
				icon: Icons.Bookmark,
				link: BookmarkState.data()[0].link,
				name: BookmarkState.data()[0].name,
			},
		],
		[
			"#bookmark/2",
			{
				icon: Icons.Bookmark,
				link: BookmarkState.data()[1].link,
				name: BookmarkState.data()[1].name,
			},
		],
		[
			"#budgetaccount/1",
			{
				icon: Icons.BudgetAccount,
				link: "/budget/transactions?account=2",
				name: BudgetAccountState.data()[0].name,
			},
		],
		[
			"#budgetcategory/2",
			{
				icon: Icons.BudgetCategory,
				link: "/budget/categories",
				name: BudgetCategoryState.data()[0].name,
			},
		],
		[
			"#budgetpayee/3",
			{
				icon: Icons.BudgetPayee,
				link: "/budget/payees",
				name: BudgetPayeeState.data()[0].name,
			},
		],
		[
			"#cookrecipe/1",
			{
				icon: Icons.CookRecipe,
				link: "/cook/recipes/2",
				name: CookRecipeState.data()[0].name,
			},
		],
		[
			"#cookrecipe/2?scale=10",
			{
				icon: Icons.CookRecipe,
				link: "/cook/recipes/3?scale=10",
				name: CookRecipeState.data()[1].name,
			},
		],
		[
			"#inventorycollection/1",
			{
				icon: Icons.InventoryCollection,
				link: "/inventory/1",
				name: InventoryCollectionState.data()[0].name,
			},
		],
		[
			"#inventoryitem/1",
			{
				icon: Icons.Inventory,
				link: `/inventory/all?id=${InventoryItemState.data()[0].id}`,
				name: InventoryItemState.data()[0].name,
			},
		],
		[
			"#inventoryitem/1?icon",
			{
				icon: "inventory",
				name: `[1 ${InventoryItemState.data()[0].name}](/inventory/all?id=1)`,
			},
		],
		[
			"#notespage/1",
			{
				icon: Icons.Notes,
				link: "/notes/personal/2",
				name: NotesPageState.data()[0].name,
			},
		],
		[
			"#notespage/2",
			{
				icon: Icons.Notes,
				link: "/notes/household/3",
				name: NotesPageState.data()[1].name,
			},
		],
		[
			"#planproject/1",
			{
				icon: Icons.PlanProject,
				link: "/plan/tasks?project=2",
				name: PlanProjectState.data()[0].name,
			},
		],
		[
			"#planproject/2",
			{
				icon: Icons.PlanProject,
				link: "/plan/tasks?project=3",
				name: PlanProjectState.data()[1].name,
			},
		],
		[
			"#plantask/1",
			{
				icon: Icons.PlanTask,
				link: "/plan/tasks?filter=personal",
				name: PlanTaskState.data()[0].name,
			},
		],
		[
			"#plantask/2",
			{
				icon: Icons.PlanTask,
				link: "/plan/tasks?filter=household",
				name: PlanTaskState.data()[1].name,
			},
		],
		[
			"#plantask/3",
			{
				icon: Icons.PlanTask,
				link: "/plan/tasks?project=1",
				name: PlanTaskState.data()[2].name,
			},
		],
		[
			"#rewardcard/1",
			{
				icon: Icons.Reward,
				link: "/reward/sent#2",
				name: RewardCardState.data()[0].name,
			},
		],
		[
			"#rewardcard/2",
			{
				icon: Icons.Reward,
				link: "/reward/received#3",
				name: RewardCardState.data()[1].name,
			},
		],
		[
			"#secretsvalue/1",
			{
				icon: Icons.SecretsValue,
				link: "/secrets/1",
				name: "Value 1",
			},
		],
		[
			"#secretsvalue/1?value",
			{
				icon: undefined,
				link: undefined,
				name: "123",
			},
		],
		[
			"#secretsvault/1",
			{
				icon: Icons.SecretsVault,
				link: "/secrets/1",
				name: "Vault 1",
			},
		],
		[
			"#shopstore/3",
			{
				icon: Icons.BudgetPayee,
				link: "/shop/items?store=3",
				name: BudgetPayeeState.data()[0].name,
			},
		],
		[
			"#shoplist/1",
			{
				icon: Icons.ShopList,
				link: "/shop/lists/2",
				name: ShopListState.data()[0].name,
			},
		],
		[
			"#shoplist/2",
			{
				icon: Icons.ShopList,
				link: "/shop/lists/3",
				name: ShopListState.data()[1].name,
			},
		],
	])("parse %s", (input, output) => {
		expect(MarkdownLinks.parse(input))
			.toStrictEqual(output);
	});
});
