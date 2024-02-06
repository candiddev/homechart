import { FormCheckbox } from "@lib/components/FormCheckbox";
import { FormItem } from "@lib/components/FormItem";
import { FormItemInputCurrency } from "@lib/components/FormItemInputCurrency";
import type { FormOverlayComponentAttrs } from "@lib/components/FormOverlay";
import { FormOverlay } from "@lib/components/FormOverlay";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { AppState } from "@lib/states/App";
import { MonthEnum } from "@lib/types/Month";
import { Animate, Animation } from "@lib/utilities/Animate";
import { FormRecurrenceSpecificDate } from "@lib/yaml8n";
import m from "mithril";

import { FormItemSelectAuthHousehold } from "../components/FormItemSelectAuthHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetMonthState } from "../states/BudgetMonth";
import type { BudgetMonthCategory } from "../states/BudgetMonthCategory";
import { BudgetMonthCategoryState } from "../states/BudgetMonthCategory";
import { GlobalState } from "../states/Global";
import { PlanProjectState } from "../states/PlanProject";
import { Translations } from "../states/Translations";
import { PermissionComponentsEnum } from "../types/Permission";
import {
  ObjectBudgetCategoryGroupingIncome,
  ObjectCategory,
  WebFormOverlayBudgetCategoryBudgetedTooltip,
  WebFormOverlayBudgetCategoryBudgetZero,
  WebFormOverlayBudgetCategoryProjects,
  WebFormOverlayBudgetCategoryTargetAmount,
  WebFormOverlayBudgetCategoryTargetAmountTooltip,
  WebFormOverlayBudgetCategoryTargetDate,
  WebFormOverlayBudgetCategoryTargetDateTooltip,
  WebFormOverlayBudgetCategoryTargetMonth,
  WebFormOverlayBudgetCategoryTargetMonthTooltip,
  WebFormOverlayBudgetCategoryTargetType,
  WebFormOverlayBudgetCategoryTargetTypeTooltip,
  WebGlobalActionBudgetTargetAmount,
  WebGlobalBudgeted,
  WebGlobalGrouping,
  WebGlobalGroupingTooltip,
  WebGlobalName,
  WebGlobalNameTooltip,
  WebRecurrenceMonthly,
  WebRecurrenceYearly,
} from "../yaml8n";

export function FormOverlayBudgetCategory(): m.Component<
  FormOverlayComponentAttrs<BudgetMonthCategory>
