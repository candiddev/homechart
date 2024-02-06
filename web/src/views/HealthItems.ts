import { ButtonArray } from "@lib/components/ButtonArray";
import { Table } from "@lib/components/Table";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayHealthItem } from "../components/FormOverlayHealthItem";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { GlobalState } from "../states/Global";
import type { HealthItem } from "../states/HealthItem";
import { HealthItemState } from "../states/HealthItem";
import { HealthLogState } from "../states/HealthLog";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectHealth,
  ObjectInput,
  ObjectInputs,
  ObjectOutput,
  ObjectOutputs,
  WebGlobalActionAddDefaults,
  WebGlobalActionAddDefaultsSuccess,
  WebGlobalHouseholdMember,
  WebGlobalName,
  WebGlobalSearch,
  WebGlobalType,
  WebHealthItemsTotalCorrelations,
} from "../yaml8n";

export function HealthItems(): m.Component {
  const state = {
    columns: Stream<FilterType>({
      name: "",
      totalCorrelations: "",
    }),
    id: Stream(AuthAccountState.data().id),
    output: Stream(false),
    search: Stream(""),
    sort: Stream({
      // eslint-disable-line @typescript-eslint/consistent-type-assertions
      invert: false,
      property: "name",
    } as TableHeaderSortAttrs),
  };

  let data: Stream<HealthItem[]>;

  function render(): m.Component<HealthItem> {
    let correlations: {
      color: string;
      id: NullUUID;
      name: string;
    }[] = [];

    return {
      oninit: (vnode): void => {
        correlations = Object.keys(vnode.attrs.correlations)
          .sort((a, b) => {
            return (
              (vnode.attrs.correlations[b] as number) -
              (vnode.attrs.correlations[a] as number)
            );
          })
          .map((i) => {
            const item = HealthItemState.findID(i);

            return {
              color: item.color,
              id: i,
              name: `${item.name} (${vnode.attrs.correlations[i]})`,
            };
          });
      },
      view: (vnode): m.Children => {
        return m(
          "div",
          {
            style: {
              "align-items": "flex-start",
              display: "flex",
              "flex-direction": "column",
            },
          },
          [
            vnode.attrs.name,
            m(ButtonArray, {
              name: "tags",
              onclick: () => {
                m.route.set(
                  `/health/items?type=${
                    state.output() ? "inputs" : "outputs"
                  }&id=${AuthHouseholdState.findMember(state.id()).id}`,
                  {},
                  {
                    state: {
                      key: Date.now(),
                    },
                  },
                );
              },
              selected: () => {
                return correlations.map((correlation) => {
                  return correlation.id as string;
                });
              },
              value: correlations,
            }),
          ],
        );
      },
    };
  }

  return {
    oninit: async (): Promise<void> => {
      Telemetry.spanStart("HealthItems");

      if (m.route.param().id !== undefined) {
        state.id(m.route.param().id);
      }

      if (m.route.param().type === "outputs") {
        state.output(true);
      }

      data = Stream.lift(
        (_items, _logs, columns, id, output, search, sort) => {
          let items = HealthItemState.findAuthAccountID(id, output);

          if (search !== "") {
            items = items.filter((item) => {
              return item.name.toLowerCase().includes(search.toLowerCase());
            });
          }

          m.redraw();

          return Filter.array(items, columns, sort);
        },
        HealthItemState.data,
        HealthLogState.data,
        state.columns,
        state.id,
        state.output,
        state.search,
        state.sort,
      );

      AppState.setLayoutApp({
        ...GetHelp("health"),
        breadcrumbs: [
          {
            link: "/health/items",
            name: AuthAccountState.translate(ObjectHealth),
          },
          {
            name: state.output()
              ? AuthAccountState.translate(ObjectOutputs)
              : AuthAccountState.translate(ObjectInputs),
          },
        ],
        toolbarActionButtons: [
          AppToolbarActions().newHealthItemInput,
          AppToolbarActions().newHealthItemOutput,
          AppToolbarActions().newHealthLogs,
        ],
      });

      Telemetry.spanEnd("HealthItems");
    },
    onremove: (): void => {
      data.end(true);
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [
          {
            icon: Icons.Refresh,
            name: AuthAccountState.translate(WebGlobalActionAddDefaults),
            onclick: async (): Promise<void> => {
              await HealthItemState.init(state.id());

              AppState.setLayoutAppAlert({
                message: AuthAccountState.translate(
                  WebGlobalActionAddDefaultsSuccess,
                ),
              });
            },
            permitted: GlobalState.permitted(
              PermissionComponentsEnum.Health,
              true,
            ),
            requireOnline: true,
          },
        ],
        data: data(),
        editOnclick: (h: HealthItem) => {
          AppState.setLayoutAppForm(FormOverlayHealthItem, h);
        },
        filters: [
          {
            name: AuthAccountState.translate(WebGlobalHouseholdMember),
            onclick: (e): void => {
              state.id(AuthHouseholdState.findMember(e).id);
            },
            selected: (): string[] => {
              return [AuthHouseholdState.findMember(state.id()).name];
            },
            value:
              GlobalState.permitted(
                PermissionComponentsEnum.Auth,
                true,
                AuthAccountState.data().primaryAuthHouseholdID,
              ) && AuthHouseholdState.membersChildren().length > 0
                ? AuthHouseholdState.findMemberNames(
                    AuthAccountState.data().primaryAuthHouseholdID,
                    true,
                  )
                : [],
          },
          {
            name: AuthAccountState.translate(WebGlobalType),
            onclick: (e): void => {
              state.output(e === "output");
            },
            selected: (): string[] => {
              return [state.output() ? "output" : "input"];
            },
            value: [
              {
                id: "input",
                name: AuthAccountState.translate(ObjectInput),
              },
              {
                id: "output",
                name: AuthAccountState.translate(ObjectOutput),
              },
            ],
          },
        ],
        loaded: HealthItemState.isLoaded(),
        search: {
          onsearch: (e: string): void => {
            state.search(e);
          },
          placeholder: AuthAccountState.translate(WebGlobalSearch),
        },
        sort: state.sort,
        tableColumns: [
          {
            name: AuthAccountState.translate(WebGlobalName),
            property: "name",
            render: render,
          },
          {
            name: AuthAccountState.translate(WebHealthItemsTotalCorrelations),
            property: "totalCorrelations",
          },
        ],
        tableColumnsNameEnabled: state.columns,
      });
    },
  };
}
