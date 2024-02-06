import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { Err } from "@lib/services/Log";
import { IsErr } from "@lib/services/Log";
import { Telemetry } from "@lib/services/Telemetry";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import m from "mithril";
import Stream from "mithril/stream";

import { FormJoinHousehold } from "../components/FormJoinHousehold";
import { AuthAccountState } from "../states/AuthAccount";
import type { AuthHousehold } from "../states/AuthHousehold";
import { AuthHouseholdState } from "../states/AuthHousehold";
import { AuthSessionState } from "../states/AuthSession";
import { GlobalState } from "../states/Global";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectHouseholds,
  WebAdminHouseholdsMemberCount,
  WebGlobalName,
  WebGlobalPrimary,
  WebGlobalSettings,
} from "../yaml8n";

export function SettingsHouseholds(): m.Component {
  const columns = Stream<FilterType>({
    name: "",
    countMembers: "", // eslint-disable-line sort-keys
    primary: "",
  });

  return {
    oninit: (): void => {
      Telemetry.spanStart("SettingsHouseholds");

      AppState.setLayoutApp({
        ...GetHelp("settings#households"),
        breadcrumbs: [
          {
            link: "/settings/account",
            name: AuthAccountState.translate(WebGlobalSettings),
          },
          {
            name: AuthAccountState.translate(ObjectHouseholds),
          },
        ],
        toolbarActionButtons: [
          {
            icon: Icons.Household,
            name: "Household",
            onclick: async (): Promise<void | Err> => {
              return AuthHouseholdState.create({
                ...AuthHouseholdState.new(),
                ...{
                  name: `${AuthAccountState.data().name}'s Household`,
                },
              }).then(async (household) => {
                if (IsErr(household)) {
                  return household;
                }

                await AuthSessionState.validate();
                m.route.set(`/settings/households/${household.id}`);

                return;
              });
            },
            permitted: !AuthAccountState.data().child,
            requireOnline: true,
          },
        ],
      });

      Telemetry.spanEnd("SettingsHouseholds");
    },
    view: (): m.Children => {
      return [
        m(
          FormJoinHousehold,
          m(Table, {
            actions: [],
            data: AuthHouseholdState.data(),
            editOnclick: (household: AuthHousehold) => {
              m.route.set(`/settings/households/${household.id}`);
            },
            filters: [],
            loaded: true,
            noFilters: true,
            tableColumns: [
              {
                name: AuthAccountState.translate(WebGlobalName),
                property: "name",
              },
              {
                name: AuthAccountState.translate(WebAdminHouseholdsMemberCount),
                property: "countMembers",
              },
              {
                checkboxOnclick: async (
                  data: AuthHousehold,
                ): Promise<void | Err> => {
                  AuthAccountState.data().primaryAuthHouseholdID = data.id;

                  return AuthAccountState.update(AuthAccountState.data());
                },
                formatter: (a: AuthHousehold): boolean => {
                  return (
                    AuthAccountState.data().primaryAuthHouseholdID === a.id
                  );
                },
                name: AuthAccountState.translate(WebGlobalPrimary),
                noFilter: true,
                permitted: (): boolean => {
                  return GlobalState.permitted(
                    PermissionComponentsEnum.Auth,
                    true,
                  );
                },
                property: "primary",
                type: TableDataType.Checkbox,
              },
            ],
            tableColumnsNameEnabled: columns,
          }),
        ),
      ];
    },
  };
}
