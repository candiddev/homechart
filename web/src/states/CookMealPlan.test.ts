import { CivilDate } from "@lib/types/CivilDate";
import { ColorEnum } from "@lib/types/Color";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";

import { AuthAccountState } from "./AuthAccount";
import type { BudgetPayee } from "./BudgetPayee";
import { BudgetPayeeState } from "./BudgetPayee";
import { CalendarEventState } from "./CalendarEvent";
import type { CookMealPlan } from "./CookMealPlan";
import { CookMealPlanState } from "./CookMealPlan";
import { CookMealTimeState } from "./CookMealTime";
import type { CookRecipe } from "./CookRecipe";
import { CookRecipeState } from "./CookRecipe";
import type { ShopCategory } from "./ShopCategory";
import { ShopCategoryState } from "./ShopCategory";
import type { ShopItem } from "./ShopItem";
import { ShopItemState } from "./ShopItem";

describe("CookMealPlanState", () => {
	test("findDateRange", async () => {
		CookMealTimeState.data([
			{
				...CookMealTimeState.new(),
				...{
					id: "1",
					name: "Breakfast",
					time: "08:00",
				},
			},
			{
				...CookMealTimeState.new(),
				...{
					id: "2",
					name: "Lunch",
					time: "12:00",
				},
			},
		]);

		CookRecipeState.data([
			{
				...CookRecipeState.new(),
				...{
					id: "1",
					name: "Recipe 1",
					shortID: "1",
					timeCook: 60,
					timePrep: 30,
				},
			},
			{
				...CookRecipeState.new(),
				...{
					id: "2",
					name: "Recipe 2",
					shortID: "2",
				},
			},
		]);

		CookMealPlanState.data([
			{
				...CookMealPlanState.new(),
				...{
					authAccountID: "1",
					cookMealTimeID: "1",
					cookRecipeID: "1",
					date: "2020-10-17",
					id: "1",
					notificationTimeCook: "2020-10-17T12:00:00Z",
					notificationTimePrep: "2020-10-17T11:30:00Z",
					time: "08:00",
				},
			},
			{
				...CookMealPlanState.new(),
				...{
					authAccountID: "2",
					cookMealTimeID: "1",
					cookRecipeID: "2",
					date: "2020-10-17",
					id: "2",
					time: "08:00",
				},
			},
			{
				...CookMealPlanState.new(),
				...{
					cookMealTimeID: "1",
					customRecipe: "Recipe 3",
					date: "2020-10-17",
					id: "3",
					time: "08:00",
				},
			},
			{
				...CookMealPlanState.new(),
				...{
					cookMealTimeID: "2",
					customRecipe: "Recipe 4",
					date: "2020-10-17",
					id: "3",
					time: "12:00",
				},
			},
			{
				...CookMealPlanState.new(),
				...{
					cookMealTimeID: "1",
					cookRecipeID: "2",
					date: "2020-10-18",
					id: "4",
					time: "08:00",
				},
			},
		]);

		const start = CivilDate.fromString("2020-10-17");
		const end = CivilDate.fromString("2020-10-18");
		const start1 = Timestamp.fromCivilDate(start);
		start1.timestamp.setHours(6);
		start1.timestamp.setMinutes(30);
		const end1 = Timestamp.fromString(start1.toString());
		end1.addMinutes(CookRecipeState.data()[0].timePrep);

		const start2 = Timestamp.fromCivilDate(start);
		start2.timestamp.setHours(7);
		start2.timestamp.setMinutes(0);
		const end2 = Timestamp.fromString(start2.toString());
		end2.addMinutes(CookRecipeState.data()[0].timeCook);

		const start3 = Timestamp.fromCivilDate(start);
		start3.timestamp.setHours(8);
		start3.timestamp.setMinutes(0);
		const end3 = Timestamp.fromString(start3.toString());
		end3.addMinutes(30);

		const start4 = Timestamp.fromCivilDate(start);
		start4.timestamp.setHours(12);
		start4.timestamp.setMinutes(0);
		const end4 = Timestamp.fromString(start4.toString());
		end4.addMinutes(30);

		const start5 = Timestamp.fromCivilDate(CivilDate.fromString("2020-10-18"));
		start5.timestamp.setHours(8);
		start5.timestamp.setMinutes(0);
		const end5 = Timestamp.fromString(start5.toString());
		end5.addMinutes(30);

		expect(CookMealPlanState.findDateRange(start, end)())
			.toStrictEqual(CalendarEventState.toCalendarEventsRange([
				{
					...CalendarEventState.new(),
					...{
						color: ColorEnum.Orange,
						cookMealPlans: [
							CookMealPlanState.data()[0],
						],
						duration: CookRecipeState.data()[0].timePrep,
						icon: Icons.CookMealPlan,
						name: `Prep ${CookRecipeState.data()[0].name}`,
						participants: [
							"1",
						],
						timeStart: "06:30",
						timestampEnd: end1.toString(),
						timestampStart: start1.toString(),
					},
				},
				{
					...CalendarEventState.new(),
					...{
						color: ColorEnum.Orange,
						cookMealPlans: [
							CookMealPlanState.data()[0],
						],
						duration: CookRecipeState.data()[0].timeCook,
						icon: Icons.CookMealPlan,
						name: `Cook ${CookRecipeState.data()[0].name}`,
						participants: [
							"1",
						],
						timeStart: "07:00",
						timestampEnd: end2.toString(),
						timestampStart: start2.toString(),
					},
				},
				{
					...CalendarEventState.new(),
					...{
						color: ColorEnum.Orange,
						cookMealPlans: [
							CookMealPlanState.data()[0],
							CookMealPlanState.data()[1],
							CookMealPlanState.data()[2],
						],
						dateStart: "2020-10-17",
						duration: 30,
						icon: Icons.CookMealPlan,
						name: "Breakfast",
						participants: [
							"1",
							"2",
						],
						timeStart: "08:00",
						timestampEnd: end3.toString(),
						timestampStart: start3.toString(),
					},
				},
				{
					...CalendarEventState.new(),
					...{
						color: ColorEnum.Orange,
						cookMealPlans: [
							CookMealPlanState.data()[3],
						],
						dateStart: "2020-10-17",
						duration: 30,
						icon: Icons.CookMealPlan,
						name: "Lunch",
						timeStart: "12:00",
						timestampEnd: end4.toString(),
						timestampStart: start4.toString(),
					},
				},
				{
					...CalendarEventState.new(),
					...{
						color: ColorEnum.Orange,
						cookMealPlans: [
							CookMealPlanState.data()[4],
						],
						dateStart: "2020-10-18",
						duration: 30,
						icon: Icons.CookMealPlan,
						name: "Breakfast",
						timeStart: "08:00",
						timestampEnd: end5.toString(),
						timestampStart: start5.toString(),
					},
				},
			], start, end));
	});

	test("toShopItem", async () => {
		const categories: ShopCategory[] = [
			{
				...ShopCategoryState.new(),
				...{
					budgetPayeeID: "1",
					id: "1",
					match: "alpha|beta|charlie|peanut butter|cereal",
					name: "a",
				},
			},
			{
				...ShopCategoryState.new(),
				...{
					address: "123 Wall St, Hometown, USA",
					budgetPayeeID: "2",
					id: "2",
					match: "delta|echo|foxtrot|cracker|milk",
					name: "b",
				},
			},
		];

		const stores: BudgetPayee[] = [
			{
				...BudgetPayeeState.new(),
				...{
					address: "123 Main St, Hometown, USA",
					id: "1",
					name: "General Store",
					shopItemCount: 1,
				},
			},
			{
				...BudgetPayeeState.new(),
				...{
					address: "123 Wall St, Hometown, USA",
					id: "2",
					name: "Mega Mart",
					shopItemCount: 1,
				},
			},
		];

		const recipes: CookRecipe[] = [
			{
				...CookRecipeState.new(),
				...{
					authHouseholdID: "1",
					id: "1",
					ingredients: `2 tablespoons peanut butter
2 crackers, bottom up`,
					name: "Peanut Butter Cracker",
					shortID: "1",
				},
			},
			{
				...CookRecipeState.new(),
				...{
					authHouseholdID: "1",
					id: "2",
					ingredients: `1 cup cereal, sugary
 1/2 cup milk
1 #cookrecipe/3`,
					name: "Cereal",
					shortID: "2",
				},
			},
			{
				...CookRecipeState.new(),
				...{
					authHouseholdID: "1",
					id: "3",
					ingredients: `# For the shake
 2 #cookrecipe/1
1/4 #cookrecipe/2

Something to pour it in:
1 glass`,
					name: "Peanut Butter Cracker Cereal Milk",
					shortID: "3",
				},
			},
		];

		AuthAccountState.data().primaryAuthHouseholdID = "1";
		CookRecipeState.data(recipes);
		ShopCategoryState.data(categories);
		BudgetPayeeState.data(stores);

		const input: CookMealPlan[] = [
			{
				...CookMealPlanState.new(),
				...{
					cookRecipeID: recipes[2].id,
					cookRecipeScale: "2",
				},
			},
		];

		const output: ShopItem[] = [
			{
				...ShopItemState.new(),
				...{
					add: true,
					authHouseholdID: "1",
					budgetPayeeID: stores[0].id,
					cookRecipeID: recipes[0].id,
					name: "8 tablespoons peanut butter",
					shopCategoryID: categories[0].id,
				},
			},
			{
				...ShopItemState.new(),
				...{
					add: true,
					authHouseholdID: "1",
					budgetPayeeID: stores[1].id,
					cookRecipeID: recipes[0].id,
					name: "8 crackers, bottom up",
					shopCategoryID: categories[1].id,
				},
			},
			{
				...ShopItemState.new(),
				...{
					add: true,
					authHouseholdID: "1",
					budgetPayeeID: stores[0].id,
					cookRecipeID: recipes[1].id,
					name: "1/2 cup cereal, sugary",
					shopCategoryID: categories[0].id,
				},
			},
			{
				...ShopItemState.new(),
				...{
					add: true,
					authHouseholdID: "1",
					budgetPayeeID: stores[1].id,
					cookRecipeID: recipes[1].id,
					name: "1/4 cup milk",
					shopCategoryID: categories[1].id,
				},
			},
			{
				...ShopItemState.new(),
				...{
					add: true,
					authHouseholdID: "1",
					budgetPayeeID: stores[0].id,
					cookRecipeID: recipes[1].id,
					name: "1/2 Peanut Butter Cracker Cereal Milk",
					shopCategoryID: categories[0].id,
				},
			},
			{
				...ShopItemState.new(),
				...{
					add: true,
					authHouseholdID: "1",
					cookRecipeID: recipes[2].id,
					name: "2 glass",
				},
			},
		];

		expect(CookMealPlanState.toShopItems(input)
			.map((item) => {
				item.id = null;
				return item;
			}))
			.toStrictEqual(output);
	});
});
