export enum DataTypeEnum {
	AuthAccount,
	AuthAccountAuthHousehold,
	AuthHousehold,
	AuthSession,
	Bookmark,
	BudgetAccount,
	BudgetCategory,
	BudgetMonth,
	BudgetMonthCategory,
	BudgetPayee,
	BudgetRecurrence,
	BudgetTransaction,
	CalendarEvent,
	CalendarICalendar,
	Change,
	CookMealPlan,
	CookMealTime,
	CookRecipe,
	Data,
	HealthItem,
	HealthLog,
	InventoryCollection,
	InventoryItem,
	NotesPage,
	NotesPageVersion,
	PlanProject,
	PlanTask,
	RewardCard,
	SecretsValue,
	SecretsVault,
	ShopCategory,
	ShopItem,
	ShopList,
}

export const DataType = {
	getArray: (type: DataTypeEnum): string => {
		switch (type) {
		case DataTypeEnum.BudgetCategory:
			return "BudgetCategories";
		case DataTypeEnum.ShopCategory:
			return "ShopCategories";
		default:
			return `${DataTypeEnum[type]}s`;
		}
	},
	getObject: (type: DataTypeEnum): string => {
		return DataTypeEnum[type];
	},
};
