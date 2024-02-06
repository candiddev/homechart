import "./BudgetCharts.css";

import type {
  ChartCanvasAttrs,
  ChartCanvasData,
} from "@lib/components/ChartCanvas";
import { ChartCanvas, ChartTypesEnum } from "@lib/components/ChartCanvas";
import { Form } from "@lib/components/Form";
import { FormItem } from "@lib/components/FormItem";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import { IsErr } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilDate } from "@lib/types/CivilDate";
import { Currency } from "@lib/types/Currency";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import type { YearMonthDateRange } from "@lib/types/YearMonth";
import { YearMonth } from "@lib/types/YearMonth";
import { Animate, Animation } from "@lib/utilities/Animate";
import { Clone } from "@lib/utilities/Clone";
import m from "mithril";
import Stream from "mithril/stream";

import { TitleTabsAuthHousehold } from "../components/TitleTabsAuthHouseholds";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { BudgetAccountState } from "../states/BudgetAccount";
import { BudgetCategoryState } from "../states/BudgetCategory";
import { BudgetPayeeState } from "../states/BudgetPayee";
import type { ChartDataset } from "../states/ChartDataset";
import {
  ChartDatasetState,
  ChartDatasetTypesEnum,
} from "../states/ChartDataset";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectBudget,
  ObjectBudgetCategoryGroupingIncome,
  ObjectCategory,
  ObjectChange,
  ObjectPayee,
  WebBudgetChartsDateRangeFrom,
  WebBudgetChartsDateRangeFromTooltip,
  WebBudgetChartsDateRangeTo,
  WebBudgetChartsDateRangeToTooltip,
  WebBudgetChartsExpense,
  WebBudgetChartsFilterChart,
  WebBudgetChartsLastThreeMonths,
  WebBudgetChartsThisMonth,
  WebBudgetChartsTotal,
  WebBudgetChartsUseGroupings,
  WebBudgetChartsYearToDate,
  WebGlobalBudgetAmount,
  WebGlobalBudgetCharts,
  WebGlobalBudgetChartsIncomeExpense,
  WebGlobalBudgetChartsSpendingByCategory,
  WebGlobalBudgetChartsSpendingByPayee,
  WebGlobalBudgetMonth,
  WebGlobalCustom,
} from "../yaml8n";

function filterChartDataset(
  chartDataset: ChartDataset[],
  filters: string[],
): ChartDataset[] {
  const newData: ChartDataset[] = [];

  if (filters.length > 0) {
    for (const data of chartDataset) {
      for (const filter of filters) {
        if (filter.includes(data.name)) {
          newData.push(data);
        }
      }
    }
  } else {
    return chartDataset.slice(0, 12);
  }

  return newData.slice(0, 12);
}

