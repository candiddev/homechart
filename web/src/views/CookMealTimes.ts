import { Table } from "@lib/components/Table";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import { CivilTime } from "@lib/types/CivilTime";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import m from "mithril";
import Stream from "mithril/stream";

import { FormOverlayCookMealTime } from "../components/FormOverlayCookMealTime";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import type { CookMealTime } from "../states/CookMealTime";
import { CookMealTimeState } from "../states/CookMealTime";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectCook,
  ObjectMealTimes,
  WebFormOverlayCookMealTimeTime,
  WebGlobalName,
} from "../yaml8n";

export function CookMealTimes(): m.Component {
  const state = {
    columns: Stream<FilterType>({
      name: "",
      time: "",
    }),
    sort: Stream({
      invert: false,
      property: "time",
    }),
  };

  let d: Stream<CookMealTime[]>;

  return {
    oninit: async (): Promise<void> => {
      Telemetry.spanStart("CookMealTimes");

      d = Stream.lift(
        (data, columns, sort) => {
          m.redraw();

          return Filter.array(data, columns, sort);
        },
        CookMealTimeState.data,
        state.columns,
        state.sort,
      );

      AppState.setLayoutApp({
        ...GetHelp("cook"),
        breadcrumbs: [
          {
            link: "/cook/recipes",
            name: AuthAccountState.translate(ObjectCook),
          },
          {
            name: AuthAccountState.translate(ObjectMealTimes),
          },
        ],
        toolbarActionButtons: [AppToolbarActions().newCookMealTime],
      });

      Telemetry.spanEnd("CookMealTimes");
    },
    onremove: (): void => {
      d.end(true);
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [],
        data: d(),
        editOnclick: (c: CookMealTime): void => {
          AppState.setLayoutAppForm(FormOverlayCookMealTime, c);
        },
        filters: [],
        loaded: CookMealTimeState.isLoaded(),
        sort: state.sort,
        tableColumns: [
          {
            name: AuthAccountState.translate(WebGlobalName),
            property: "name",
          },
          {
            formatter: (e: CookMealTime): string => {
              if (e.time !== null) {
                return CivilTime.fromString(e.time).toString(
                  AuthAccountState.data().preferences.formatTime24,
                );
              }
              return "";
            },
            name: AuthAccountState.translate(WebFormOverlayCookMealTimeTime),
            property: "time",
            sortFormatter: (e: CookMealTime): string => {
              if (e.time === null) {
                return "";
              }

              return e.time;
            },
          },
          TableColumnHousehold(),
        ],
        tableColumnsNameEnabled: state.columns,
      });
    },
  };
}
