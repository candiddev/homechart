import { CivilDate } from "@lib/types/CivilDate";

const now = CivilDate.now();
const n = now.month * 100 + now.day;

let colors = {
  accent: "red",
  primary: "yellow",
  secondary: "blue",
};

if (n < 202 || n > 1223) {
  colors = {
    accent: "red",
    primary: "green",
    secondary: "white",
  };
} else if (n < 323) {
  colors = {
    accent: "green",
    primary: "blue",
    secondary: "yellow",
  };
} else if (n < 502) {
  colors = {
    accent: "yellow",
    primary: "pink",
    secondary: "blue",
  };
} else if (n < 623) {
  colors = {
    accent: "red",
    primary: "yellow",
    secondary: "orange",
  };
} else if (n < 802) {
  colors = {
    accent: "green",
    primary: "orange",
    secondary: "yellow",
  };
} else if (n < 923) {
  colors = {
    accent: "orange",
    primary: "brown",
    secondary: "green",
  };
} else if (n < 1102) {
  colors = {
    accent: "black",
    primary: "orange",
    secondary: "purple",
  };
} else if (n === 1208) {
  // Homechart birthday!
} else if (n < 1223) {
  colors = {
    accent: "green",
    primary: "red",
    secondary: "blue",
  };
}

export const Colors = {
  accent: (color: string): string => {
    return color === "" ? colors.accent : color;
  },
  budgetRecurrrence: (color: string): string => {
    return color === "" ? "teal" : color;
  },
  calendarEvent: (color: string): string => {
    return color === "" ? "yellow" : color;
  },
  cookMealPlan: (color: string): string => {
    return color === "" ? "orange" : color;
  },
  healthLog: (color: string): string => {
    return color === "" ? "indigo" : color;
  },
  negative: (color: string): string => {
    return color === "" ? "pink" : color;
  },
  planTask: (colorHousehold: string, colorTask: string): string => {
    return colorTask === ""
      ? colorHousehold === ""
        ? "blue"
        : colorHousehold
      : colorTask;
  },
  positive: (color: string): string => {
    return color === "" ? "teal" : color;
  },
  primary: (color: string): string => {
    return color === "" ? colors.primary : color;
  },
  secondary: (color: string): string => {
    return color === "" ? colors.secondary : color;
  },
};
