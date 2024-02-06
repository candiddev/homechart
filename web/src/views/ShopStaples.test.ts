import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Recurrence } from "@lib/types/Recurrence";

import seed from "../jest/seed";
import { BudgetPayeeState } from "../states/BudgetPayee";
import { ShopCategoryState } from "../states/ShopCategory";
import { ShopItemState } from "../states/ShopItem";
import { ShopStaples } from "./ShopStaples";

test("ShopStaples", async () => {
  BudgetPayeeState.data(seed.budgetPayees);
  ShopCategoryState.data(seed.shopCategories);

  const today = CivilDate.now();

  ShopItemState.data([
    ...seed.shopItems,
    ...[
      {
        ...ShopItemState.new(),
        ...{
          budgetPayeeID: seed.budgetPayees[1].id,
          id: "a",
          name: "a",
          nextDate: today.toJSON(),
          recurrence: Recurrence.new(),
          shopCategoryID: seed.shopCategories[0].id,
        },
      },
    ],
  ]);

  testing.mount(ShopStaples, {});

  testing.title("Shop - Staples");
  testing.text("#table-header-nextdate", "Next Datearrow_downward");
  testing.findAll("tbody tr", 2);
  testing.text("#table-data-a-name", "a");
  testing.text("#table-data-a-shopcategoryid", seed.shopCategories[0].name);
  testing.text("#table-data-a-budgetpayeeid", seed.budgetPayees[1].name);
  testing.text("#table-data-a-nextdate", AppState.formatCivilDate(today));
});
