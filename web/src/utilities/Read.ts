import type { Err } from "@lib/services/Log";
import { IsErr, NewErr } from "@lib/services/Log";

import { API } from "../services/API";

export interface ReadArguments {
  /** ID of the object to read. */
  id: NullUUID;

  /** API path to the object. */
  path: string;

  /** Type of the object to check with API response. */
  typeObject: string;
}

export interface ReadResponse<T extends Data> {
  /** Data returned from API. */
  data?: T;

  /** Hash returned from API. */
  hash: string;

  /** If the API is offline now. */
  offline: boolean;
}

export async function read<T extends Data>(
  args: ReadArguments,
): Promise<ReadResponse<T> | Err> {
  return API.read(`${args.path}/${args.id}`, {}).then(async (response) => {
    if (IsErr(response)) {
      return response;
    }

    if (response.status === 0) {
      return {
        hash: "",
        offline: true,
      };
    }

    if (
      response.dataType === args.typeObject &&
      Array.isArray(response.dataValue) &&
      response.dataValue.length === 1
    ) {
      if (
        Array.isArray(response.dataValue) &&
        response.dataValue.length === 1
      ) {
        return {
          data: response.dataValue[0],
          hash: "",
          offline: false,
        };
      }

      return {
        hash: "",
        offline: false,
      };
    }

    NewErr(
      `Read: unknown API response for ${args.typeObject}: ${response.dataType} ${JSON.stringify(response.dataValue)}`,
    );

    return {
      hash: "",
      offline: false,
    };
  });
}
