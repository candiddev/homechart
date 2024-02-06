import { AppState } from "@lib/states/App";
import { ActionsEnum } from "@lib/types/Actions";
import { CivilDate } from "@lib/types/CivilDate";
import { CivilTime } from "@lib/types/CivilTime";
import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { UUID } from "@lib/types/UUID";
import type Stream from "mithril/stream";

import { Colors } from "../types/Colors";
import { DataTypeEnum } from "../types/DataType";
import {
  ObjectMealPlanCreated,
  ObjectMealPlanDeleted,
  ObjectMealPlanUpdated,
} from "../yaml8n";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import type { CalendarEvent, CalendarEventRange } from "./CalendarEvent";
import { CalendarEventState } from "./CalendarEvent";
import { CookMealTimeState } from "./CookMealTime";
import { CookRecipeState } from "./CookRecipe";
import { DataArrayManager } from "./DataArray";
import { ShopCategoryState } from "./ShopCategory";
import type { ShopItem } from "./ShopItem";
import { ShopItemState } from "./ShopItem";

const markdown = /^(#|`)|$/;
const quantity = /^\d+(\/\d+)?/;
const shortID = /#cookrecipe\/(\w+)/;

export interface CookMealPlan {
  authAccountID: NullUUID;
  authHouseholdID: NullUUID;
  cookMealTimeID: NullUUID;
  cookRecipeID: NullUUID;
  cookRecipeScale: string;
  created: NullTimestamp;
  customRecipe: string;
  date: NullCivilDate;
  id: NullUUID;
  notificationTimeCook: NullTimestamp;
  notificationTimePrep: NullTimestamp;
  time: NullCivilTime;
  updated: NullTimestamp;
}

class CookMealPlanManager extends DataArrayManager<CookMealPlan> {
  constructor() {
    super("/api/v1/cook/meal-plans", "date", false, DataTypeEnum.CookMealPlan);
  }

  override alertAction(
    a: ActionsEnum,
    hideAlert?: boolean,
    actions?: {
      name: string;
      onclick(): Promise<void>;
    }[],
  ): void {
    let msg = "";

    switch (a) {
      case ActionsEnum.Create:
        msg = AuthAccountState.translate(ObjectMealPlanCreated);
        break;
      case ActionsEnum.Delete:
        msg = AuthAccountState.translate(ObjectMealPlanDeleted);
        break;
      case ActionsEnum.Update:
        msg = AuthAccountState.translate(ObjectMealPlanUpdated);
        break;
    }

    AppState.setLayoutAppAlert(
      {
        actions: actions,
        message: msg,
      },
      hideAlert,
    );
  }

  findDateRange(from: CivilDate, to: CivilDate): Stream<CalendarEventRange> {
    return this.data.map((plans) => {
      const events: CalendarEvent[] = [];

      const fromValue = from.valueOf();
      const toValue = to.valueOf();

      for (const plan of plans) {
        const date = CivilDate.fromString(plan.date!) // eslint-disable-line @typescript-eslint/no-non-null-assertion
          .valueOf();

        const color = Colors.cookMealPlan(
          AuthHouseholdState.findID(plan.authHouseholdID).preferences
            .colorCookMealPlanEvents,
        );

        if (date <= toValue && date >= fromValue) {
          const meal = CookMealTimeState.findID(plan.cookMealTimeID);
          const recipe = CookRecipeState.findID(plan.cookRecipeID);

          if (
            plan.cookRecipeID !== null &&
            plan.notificationTimePrep !== null &&
            recipe.timePrep !== 0
          ) {
            const time = Timestamp.fromString(plan.notificationTimePrep);
            const end = Timestamp.fromString(plan.notificationTimePrep);
            end.addMinutes(recipe.timePrep);

            events.push({
              ...CalendarEventState.new(),
              ...{
                authHouseholdID: plan.authHouseholdID,
                color: color,
                cookMealPlans: [plan],
                duration: recipe.timePrep,
                icon: Icons.CookMealPlan,
                name: `Prep ${recipe.name}`,
                participants:
                  plan.authAccountID === null ? [] : [plan.authAccountID],
                timeStart: time.toCivilTime().toString(true),
                timestampEnd: end.toString(),
                timestampStart: time.toString(),
              },
            });
          }

          if (
            plan.cookRecipeID !== null &&
            plan.notificationTimeCook !== null &&
            recipe.timeCook !== 0
          ) {
            const time = Timestamp.fromString(plan.notificationTimeCook);
            const end = Timestamp.fromString(plan.notificationTimeCook);
            end.addMinutes(recipe.timeCook);

            events.push({
              ...CalendarEventState.new(),
              ...{
                authHouseholdID: recipe.authHouseholdID,
                color: color,
                cookMealPlans: [plan],
                duration: recipe.timeCook,
                icon: Icons.CookMealPlan,
                name: `Cook ${recipe.name}`,
                participants:
                  plan.authAccountID === null ? [] : [plan.authAccountID],
                timeStart: time.toCivilTime().toString(true),
                timestampEnd: end.toString(),
                timestampStart: time.toString(),
              },
            });
          }

          const date = CivilDate.fromString(plan.date!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
          const time = CivilTime.fromString(plan.time!); // eslint-disable-line @typescript-eslint/no-non-null-assertion
          const start = Timestamp.fromString(
            new Date(
              date.year,
              date.month - 1,
              date.day,
              time.hour,
              time.minute,
              0,
              0,
            ).toISOString(),
          );
          const end = Timestamp.fromString(start.toString());
          end.addMinutes(30);

          const index = events.findIndex((event) => {
            return (
              event.dateStart === date.toJSON() && event.name === meal.name
            ); // eslint-disable-line @typescript-eslint/no-non-null-assertion
          });

          if (index < 0) {
            events.push({
              ...CalendarEventState.new(),
              ...{
                authHouseholdID: plan.authHouseholdID,
                color: color,
                cookMealPlans: [plan],
                dateStart: date.toJSON(),
                duration: 30,
                icon: Icons.CookMealPlan,
                name: meal.name,
                participants:
                  plan.authAccountID === null ? [] : [plan.authAccountID],
                timeStart: time.toString(true),
                timestampEnd: end.toString(),
                timestampStart: start.toString(),
              },
            });
          } else {
            events[index].cookMealPlans!.push(plan); // eslint-disable-line @typescript-eslint/no-non-null-assertion

            if (
              plan.authAccountID !== null &&
              !events[index].participants.includes(plan.authAccountID)
            ) {
              events[index].participants.push(plan.authAccountID);
            }
          }
        }
      }

      return CalendarEventState.toCalendarEventsRange(events, from, to);
    });
  }

  override new(): CookMealPlan {
    return {
      authAccountID: null,
      authHouseholdID: AuthAccountState.data().primaryAuthHouseholdID,
      cookMealTimeID: null,
      cookRecipeID: null,
      cookRecipeScale: "1",
      created: null,
      customRecipe: "",
      date: Timestamp.now().toCivilDate().toJSON(),
      id: null,
      notificationTimeCook: null,
      notificationTimePrep: null,
      time: "12:00",
      updated: null,
    };
  }

  toShopItems(
    plans?: CookMealPlan[],
    cookRecipeShortIDs?: string[],
  ): ShopItem[] {
    let items: ShopItem[] = [];

    if (plans === undefined) {
      return items;
    }

    let ids: string[] = [];
    if (cookRecipeShortIDs !== undefined) {
      ids = cookRecipeShortIDs;
    }

    for (const plan of plans) {
      const recipe = CookRecipeState.findID(plan.cookRecipeID);

      if (recipe.id !== null) {
        // Keep track of recipe id so we don't iterate it again
        ids.push(recipe.shortID);
        const ingredients = CookRecipeState.scaleIngredients(
          recipe.ingredients,
          plan.cookRecipeScale,
        );
        const lines = ingredients.split("\n");
        for (let i = 0; i < lines.length; i++) {
          let name = lines[i].trimStart();

          if (!quantity.test(name) && markdown.test(name)) {
            continue;
          }

          // If this is a recipe, traverse if not one that has been traversed already
          if (shortID.test(name)) {
            const recipeQuantity = quantity.exec(name)![0]; //eslint-disable-line @typescript-eslint/no-non-null-assertion
            const recipeID = shortID.exec(name)![1]; //eslint-disable-line @typescript-eslint/no-non-null-assertion
            const subrecipe = CookRecipeState.findShortID(recipeID);

            if (ids.includes(recipeID)) {
              name = `${recipeQuantity} ${subrecipe.name}`;
            } else {
              const newMealPlan: CookMealPlan = {
                ...this.new(),
                ...{
                  cookRecipeID: subrecipe.id,
                  cookRecipeScale: recipeQuantity,
                },
              };
              items = items.concat(this.toShopItems([newMealPlan], ids));
              continue;
            }
          }

          const category = ShopCategoryState.findMatch(name);

          items.push({
            ...ShopItemState.new(),
            ...{
              add: !name.includes("inventoryitem"),
              authHouseholdID: plan.authHouseholdID,
              budgetPayeeID: category.budgetPayeeID,
              cookMealPlanID: plan.id,
              cookRecipeID: plan.cookRecipeID,
              id: UUID.new(),
              name: name,
              shopCategoryID: category.id,
            },
          });
        }
      }
    }
    return items;
  }
}

export const CookMealPlanState = new CookMealPlanManager();
