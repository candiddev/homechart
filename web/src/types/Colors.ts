import { ColorEnum } from "@lib/types/Color";

export const Colors = {
	accent: (color: ColorEnum): number => {
		return color === ColorEnum.Default ?
			ColorEnum.Red :
			color;
	},
	budgetRecurrrence: (color: ColorEnum): number => {
		return color === ColorEnum.Default ?
			ColorEnum.Teal :
			color;
	},
	calendarEvent: (primary: ColorEnum): number => {
		return Colors.primary(primary);
	},
	cookMealPlan: (color: ColorEnum): number => {
		return color === ColorEnum.Default ?
			ColorEnum.Orange :
			color;
	},
	planTask: (colorHousehold: ColorEnum, colorTask: ColorEnum): number => {
		return colorTask === ColorEnum.Default ?
			colorHousehold === ColorEnum.Default ?
				ColorEnum.Pink :
				colorHousehold :
			colorTask;
	},
	primary: (color: ColorEnum): number => {
		return color === ColorEnum.Default ?
			ColorEnum.Yellow :
			color;
	},
	secondary: (color: ColorEnum): number => {
		return color === ColorEnum.Default ?
			ColorEnum.Blue :
			color;
	},
};
