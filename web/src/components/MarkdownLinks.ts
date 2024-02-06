import type { MarkdownParseOutput } from "@lib/components/Markdown";
import { Icons } from "@lib/types/Icons";

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

export const MarkdownLinks = {
  match:
    /#(bookmark|budgetaccount|budgetcategory|budgetpayee|cookrecipe|inventorycollection|inventoryitem|notespage|planproject|plantask|rewardcard|secretsvalue|secretsvault|shoplist|shopstore)\/\w+/,
  parse: (word: string): MarkdownParseOutput => {
    const output: MarkdownParseOutput = {
      name: "",
    };

    let options = "";
    const id = word.split("/")[1].split("?")[0];
    if (word.includes("?")) {
      options = word.split("?")[1];
    }

    switch (true) {
      case word.startsWith("#bookmark"): {
        const bookmark = BookmarkState.findShortID(id);
        output.icon =
          bookmark.iconName === "" ? Icons.Bookmark : bookmark.iconName;
        output.link = bookmark.link;
        output.name = bookmark.name;
        break;
      }
      case word.startsWith("#budgetaccount"): {
        const account = BudgetAccountState.findShortID(id);
        output.icon = account.icon === "" ? Icons.BudgetAccount : account.icon;
        output.link = `/budget/transactions?account=${account.id}${options}`;
        output.name = account.name;
        break;
      }
      case word.startsWith("#budgetcategory"): {
        const category = BudgetCategoryState.findShortID(id);
        output.icon = Icons.BudgetCategory;
        output.link = "/budget/categories";
        output.name = category.name;
        break;
      }
      case word.startsWith("#budgetpayee"): {
        const payee = BudgetPayeeState.findShortID(id);
        output.icon = payee.icon === "" ? Icons.BudgetPayee : payee.icon;
        output.link = "/budget/payees";
        output.name = payee.name;
        break;
      }
      case word.startsWith("#cookrecipe"): {
        const recipe = CookRecipeState.findShortID(id);
        if (options !== "") {
          options = `?${options}`; // eslint-disable-line no-param-reassign
        }
        output.icon = Icons.CookRecipe;
        output.link = `/cook/recipes/${recipe.id}${options}`;
        output.name = recipe.name;
        break;
      }
      case word.startsWith("#inventorycollection"): {
        const collection = InventoryCollectionState.findShortID(id);
        output.icon =
          collection.icon === "" ? Icons.InventoryCollection : collection.icon;
        output.link = `/inventory/${collection.id}`;
        output.name = collection.name;
        break;
      }
      case word.startsWith("#inventoryitem"): {
        const item = InventoryItemState.findShortID(id);
        const link = `/inventory/all?id=${item.id}`;
        output.icon = Icons.Inventory;

        if (options.includes("icon")) {
          output.name = `[${item.quantity} ${item.name}](${link})`;
        } else {
          output.link = link;
          output.name = item.name;
        }

        break;
      }
      case word.startsWith("#notespage"): {
        output.link = "/notes/";
        const page = NotesPageState.findShortID(id);

        if (page.authHouseholdID === null) {
          output.link += "personal";
        } else {
          output.link += "household";
        }

        output.icon = page.icon === "" ? Icons.Notes : page.icon;
        output.link += `/${page.id}`;
        output.name = page.name;
        break;
      }
      case word.startsWith("#planproject"): {
        const project = PlanProjectState.findShortID(id);
        output.icon = project.icon === "" ? Icons.PlanProject : project.icon;
        output.link = `/plan/tasks?project=${project.id}`;
        output.name = project.name;
        break;
      }
      case word.startsWith("#plantask"): {
        const task = PlanTaskState.findShortID(id);
        output.link = "/plan/tasks?";
        if (task.planProjectID !== null) {
          output.link += `project=${task.planProjectID}`;
        } else if (task.authHouseholdID !== null) {
          output.link += "filter=household";
        } else if (task.authAccountID !== null) {
          // eslint-disable-line no-negated-condition
          output.link += "filter=personal";
        }
        output.icon = Icons.PlanTask;
        output.name = task.name;
        break;
      }
      case word.startsWith("#rewardcard"): {
        const card = RewardCardState.findShortID(id);

        let path = "received";

        if (card.senders.includes(AuthAccountState.data().id!)) {
          // eslint-disable-line @typescript-eslint/no-non-null-assertion
          path = "sent";
        }

        output.icon = Icons.Reward;
        output.link = `/reward/${path}#${card.id}`;
        output.name = card.name;
        break;
      }
      case word.startsWith("#secretsvalue"): {
        const value = SecretsValueState.findShortID(id);

        if (SecretsValueState.values()[`${value.id}`] === undefined) {
          break;
        }

        output.icon = options === "" ? Icons.SecretsValue : undefined;
        output.link =
          options === "" ? `/secrets/${value.secretsVaultID}` : undefined;
        output.name =
          options === ""
            ? SecretsValueState.values()[`${value.id}`].name
            : SecretsValueState.values()[`${value.id}`].data[0][options] ===
                undefined
              ? ""
              : (SecretsValueState.values()[`${value.id}`].data[0][
                  options
                ] as string);
        break;
      }
      case word.startsWith("#secretsvault"): {
        const vault = SecretsVaultState.findShortID(id);
        output.icon = vault.icon === "" ? Icons.SecretsVault : vault.icon;
        output.link = `/secrets/${vault.id}`;
        output.name = vault.name;
        break;
      }
      case word.startsWith("#shoplist"): {
        const list = ShopListState.findShortID(id);
        output.icon = list.icon === "" ? Icons.ShopList : list.icon;
        output.link = `/shop/lists/${list.id}`;
        output.name = list.name;
        break;
      }
      case word.startsWith("#shopstore"): {
        const payee = BudgetPayeeState.findShortID(id);
        output.icon = payee.icon === "" ? Icons.BudgetPayee : payee.icon;
        output.link = `/shop/items?store=${payee.id}`;
        output.name = payee.name;
        break;
      }
    }

    return output;
  },
};