> {
  let id: NullUUID = null;
  let groupingName = "";
  let initAmount = 0;
  let picker = "";

  function setup(data: BudgetMonthCategory): void {
    if (data.budgetCategoryID !== id) {
      id = `${data.budgetCategoryID}`;

      if (data.budgetCategory.targetMonth !== MonthEnum.None) {
        if (data.budgetCategory.targetYear !== 0) {
          picker = "date";
          return;
        }

        picker = "yearly";
        return;
      }

      if (data.budgetCategory.targetAmount !== 0) {
        picker = "monthly";
        return;
      }

      picker = "";
    }
  }

  return {
    onbeforeremove: Animate.onbeforeremove(Animation.FromRight),
    oninit: (vnode): void => {
      initAmount = vnode.attrs.data.amount;

      if (vnode.attrs.data.grouping === true) {
        groupingName = vnode.attrs.data.budgetCategory.name;
      }

      setup(vnode.attrs.data);
    },
    onupdate: (vnode): void => {
      setup(vnode.attrs.data);
    },
    view: (vnode): m.Children => {
      return m(
        FormOverlay,
        {
          buttons: [
            {
              name: AuthAccountState.translate(
                WebGlobalActionBudgetTargetAmount,
              ),
              onclick: async (): Promise<void> => {
                if (
                  vnode.attrs.data.grouping === true &&
                  BudgetMonthState.data().budgetMonthCategories !== null
                ) {
                  //eslint-disable-next-line @typescript-eslint/no-floating-promises
                  BudgetMonthState.data().budgetMonthCategories.map(
                    async (category) => {
                      if (
                        category.budgetCategory.grouping ===
                          vnode.attrs.data.budgetCategory.name &&
                        category.targetAmount !== 0
                      ) {
                        await BudgetMonthCategoryState.update({
                          ...category,
                          ...{
                            amount: category.targetAmount as number,
                          },
                        });
                      }
                    },
                  );

                  if (m.route.get().includes("/budget/categories")) {
                    await BudgetMonthState.read(
                      vnode.attrs.data.authHouseholdID,
                    );
                  }

                  AppState.setLayoutAppForm();

                  return;
                }

                return new Promise((resolve) => {
                  if (vnode.attrs.data.targetAmount !== 0) {
                    vnode.attrs.data.amount = vnode.attrs.data
                      .targetAmount as number;
                  }

                  return resolve();
                });
              },
              permitted: GlobalState.permitted(
                PermissionComponentsEnum.Budget,
                true,
              ),
              requireOnline: true,
            },
            {
              name: AuthAccountState.translate(
                WebFormOverlayBudgetCategoryBudgetZero,
              ),
              onclick: async (): Promise<void | Err> => {
                if (
                  vnode.attrs.data.grouping === true &&
                  BudgetMonthState.data().budgetMonthCategories !== null
                ) {
                  //eslint-disable-next-line @typescript-eslint/no-floating-promises
                  BudgetMonthState.data().budgetMonthCategories.map(
                    async (category) => {
                      if (
                        category.budgetCategory.grouping ===
                        vnode.attrs.data.budgetCategory.name
                      ) {
                        await BudgetMonthCategoryState.update({
                          ...category,
                          ...{
                            amount: -1 * (category.amount - category.balance),
                          },
                        });
                      }
                    },
                  );

                  if (m.route.get().includes("/budget/categories")) {
                    await BudgetMonthState.read(
                      vnode.attrs.data.authHouseholdID,
                    );
                  }

                  AppState.setLayoutAppForm();
                }

                return new Promise((resolve) => {
                  if (
                    vnode.attrs.data.amount +
                      vnode.attrs.data.balance -
                      initAmount !==
                    0
                  ) {
                    vnode.attrs.data.amount =
                      -1 * (vnode.attrs.data.balance - initAmount);
                  }

                  return resolve();
                });
              },
              permitted: GlobalState.permitted(
                PermissionComponentsEnum.Budget,
                true,
              ),
              requireOnline: true,
            },
          ],
          data: vnode.attrs.data as Data,
          name: AuthAccountState.translate(ObjectCategory),
          onDelete: async (): Promise<void | Err> => {
            if (vnode.attrs.data.grouping === true) {
              for (const category of BudgetCategoryState.data()) {
                if (
                  category.grouping === vnode.attrs.data.budgetCategory.name
                ) {
                  await BudgetCategoryState.delete(category.id);
                }
              }
              if (m.route.get().includes("/budget/categories")) {
                return BudgetMonthState.read(vnode.attrs.data.authHouseholdID);
              }
            }

            return BudgetCategoryState.delete(id).then(async () => {
              if (m.route.get().includes("/budget/categories")) {
                return BudgetMonthState.read(vnode.attrs.data.authHouseholdID);
              }
            });
          },
          onSubmit: async (): Promise<void | Err> => {
            if (vnode.attrs.data.grouping === true) {
              for (const category of BudgetCategoryState.data()) {
                if (category.grouping === groupingName) {
                  await BudgetCategoryState.update({
                    ...category,
                    ...{
                      grouping: vnode.attrs.data.budgetCategory.name,
                    },
                  });
                }
              }

              if (m.route.get().includes("/budget/categories")) {
                return BudgetMonthState.read(vnode.attrs.data.authHouseholdID);
              }
            }

            if (vnode.attrs.data.budgetCategory.grouping === "Hidden") {
              vnode.attrs.data.budgetCategory.grouping = "";
            }

            if (vnode.attrs.data.id === null) {
              if (vnode.attrs.data.budgetCategory.grouping === "Hidden") {
                vnode.attrs.data.budgetCategory.grouping = "";
              }

              return BudgetCategoryState.create(vnode.attrs.data.budgetCategory)
                .then(async (category) => {
                  if (IsErr(category)) {
                    return category;
                  }

                  vnode.attrs.data.authHouseholdID = category.authHouseholdID;
                  vnode.attrs.data.budgetCategoryID = category.id;
                  vnode.attrs.data.yearMonth =
                    BudgetMonthState.yearMonth.toNumber();

                  return BudgetMonthCategoryState.create(vnode.attrs.data);
                })
                .then(async () => {
                  if (m.route.get().includes("/budget/categories")) {
                    return BudgetMonthState.read(
                      vnode.attrs.data.authHouseholdID,
                    );
                  }
                });
            }

            vnode.attrs.data.budgetCategory.id =
              vnode.attrs.data.budgetCategoryID;
            return BudgetCategoryState.update(
              vnode.attrs.data.budgetCategory,
            ).then(async () => {
              if (
                vnode.attrs.data.yearMonth ===
                BudgetMonthState.yearMonth.toNumber()
              ) {
                return BudgetMonthCategoryState.update(vnode.attrs.data).then(
                  async () => {
                    if (m.route.get().includes("/budget/categories")) {
                      return BudgetMonthState.read(
                        vnode.attrs.data.authHouseholdID,
                      );
                    }
                  },
                );
              }
              vnode.attrs.data.yearMonth =
                BudgetMonthState.yearMonth.toNumber();
              return BudgetMonthCategoryState.create(vnode.attrs.data).then(
                async () => {
                  if (m.route.get().includes("/budget/categories")) {
                    return BudgetMonthState.read(
                      vnode.attrs.data.authHouseholdID,
                    );
                  }
                },
              );
            });
          },
          permitted: GlobalState.permitted(
            PermissionComponentsEnum.Budget,
            true,
            vnode.attrs.data.authHouseholdID,
          ),
        },
        [
          m(FormItemSelectAuthHousehold, {
            item: vnode.attrs.data,
            permissionComponent: PermissionComponentsEnum.Budget,
          }),
          m(FormItem, {
            input: {
              oninput: (e: string): void => {
                vnode.attrs.data.budgetCategory.name = e;
              },
              required: true,
              type: "text",
              value: vnode.attrs.data.budgetCategory.name,
            },
            name: AuthAccountState.translate(WebGlobalName),
            tooltip: AuthAccountState.translate(WebGlobalNameTooltip),
          }),
          vnode.attrs.data.grouping === true
            ? []
            : [
                m(FormItem, {
                  input: {
                    datalist: BudgetMonthState.groupings,
                    oninput: (e: string): void => {
                      vnode.attrs.data.budgetCategory.grouping = e;
                    },
                    required: true,
                    type: "text",
                    value: vnode.attrs.data.budgetCategory.grouping,
                  },
                  name: AuthAccountState.translate(WebGlobalGrouping),
                  tooltip: AuthAccountState.translate(WebGlobalGroupingTooltip),
                }),
                m(FormCheckbox, {
                  name: AuthAccountState.translate(
                    ObjectBudgetCategoryGroupingIncome,
                  ),
                  onclick: (): void => {
                    vnode.attrs.data.budgetCategory.income =
                      !vnode.attrs.data.budgetCategory.income;
                  },
                  value: vnode.attrs.data.budgetCategory.income,
                }),
                vnode.attrs.data.budgetCategory.income
                  ? []
                  : m(FormItemInputCurrency, {
                      format: AuthHouseholdState.findID(
                        vnode.attrs.data.authHouseholdID,
                      ).preferences.currency,
                      name: AuthAccountState.translate(WebGlobalBudgeted),
                      oninput: (e: number): void => {
                        vnode.attrs.data.amount = e;
                      },
                      tooltip: AuthAccountState.translate(
                        WebFormOverlayBudgetCategoryBudgetedTooltip,
                      ),
                      value: vnode.attrs.data.amount,
                    }),
                vnode.attrs.data.budgetCategory.income
                  ? []
                  : [
                      m(FormItem, {
                        buttonArray: {
                          onclick: (e: string): void => {
                            picker = e;

                            switch (e) {
                              case "monthly":
                                vnode.attrs.data.budgetCategory.targetMonth = 0;
                                vnode.attrs.data.budgetCategory.targetYear = 0;
                                break;
                              case "yearly":
                                vnode.attrs.data.budgetCategory.targetYear = 0;
                                break;
                              default:
                                vnode.attrs.data.budgetCategory.targetAmount = 0;
                                vnode.attrs.data.budgetCategory.targetMonth = 0;
                                vnode.attrs.data.budgetCategory.targetYear = 0;
                            }
                          },
                          selected: () => {
                            return [picker];
                          },
                          value: [
                            {
                              id: "monthly",
                              name: AuthAccountState.translate(
                                WebRecurrenceMonthly,
                              ),
                            },
                            {
                              id: "yearly",
                              name: AuthAccountState.translate(
                                WebRecurrenceYearly,
                              ),
                            },
                            {
                              id: "date",
                              name: AuthAccountState.translate(
                                FormRecurrenceSpecificDate,
                              ),
                            },
                          ],
                        },
                        name: AuthAccountState.translate(
                          WebFormOverlayBudgetCategoryTargetType,
                        ),
                        tooltip: AuthAccountState.translate(
                          WebFormOverlayBudgetCategoryTargetTypeTooltip,
                        ),
                      }),
                      picker === ""
                        ? []
                        : m(FormItemInputCurrency, {
                            format: AuthHouseholdState.findID(
                              vnode.attrs.data.authHouseholdID,
                            ).preferences.currency,
                            name: AuthAccountState.translate(
                              WebFormOverlayBudgetCategoryTargetAmount,
                            ),
                            oninput: (e: number): void => {
                              vnode.attrs.data.budgetCategory.targetAmount = e;
                            },
                            tooltip: AuthAccountState.translate(
                              WebFormOverlayBudgetCategoryTargetAmountTooltip,
                            ),
                            value: vnode.attrs.data.budgetCategory.targetAmount,
                          }),
                      picker === "yearly"
                        ? m(FormItem, {
                            name: AuthAccountState.translate(
                              WebFormOverlayBudgetCategoryTargetMonth,
                            ),
                            select: {
                              oninput: (e: string): void => {
                                if (e === "") {
                                  vnode.attrs.data.budgetCategory.targetMonth = 0;
                                } else {
                                  vnode.attrs.data.budgetCategory.targetMonth =
                                    Translations.monthValues.indexOf(e);
                                }
                              },
                              options: Translations.monthValues,
                              required: false,
                              value:
                                Translations.monthValues[
                                  vnode.attrs.data.budgetCategory.targetMonth
                                ],
                            },
                            tooltip: AuthAccountState.translate(
                              WebFormOverlayBudgetCategoryTargetMonthTooltip,
                            ),
                          })
                        : [],
                      picker === "date"
                        ? m(FormItem, {
                            input: {
                              oninput: (e: string): void => {
                                if (e === "") {
                                  vnode.attrs.data.budgetCategory.targetMonth = 0;
                                  vnode.attrs.data.budgetCategory.targetYear = 0;
                                } else {
                                  vnode.attrs.data.budgetCategory.targetMonth =
                                    parseInt(e.split("-")[1], 10);
                                  vnode.attrs.data.budgetCategory.targetYear =
                                    parseInt(e.split("-")[0], 10);
                                }
                              },
                              required: false,
                              type: "month",
                              value:
                                vnode.attrs.data.budgetCategory.targetYear !==
                                  0 &&
                                vnode.attrs.data.budgetCategory.targetMonth !==
                                  MonthEnum.None
                                  ? `${vnode.attrs.data.budgetCategory.targetYear}-${`${vnode.attrs.data.budgetCategory.targetMonth}`.padStart(2, "0")}`
                                  : "",
                            },
                            name: AuthAccountState.translate(
                              WebFormOverlayBudgetCategoryTargetDate,
                            ),
                            tooltip: AuthAccountState.translate(
                              WebFormOverlayBudgetCategoryTargetDateTooltip,
                            ),
                          })
                        : [],
                    ],
                PlanProjectState.findNamesBudgetCategoryID(
                  vnode.attrs.data.budgetCategoryID,
                ).length > 0
                  ? m(FormItem, {
                      name: AuthAccountState.translate(
                        WebFormOverlayBudgetCategoryProjects,
                      ),
                      textArea: {
                        disabled: true,
                        value: PlanProjectState.findNamesBudgetCategoryID(
                          vnode.attrs.data.budgetCategoryID,
                        )
                          .map((project) => {
                            return `#planproject/${project.shortID}`;
                          })
                          .join("\n"),
                      },
                      tooltip: "",
                    })
                  : [],
              ],
        ],
      );
    },
  };
}