export function BudgetCharts(): m.Component {
  const thisMonth = CivilDate.now().toYearMonth();

  const state = {
    authHousehold: Clone(
      AuthHouseholdState.findID(AuthAccountState.data().primaryAuthHouseholdID),
    ),
    chartDataset: Stream<ChartDataset[]>([]),
    chartDatasetFiltered: Stream<ChartDataset[]>([]),
    chartFilters: Stream<string[]>([]),
    chartType: Stream(""),
    columns: Stream<FilterType>({
      name: "",
      value: "", // eslint-disable-line sort-keys
    }),
    customDateRange: false,
    dateRangeFrom: thisMonth.toValue(),
    dateRangeTo: thisMonth.toValue(),
    loaded: false,
    rollup: Stream<boolean>(false),
    sort: Stream<TableHeaderSortAttrs>({
      invert: false,
      property: "amount",
    }),
  };

  const dateRangeThisMonth = {
    from: thisMonth,
    to: thisMonth,
  };
  const dateRangeLastThreeMonths = {
    from: thisMonth.addMonths(-2),
    to: thisMonth,
  };
  const dateRangeYearToDate = {
    from: thisMonth.addMonths(-1 * (thisMonth.month - 1)),
    to: thisMonth,
  };

  const dateRange: Stream<YearMonthDateRange> = Stream(dateRangeThisMonth);

  const config: ChartCanvasAttrs = {
    data: Stream<ChartCanvasData | undefined>(undefined),
    id: "chart",
    options: {
      maintainAspectRatio: false,
      plugins: {
        datalabels: {
          display: "auto",
          font: {
            weight: "bold",
          },
          formatter: (_value, context) => {
            return (
              context.chart.data.labels![context.dataIndex] as string
            ).split(" "); // eslint-disable-line @typescript-eslint/no-non-null-assertion
          },
          padding: 6,
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              let label = "";

              if (context.dataset.label !== undefined) {
                label = context.dataset.label;
              } else if (context.label !== undefined) {
                label = context.label;
              }

              if (label !== "") {
                label += ": ";
              }

              if (context.parsed.y === undefined) {
                label += Currency.toString(
                  context.parsed,
                  state.authHousehold.preferences.currency,
                );
              } else {
                label += Currency.toString(
                  context.parsed.y,
                  state.authHousehold.preferences.currency,
                );
              }

              return label;
            },
          },
        },
      },
      responsive: true,
    },
    type: ChartTypesEnum.Doughnut,
  };

  Stream.lift(
    async (dateRange, chartType, columns, rollup, sort) => {
      switch (chartType) {
        case "categories":
        case "payees":
          config.type = ChartTypesEnum.Doughnut;
          const payeeDataset = await ChartDatasetState.read(
            state.authHousehold.id,
            dateRange,
            chartType === "categories"
              ? rollup
                ? ChartDatasetTypesEnum.BudgetCategoryHeader
                : ChartDatasetTypesEnum.BudgetCategory
              : ChartDatasetTypesEnum.BudgetPayee,
          );

          if (!IsErr(payeeDataset)) {
            state.chartDataset(Filter.array(payeeDataset, columns, sort));
          }
          break;
        case "income-expense":
          config.type = ChartTypesEnum.Bar;
          config.options!.plugins!.datalabels = {
            // eslint-disable-line @typescript-eslint/no-non-null-assertion
            display: false,
          };
          config.options!.scales = {
            // eslint-disable-line @typescript-eslint/no-non-null-assertion
            y: {
              ticks: {
                callback: (value): string => {
                  if (typeof value === "number") {
                    return Currency.toString(
                      value,
                      state.authHousehold.preferences.currency,
                    );
                  }

                  return value;
                },
              },
            },
          };
          const data = await ChartDatasetState.read(
            state.authHousehold.id,
            dateRange,
            ChartDatasetTypesEnum.BudgetIncomeExpense,
          );
          if (IsErr(data)) {
            return;
          }

          state.chartDataset(Filter.array(data, columns, sort));

          if (state.chartDataset().length > 0) {
            const app = document.getElementById("app")!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

            config.data({
              datasets: [
                {
                  data: data.map((d) => {
                    return d.values[0].value;
                  }),
                  label: AuthAccountState.translate(WebBudgetChartsTotal),
                  type: "line",
                },
                {
                  backgroundColor: `${getComputedStyle(app).getPropertyValue(
                    "--color_primary",
                  )}`,
                  data: data.map((d) => {
                    return d.values[1].value;
                  }),
                  label: AuthAccountState.translate(
                    ObjectBudgetCategoryGroupingIncome,
                  ),
                  type: "bar",
                },
                {
                  backgroundColor: `${getComputedStyle(app).getPropertyValue(
                    "--color_accent",
                  )}`,
                  data: data.map((d) => {
                    return d.values[2].value;
                  }),
                  label: AuthAccountState.translate(WebBudgetChartsExpense),
                  type: "bar",
                },
              ],
              labels: data.map((d) => {
                return d.name;
              }),
            });
          } else {
            state.chartDatasetFiltered([]);
            config.data(undefined);
          }
      }

      state.loaded = true;

      m.redraw();
    },
    dateRange,
    state.chartType,
    state.columns,
    state.rollup,
    state.sort,
  );

  return {
    oninit: async (): Promise<void> => {
      AppState.setLayoutApp({
        ...GetHelp("budget"),
        breadcrumbs: [
          {
            link: "/budget/accounts",
            name: AuthAccountState.translate(ObjectBudget),
          },
          {
            name: AuthAccountState.translate(WebGlobalBudgetCharts),
          },
        ],
        toolbarActionButtons: [],
      });

      await AuthAccountState.read();
      state.authHousehold.id = AuthAccountState.data().primaryAuthHouseholdID;

      state.loaded = false;

      Telemetry.spanStart("BudgetCategories");

      if (m.route.param().household === undefined) {
        m.route.param().household = state.authHousehold.id;
      } else {
        state.authHousehold = AuthHouseholdState.findID(
          m.route.param().household,
        );
      }

      if (m.route.param().type !== undefined) {
        state.chartType(m.route.param().type);
      }

      if (state.chartType() === "income-expense") {
        state.columns().change = "";
      }

      if (m.route.param().from !== undefined) {
        const from = parseInt(m.route.param().from);
        if (!isNaN(from)) {
          dateRange({
            ...dateRange(),
            ...{
              from: YearMonth.fromNumber(from),
            },
          });
        }
      }

      if (m.route.param().to !== undefined) {
        const to = parseInt(m.route.param().to);
        if (!isNaN(to)) {
          dateRange({
            ...dateRange(),
            ...{
              to: YearMonth.fromNumber(to),
            },
          });
        }
      }

      if (state.chartType() !== "income-expense") {
        Stream.lift(
          (data, filters, columns, sort) => {
            if (data.length > 0) {
              const newData = filterChartDataset(data, filters);
              state.chartDatasetFiltered(Filter.array(newData, columns, sort));

              config.data({
                datasets: [
                  {
                    data: newData.map((d) => {
                      return d.values[0].value;
                    }),
                  },
                ],
                labels: newData.map((d) => {
                  return d.name;
                }),
              });
            } else {
              state.chartDatasetFiltered([]);
              config.data(undefined);
            }

            m.redraw();
          },
          state.chartDataset,
          state.chartFilters,
          state.columns,
          state.sort,
        );
      }

      Telemetry.spanEnd("BudgetCategories");
    },
    view: (): m.Children => {
      return m(
        Form,
        {
          title: {
            tabs: [
              {
                active: state.chartType() === "categories",
                href: `/budget/charts/categories?household=${state.authHousehold.id}`,
                name: AuthAccountState.translate(
                  WebGlobalBudgetChartsSpendingByCategory,
                ),
              },
              {
                active: state.chartType() === "payees",
                href: `/budget/charts/payees?household=${state.authHousehold.id}`,
                name: AuthAccountState.translate(
                  WebGlobalBudgetChartsSpendingByPayee,
                ),
              },
              {
                active: state.chartType() === "income-expense",
                href: `/budget/charts/income-expense?household=${state.authHousehold.id}`,
                name: AuthAccountState.translate(
                  WebGlobalBudgetChartsIncomeExpense,
                ),
              },
              ...TitleTabsAuthHousehold(),
            ],
          },
          wrap: true,
        },
        [
          m("div.BudgetCharts__chart", [
            m("div.BudgetCharts__date-ranges", [
              m(
                "span",
                {
                  class:
                    dateRange() === dateRangeThisMonth
                      ? "BudgetCharts__date-range--active"
                      : undefined,
                  id: "button-this-month",
                  onclick: () => {
                    if (dateRange() === dateRangeThisMonth) {
                      return;
                    }

                    dateRange(dateRangeThisMonth);
                  },
                },
                AuthAccountState.translate(WebBudgetChartsThisMonth),
              ),
              m(
                "span",
                {
                  class:
                    dateRange() === dateRangeLastThreeMonths
                      ? "BudgetCharts__date-range--active"
                      : undefined,
                  id: "button-last-three-months",
                  onclick: () => {
                    if (dateRange() === dateRangeLastThreeMonths) {
                      return;
                    }

                    dateRange(dateRangeLastThreeMonths);
                  },
                },
                AuthAccountState.translate(WebBudgetChartsLastThreeMonths),
              ),
              m(
                "span",
                {
                  class:
                    dateRange() === dateRangeYearToDate
                      ? "BudgetCharts__date-range--active"
                      : undefined,
                  id: "button-year-to-date",
                  onclick: () => {
                    if (dateRange() === dateRangeYearToDate) {
                      return;
                    }

                    dateRange(dateRangeYearToDate);
                  },
                },
                AuthAccountState.translate(WebBudgetChartsYearToDate),
              ),
              m(
                "span",
                {
                  class: state.customDateRange
                    ? "BudgetCharts__date-range--active"
                    : undefined,
                  id: "button-custom",
                  onclick: () => {
                    state.customDateRange = !state.customDateRange;
                  },
                },
                AuthAccountState.translate(WebGlobalCustom),
              ),
              state.chartType() === "categories"
                ? m(
                    "span",
                    {
                      class: state.rollup()
                        ? "BudgetCharts__date-range--active"
                        : undefined,
                      id: "button-use-groupings",
                      onclick: () => {
                        state.rollup(!state.rollup());
                        const el = document.getElementById(
                          `form-item-select-filter-${state.chartType()}`,
                        ) as HTMLSelectElement; // eslint-disable-line @typescript-eslint/consistent-type-assertions
                        el.selectedIndex = -1;
                        state.chartFilters([]);
                      },
                    },
                    AuthAccountState.translate(WebBudgetChartsUseGroupings),
                  )
                : [],
            ]),
            state.customDateRange
              ? [
                  m(FormItem, {
                    input: {
                      oninput: (e: string) => {
                        state.dateRangeFrom = e;
                        const yearMonth = CivilDate.now().toYearMonth();
                        yearMonth.fromInput(e);
                        dateRange({
                          from: yearMonth,
                          to: dateRange().to,
                        });
                      },
                      type: "month",
                      value: state.dateRangeFrom,
                    },
                    name: AuthAccountState.translate(
                      WebBudgetChartsDateRangeFrom,
                    ),
                    tooltip: AuthAccountState.translate(
                      WebBudgetChartsDateRangeFromTooltip,
                    ),
                  }),
                  m(FormItem, {
                    input: {
                      oninput: (e: string) => {
                        state.dateRangeTo = e;
                        const yearMonth = CivilDate.now().toYearMonth();
                        yearMonth.fromInput(e);
                        dateRange({
                          from: dateRange().from,
                          to: yearMonth,
                        });
                      },
                      type: "month",
                      value: state.dateRangeTo,
                    },
                    name: AuthAccountState.translate(
                      WebBudgetChartsDateRangeTo,
                    ),
                    tooltip: AuthAccountState.translate(
                      WebBudgetChartsDateRangeToTooltip,
                    ),
                  }),
                ]
              : [],
            state.chartType() === "income-expense"
              ? []
              : m(FormItem, {
                  buttonArray: {
                    onclick: (e: string): void => {
                      const filters = state.chartFilters();

                      const index = filters.indexOf(e);

                      if (index < 0) {
                        filters.push(e);
                      } else {
                        filters.splice(index, 1);
                      }

                      state.chartFilters(filters);
                    },
                    selected: state.chartFilters,
                    value:
                      state.chartType() === "categories"
                        ? state.rollup()
                          ? BudgetCategoryState.names()
                          : BudgetCategoryState.names()
                        : [
                            ...BudgetAccountState.data().reduce(
                              (accounts, account) => {
                                if (account.budget === false) {
                                  accounts.push(account.name);
                                }

                                return accounts;
                              },
                              [] as string[],
                            ),
                            ...BudgetPayeeState.names(),
                          ],
                  },
                  name: AuthAccountState.translate(WebBudgetChartsFilterChart),
                  startHidden: true,
                  tooltip: "",
                }),
            state.loaded
              ? config.data() === undefined ||
                config.data()!.labels!.length === 0 // eslint-disable-line @typescript-eslint/no-non-null-assertion
                ? m("span.BudgetCharts__none", "No transactions found")
                : m(ChartCanvas, config)
              : m(
                  `span.BudgetCharts__loading.${Animate.class(Animation.Pulse)}`,
                ),
          ]),
          m(Table, {
            actions: [],
            class: "BudgetCharts__table",
            data:
              state.chartType() === "income-expense"
                ? state.chartDataset()
                : state.chartDatasetFiltered(),
            filters: [],
            getKey: (d: ChartDataset) => {
              return d.name;
            },
            loaded: state.loaded,
            noFilters: true,
            noNewButton: true,
            sort: state.sort,
            staticColumns: true,
            tableColumns: [
              {
                linkFormatter: (data: ChartDataset): string => {
                  switch (state.chartType()) {
                    case "categories":
                      return `/budget/transactions?category=${BudgetCategoryState.findName(data.name).shortID}`;
                    case "income-expense":
                      return "";
                    case "payees":
                      return `/budget/transactions?payee=${BudgetPayeeState.findName(data.name).shortID}`;
                  }
                  return "";
                },
                name:
                  state.chartType() === "categories"
                    ? AuthAccountState.translate(ObjectCategory)
                    : state.chartType() === "income-expense"
                      ? AuthAccountState.translate(WebGlobalBudgetMonth)
                      : AuthAccountState.translate(ObjectPayee),
                property: "name",
                type: TableDataType.Link,
              },
              {
                currencyFormat: state.authHousehold.preferences.currency,
                formatter: (data: ChartDataset): number => {
                  return data.values[1].value - data.values[2].value;
                },
                name: AuthAccountState.translate(ObjectChange),
                property: "change",
                type: TableDataType.Currency,
              },
              {
                currencyFormat: state.authHousehold.preferences.currency,
                formatter: (data: ChartDataset): number => {
                  return data.values[0].value;
                },
                name: AuthAccountState.translate(WebGlobalBudgetAmount),
                property: "value",
                type: TableDataType.Currency,
              },
            ],
            tableColumnsNameEnabled: state.columns,
          }),
        ],
      );
    },
  };
}
