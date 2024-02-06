import { ButtonArray } from "@lib/components/ButtonArray";
import { Table } from "@lib/components/Table";
import { TableDataType } from "@lib/components/TableData";
import type { TableHeaderSortAttrs } from "@lib/components/TableHeader";
import { AppState } from "@lib/states/App";
import type { FilterType } from "@lib/types/Filter";
import { Filter } from "@lib/types/Filter";
import { Icons } from "@lib/types/Icons";
import m from "mithril";
import Stream from "mithril/stream";
import * as OTPAuth from "otpauth";

import { FormOverlaySecretsValue } from "../components/FormOverlaySecretsValue";
import { FormOverlaySecretsVault } from "../components/FormOverlaySecretsVault";
import { TableColumnHousehold } from "../components/TableColumnHousehold";
import { AppToolbarActions } from "../layout/AppToolbarActions";
import { AuthAccountState } from "../states/AuthAccount";
import { GlobalState } from "../states/Global";
import type { SecretsValueDecrypted } from "../states/SecretsValue";
import { SecretsValueState } from "../states/SecretsValue";
import { SecretsVaultState } from "../states/SecretsVault";
import { PermissionComponentsEnum } from "../types/Permission";
import { GetHelp } from "../utilities/GetHelp";
import {
  ObjectSecrets,
  WebGlobalActionShowTag,
  WebGlobalAll,
  WebGlobalName,
  WebSecretsEditVault,
  WebSecretsSearch,
} from "../yaml8n";

export function SecretsValues(): m.Component {
  const state = {
    columns: Stream<FilterType>({
      name: "",
      Username: "", // eslint-disable-line sort-keys
      Password: "", // eslint-disable-line sort-keys
      URL: "",
    }),
    search: Stream(""),
    sort: Stream<TableHeaderSortAttrs>({
      invert: false,
      property: "name",
    }),
    tag: Stream(""),
    vault: SecretsVaultState.new(),
    vaultID: Stream("all"),
  };

  let data: Stream<SecretsValueDecrypted[]>;
  let s: Stream<void>;

  function renderName(): m.Component<SecretsValueDecrypted> {
    return {
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
            m("div", [
              vnode.attrs.name,
              m(ButtonArray, {
                icon: Icons.Tag,
                name: "tags",
                onclick: (e): void => {
                  state.tag() === e ? state.tag("") : state.tag(e);
                },
                selected: () => {
                  return [state.tag()];
                },
                small: true,
                value: vnode.attrs.tags,
              }),
            ]),
          ],
        );
      },
    };
  }

  return {
    oninit: async (): Promise<void> => {
      data = Stream.lift(
        (values, columns, search, sort, tag, vaultID) => {
          m.redraw();

          return Filter.array(
            Object.keys(values)
              .map((v) => {
                return {
                  ...SecretsValueState.findID(v),
                  ...{
                    authHouseholdID: values[v].authHouseholdID,
                    data: values[v].data,
                    name: values[v].name,
                    tags: values[v].tags,
                  },
                };
              })
              .filter((value) => {
                let s = `name=${value.name}`;

                if (value.data.length > 0) {
                  Object.keys(value.data[0]).map((key) => {
                    s += ` ${key}=${value.data[0][key]}`;
                  });
                }

                return (
                  (vaultID === "all" || value.secretsVaultID === vaultID) &&
                  (tag === "" || value.tags.includes(tag)) &&
                  (search === "" ||
                    s.toLowerCase().includes(search.toLowerCase()))
                );
              }),
            columns,
            sort,
          );
        },
        SecretsValueState.values,
        state.columns,
        state.search,
        state.sort,
        state.tag,
        state.vaultID,
      );

      s = Stream.lift(
        (_vaults, id) => {
          if (id !== "all") {
            state.vault = SecretsVaultState.findID(id);
          }

          AppState.setLayoutApp({
            ...GetHelp("secrets"),
            breadcrumbs: [
              {
                link: "/secrets",
                name: AuthAccountState.translate(ObjectSecrets),
              },
              {
                name:
                  state.vault.name === ""
                    ? AuthAccountState.translate(WebGlobalAll)
                    : state.vault.name,
              },
            ],
            toolbarActionButtons: [
              {
                ...AppToolbarActions().newSecretsValue,
                ...{
                  onclick: (): void => {
                    AppState.setLayoutAppForm(FormOverlaySecretsValue, {
                      ...SecretsValueState.newDecrypted(),
                      ...{
                        secretsVaultID: state.vaultID(),
                      },
                    });
                  },
                },
              },
            ],
          });

          m.redraw();
        },
        SecretsVaultState.data,
        state.vaultID,
      );

      if (m.route.param().id !== undefined) {
        state.vaultID(m.route.param().id);
      }
    },
    onremove: (): void => {
      data.end(true);
      s.end(true);
    },
    view: (): m.Children => {
      return m(Table, {
        actions: [
          {
            icon: Icons.Edit,
            name: AuthAccountState.translate(WebSecretsEditVault),
            onclick: async (): Promise<void> => {
              AppState.setLayoutAppForm(FormOverlaySecretsVault, state.vault);
            },
            permitted:
              GlobalState.permitted(PermissionComponentsEnum.Secrets, true) &&
              state.vaultID() !== "all",
            requireOnline: true,
          },
        ],
        data: data(),
        editOnclick: (s: SecretsValueDecrypted) => {
          AppState.setLayoutAppForm(FormOverlaySecretsValue, s);
        },
        filters: [
          {
            icon: Icons.Tag,
            name: AuthAccountState.translate(WebGlobalActionShowTag),
            onclick: (e): void => {
              state.tag() === e ? state.tag("") : state.tag(e);
            },
            selected: (): string[] => {
              return [state.tag()];
            },
            value: SecretsValueState.tagNames(),
          },
        ],
        loaded: SecretsValueState.isLoaded(),
        search: {
          onsearch: (e: string): void => {
            state.search(e);
          },
          placeholder: AuthAccountState.translate(WebSecretsSearch),
        },
        sort: state.sort,
        tableColumns: [
          {
            name: AuthAccountState.translate(WebGlobalName),
            property: "name",
            render: renderName,
          },
          ...SecretsValueState.properties().map((property) => {
            return {
              formatter: (s: SecretsValueDecrypted): string => {
                if (property === "TOTP" && s.data[0].TOTP !== undefined) {
                  return new OTPAuth.TOTP({
                    secret: s.data[0].TOTP,
                  }).generate();
                }

                if (
                  s.data[0] !== undefined &&
                  s.data[0][property] !== undefined
                ) {
                  return s.data[0][property]!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
                }

                return "";
              },
              name: property,
              noFilter: true,
              property: property,
              type: TableDataType.Secret,
            };
          }),
          TableColumnHousehold(),
        ],
        tableColumnsNameEnabled: state.columns,
      });
    },
  };
}
