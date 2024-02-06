import type { DropdownMenuAttrsItem } from "@lib/components/DropdownMenu";
import { Icons } from "@lib/types/Icons";

import { AuthAccountState } from "../states/AuthAccount";
import type { Bookmark } from "../states/Bookmark";
import { BookmarkState } from "../states/Bookmark";
import { BudgetAccountState } from "../states/BudgetAccount";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { CookRecipeState } from "../states/CookRecipe";
import type { InventoryCollection } from "../states/InventoryCollection";
import { InventoryCollectionState } from "../states/InventoryCollection";
import type { InventoryItem } from "../states/InventoryItem";
import { InventoryItemState } from "../states/InventoryItem";
import type { NotesPage } from "../states/NotesPage";
import { NotesPageState } from "../states/NotesPage";
import { PlanProjectState } from "../states/PlanProject";
import type { PlanTask } from "../states/PlanTask";
import { PlanTaskState } from "../states/PlanTask";
import type { RewardCard } from "../states/RewardCard";
import { RewardCardState } from "../states/RewardCard";
import type { SecretsValueValues } from "../states/SecretsValue";
import { SecretsValueState } from "../states/SecretsValue";
import { SecretsVaultState } from "../states/SecretsVault";
import { ShopItemState } from "../states/ShopItem";
import type { ShopList } from "../states/ShopList";
import { ShopListState } from "../states/ShopList";

const searchables = [
  {
    data: BookmarkState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.Bookmark,
    linkFormatter: (data: Bookmark): string => {
      return data.link;
    },
  },
  {
    data: BudgetAccountState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.BudgetAccount,
    linkFormatter: (data: Data): string => {
      return `/budget/account/${data.id}`;
    },
  },
  {
    data: BudgetPayeeState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.BudgetPayee,
    link: "/budget/payees",
  },
  {
    data: CookRecipeState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.CookRecipe,
    linkFormatter: (data: Data): string => {
      return `/cook/recipes/${data.id}`;
    },
  },
  {
    data: InventoryCollectionState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.Filter,
    linkFormatter: (data: InventoryCollection): string => {
      return `/inventory/${data.id}`;
    },
  },
  {
    data: InventoryItemState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.Inventory,
    linkFormatter: (data: InventoryItem): string => {
      return `/inventory/all?id=${data.id}`;
    },
  },
  {
    data: NotesPageState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.Notes,
    linkFormatter: (data: NotesPage): string => {
      if (data.authAccountID !== null) {
        return `/notes/personal/${data.id}`;
      }

      return `/notes/household/${data.id}`;
    },
  },
  {
    data: PlanProjectState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.PlanProject,
    linkFormatter: (data: Data): string => {
      return `/plan/tasks?project=${data.id}`;
    },
  },
  {
    data: PlanTaskState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.PlanTask,
    linkFormatter: (data: PlanTask): string => {
      return `/plan/tasks?project=${data.planProjectID}`;
    },
  },
  {
    data: RewardCardState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.Reward,
    linkFormatter: (data: RewardCard): string => {
      if (data.senders.includes(AuthAccountState.data().id!)) {
        // eslint-disable-line @typescript-eslint/no-non-null-assertion
        return `/reward/sent#${data.id}`;
      }

      return `/reward/received#${data.id}`;
    },
  },
  {
    data: SecretsValueState.values.map((values) => {
      return Object.values(values);
    }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.SecretsValue,
    linkFormatter: (data: SecretsValueValues): string => {
      return `/secrets/${data.secretsVaultID.secretsVaultID}`;
    },
  },
  {
    data: SecretsVaultState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.SecretsVault,
    link: "/secrets",
  },
  {
    data: ShopItemState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.ShopItem,
    link: "/shop/items",
  },
  {
    data: ShopListState.data as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.ShopList,
    linkFormatter: (data: ShopList): string => {
      return `/shop/lists/${data.id}`;
    },
  },
  {
    data: BudgetPayeeState.data.map((payees) => {
      return payees.filter((payee) => {
        return payee.shopStore;
      }) as Data[];
    }) as any, // eslint-disable-line @typescript-eslint/no-explicit-any
    icon: Icons.BudgetPayee,
    link: "/shop/stores",
  },
];

export function AppSearcher(search: string): DropdownMenuAttrsItem[] {
  const items = [];

  for (const searchable of searchables) {
    for (let i = 0; i < searchable.data().length; i++) {
      if (
        (searchable.data()[i].name as string)
          .toLowerCase()
          .includes(search.toLowerCase())
      ) {
        items.push({
          href:
            searchable.linkFormatter === undefined
              ? searchable.link
              : searchable.linkFormatter(searchable.data()[i]), // eslint-disable-line @typescript-eslint/consistent-type-assertions,@typescript-eslint/no-explicit-any
          icon: searchable.icon,
          name: searchable.data()[i].name,
          permitted: true,
          requireOnline: false,
        });
      }
    }
  }

  return items;
}
