import type { FormItemAutocompleteParseOutput } from "@lib/components/FormItem";

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
import {
  ObjectAccount,
  ObjectBookmark,
  ObjectBudget,
  ObjectCard,
  ObjectCategory,
  ObjectCollection,
  ObjectCook,
  ObjectInventory,
  ObjectItem,
  ObjectList,
  ObjectNotes,
  ObjectPage,
  ObjectPayee,
  ObjectPlan,
  ObjectProject,
  ObjectRecipe,
  ObjectReward,
  ObjectSecrets,
  ObjectShop,
  ObjectStore,
  ObjectTask,
  ObjectValue,
  ObjectVault,
} from "../yaml8n";

export const FormItemAutocomplete = {
  options: AuthAccountState.data.map((_) => {
    return [
      AuthAccountState.translate(ObjectBookmark),
      `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectAccount)}`,
      `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectCategory)}`,
      `${AuthAccountState.translate(ObjectBudget)} > ${AuthAccountState.translate(ObjectPayee)}`,
      `${AuthAccountState.translate(ObjectCook)} > ${AuthAccountState.translate(ObjectRecipe)}`,
      `${AuthAccountState.translate(ObjectInventory)} > ${AuthAccountState.translate(ObjectCollection)}`,
      `${AuthAccountState.translate(ObjectInventory)} > ${AuthAccountState.translate(ObjectItem)}`,
      `${AuthAccountState.translate(ObjectNotes)} > ${AuthAccountState.translate(ObjectPage)}`,
      `${AuthAccountState.translate(ObjectPlan)} > ${AuthAccountState.translate(ObjectProject)}`,
      `${AuthAccountState.translate(ObjectPlan)} > ${AuthAccountState.translate(ObjectTask)}`,
      `${AuthAccountState.translate(ObjectReward)} > ${AuthAccountState.translate(ObjectCard)}`,
      `${AuthAccountState.translate(ObjectSecrets)} > ${AuthAccountState.translate(ObjectValue)}`,
      `${AuthAccountState.translate(ObjectSecrets)} > ${AuthAccountState.translate(ObjectVault)}`,
      `${AuthAccountState.translate(ObjectSecrets)} > ${AuthAccountState.translate(ObjectValue)}`,
      `${AuthAccountState.translate(ObjectSecrets)} > ${AuthAccountState.translate(ObjectVault)}`,
      `${AuthAccountState.translate(ObjectShop)} > ${AuthAccountState.translate(ObjectList)}`,
      `${AuthAccountState.translate(ObjectShop)} > ${AuthAccountState.translate(ObjectStore)}`,
    ];
  }),
  parse: (input: string): FormItemAutocompleteParseOutput => {
    const output: FormItemAutocompleteParseOutput = {
      options: [],
      splice: input,
      visible: true,
    };

    if (FormItemAutocomplete.type === "") {
      output.splice = output.splice.toLowerCase().replace(" > ", "");
      FormItemAutocomplete.type = output.splice;

      switch (output.splice) {
        case "bookmark":
          output.options = BookmarkState.names();
          break;
        case "budgetaccount":
          output.options = BudgetAccountState.names();
          break;
        case "budgetcategory":
          output.options = BudgetCategoryState.names();
          break;
        case "budgetpayee":
          output.options = BudgetPayeeState.names();
          break;
        case "cookrecipe":
          output.options = CookRecipeState.names();
          break;
        case "inventorycollection":
          output.options = InventoryCollectionState.names();
          break;
        case "inventoryitem":
          output.options = InventoryItemState.names();
          break;
        case "notespage":
          output.options = NotesPageState.names();
          break;
        case "planproject":
          output.options = PlanProjectState.names();
          break;
        case "plantask":
          output.options = PlanTaskState.names();
          break;
        case "rewardcard":
          output.options = RewardCardState.names();
          break;
        case "secretsvalue":
          output.options = SecretsValueState.names();
          break;
        case "secretsvault":
          output.options = SecretsVaultState.names();
          break;
        case "shoplist":
          output.options = ShopListState.names();
          break;
        case "shopstore":
          output.options = BudgetPayeeState.storeNames();
          break;
      }

      if (output.options.length === 0) {
        FormItemAutocomplete.type = "";
      }

      output.splice += "/";
    } else {
      switch (FormItemAutocomplete.type) {
        case "bookmark":
          let bookmark = BookmarkState.findName(output.splice);

          if (bookmark.id === null) {
            bookmark = BookmarkState.findName(output.splice, true);
          }

          output.splice = bookmark.shortID;
          break;
        case "budgetaccount":
          output.splice = BudgetAccountState.findName(output.splice).shortID;
          break;
        case "budgetcategory":
          output.splice = BudgetCategoryState.findGroupName(
            output.splice,
          ).shortID;
          break;
        case "budgetpayee":
          output.splice = BudgetPayeeState.findName(output.splice).shortID;
          break;
        case "cookrecipe":
          output.splice = CookRecipeState.findName(output.splice).shortID;
          break;
        case "inventorycollection":
          output.splice = InventoryCollectionState.findName(
            output.splice,
          ).shortID;
          break;
        case "inventoryitem":
          output.splice = InventoryItemState.findName(output.splice).shortID;
          break;
        case "notespage":
          let page = NotesPageState.findName(output.splice);

          if (page.id === null) {
            page = NotesPageState.findName(output.splice, true);
          }

          output.splice = page.shortID;
          break;
        case "planproject":
          let project = PlanProjectState.findName(output.splice);

          if (project.id === null) {
            project = PlanProjectState.findName(output.splice, true);
          }

          output.splice = project.shortID;
          break;
        case "plantask":
          let task = PlanTaskState.findName(output.splice);

          if (task.id === null) {
            task = PlanTaskState.findName(output.splice, true);
          }

          output.splice = task.shortID;
          break;
        case "rewardcard":
          output.splice = RewardCardState.findName(output.splice).shortID;
          break;
        case "secretsvalue":
          let value = SecretsValueState.findName(output.splice);

          if (value.id === null) {
            value = SecretsValueState.findName(output.splice, true);
          }

          output.splice = value.shortID;
          break;
        case "secretsvault":
          let vault = SecretsVaultState.findName(output.splice);

          if (vault.id === null) {
            vault = SecretsVaultState.findName(output.splice, true);
          }

          output.splice = vault.shortID;
          break;
        case "shoplist":
          let list = ShopListState.findName(output.splice);

          if (list.id === null) {
            list = ShopListState.findName(output.splice, true);
          }

          output.splice = list.shortID;
          break;
        case "shopstore":
          output.splice = BudgetPayeeState.findName(output.splice).shortID;
          break;
      }

      FormItemAutocomplete.type = "";
      output.options = [];
      output.splice += " ";
      output.visible = false;
    }

    return output;
  },
  type: "",
};
