import type { Err } from "@lib/services/Log";
import { Log, NewErr } from "@lib/services/Log";
import Stream from "mithril/stream";

import { IndexedDB } from "./IndexedDB";

interface Credentials {
	id: string,
	key: string,
}

export const APIResponse = (): APIResponse<unknown> => {
	return {
		dataHash: "",
		dataIDs: [],
		dataTotal: 0,
		dataType: "",
		dataValue: [],
		message: "",
		requestID: "",
		status: 0,
		success: false,
	};
};

let fetcher = fetch;

if (process.env.NODE_ENV === "test") {
	fetcher = async (path: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
		return new Promise((resolve, reject): void | Err => {
			const request: XHRRequest = {
				body: typeof init?.body === "string" ?
					JSON.parse(init.body) :
					undefined,
				hash: (init?.headers as any)["x-homechart-hash"], // eslint-disable-line
				method: init?.method === undefined ?
					"GET" :
					init?.method,
				path: path.toString(),
				updated: (init?.headers as any)["x-homechart-updated"], // eslint-disable-line
			};

			if (request.body === undefined) {
				delete request.body;
			}

			if (request.hash === undefined) {
				delete request.hash;
			}

			if (request.updated === undefined) {
				delete request.updated;
			}

			testing.mocks.requests.push({ ...request });

			if (testing.mocks.responses.length > 0) {
				const response = { // eslint-disable-line
					dataHash: testing.mocks.responses[0].dataHash === undefined ?
						"" :
						testing.mocks.responses[0].dataHash,
					dataIDs: testing.mocks.responses[0].dataIDs === undefined ?
						[] :
						testing.mocks.responses[0].dataIDs,
					dataTotal: testing.mocks.responses[0].dataTotal === undefined ?
						0 :
						testing.mocks.responses[0].dataTotal,
					dataType: testing.mocks.responses[0].dataType === undefined ?
						"" :
						testing.mocks.responses[0].dataType,
					dataValue: testing.mocks.responses[0].dataValue === undefined ?
						[] :
						[
							...testing.mocks.responses[0].dataValue,
						],
					message: testing.mocks.responses[0].message === undefined ?
						"Mocked" :
						testing.mocks.responses[0].message,
					requestID: "",
					status: testing.mocks.responses[0].status === undefined ?
						200 :
						testing.mocks.responses[0].status,
					success: testing.mocks.responses[0].success !== false,
				};

				testing.mocks.responses.shift();

				const resp = new Response(response.status === 204 ?
					null :
					JSON.stringify(response), {
					status: response.status,
				});

				resolve(resp); // eslint-disable-line
				return;
			}

			if (! path.toString()
				.includes("/this/should/fail")) {
				NewErr(`API.fetcher: Invalid request\n${JSON.stringify(request)}`, "Invalid request");
			}

			reject(new Response(null, {
				status: path.toString()
					.includes("fail0") ?
					0 :
					500,
			}));
		});
	};
}

export const ErrUnknownResponse = {
	error: "unknown response",
	message: "Client error, try again later",
};

export const IsAPIResponse = (value: unknown): value is APIResponse<unknown> => {
	return typeof value === "object" && value !== null && "dataValue" in value;
};

const isResponse = (input: unknown): input is Response => {
	return typeof input === "object" && input !== null && "status" in input && "statusText" in input;
};

export const apiEndpoint = Stream<{
	/** Is the API endpoint in debug mode. */
	debug: boolean,

	/** Hostname for the endpoint. */
	hostname: NullUUID,

	/** ID for authentication. */
	id: NullUUID,

	/** Key for authentication. */
	key: NullUUID,
}>({
	debug: false,
	hostname: null,
	id: "",
	key: "",
});

export const API = {
	clearAPIEndpoint: (): void => {
		apiEndpoint({
			debug: false,
			hostname: null,
			id: "",
			key: "",
		});
	},
	create: async (path: string, body?: object): Promise<APIResponse<unknown> | Err> => {
		return API.fetch("POST", path, {
			body: body,
		});
	},
	delete: async (path: string, body?: object): Promise<APIResponse<unknown> | Err> => {
		return API.fetch("DELETE", path, {
			body: body,
		});
	},
	fetch: async (method: string, path: string, {
		body,
		hash,
		updated,
	}: {
		/** Body to send with fetch request. */
		body?: object,

		/** Hash to include in request for caching. */
		hash?: string,

		/** Updated value to include in request for caching. */
		updated?: NullTimestamp,
	}): Promise<APIResponse<unknown> | Err> => {
		Log.debug(`API request ${method} ${path}`);

		const headers: APIHeader = {};
		if (updated !== undefined && updated !== null) {
			headers["x-homechart-updated"] = updated;
		}

		if (hash !== undefined && hash !== "") {
			headers["x-homechart-hash"] = hash;
		}

		if (apiEndpoint().id === "") {
			await IndexedDB.get("APIAuth")
				.then((data) => {
					if (data !== null) {
						apiEndpoint().id = (data as Credentials).id; // eslint-disable-line @typescript-eslint/consistent-type-assertions
						apiEndpoint().key = (data as Credentials).key; // eslint-disable-line @typescript-eslint/consistent-type-assertions
					}
				});
		}

		headers["x-homechart-id"] = apiEndpoint().id!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
		headers["x-homechart-key"] = apiEndpoint().key!; // eslint-disable-line @typescript-eslint/no-non-null-assertion

		if (path === "/api?type=client") {
			headers["x-homechart-version"] = process.env.BUILD_VERSION!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
		}

		if (apiEndpoint().debug) {
			headers["x-homechart-debug"] = "true";
		}

		return fetcher(`${await API.getHostname()}${path}`, {
			body: JSON.stringify(body),
			headers: headers,
			method: method,
		})
			.then(async (response: Response) => {
				if (response.status === 204) {
					Log.debug(`API.fetch ${method} ${path} returned ${response.status}`);

					return {
						...APIResponse(),
						status: 204,
						success: true,
					};
				}

				return response.json()
					.then((json) => {
						if (! response.ok) {
							throw json; // eslint-disable-line no-restricted-syntax
						}

						if (IsAPIResponse(json)) {
							Log.debug(`API.fetch ${method} ${path} returned:\n${JSON.stringify(json)}`);
							return json;
						}

						return {
							...APIResponse(),
							message: "",
							status: 204,
							success: true,
						};
					});
			})
			.catch((err: any) => { // eslint-disable-line @typescript-eslint/no-explicit-any
				if (IsAPIResponse(err)) {
					return NewErr("API error", err.message);
				}

				if (isResponse(err) || err.status === undefined) {
					if (err.status === undefined || err.status === 0 || err.status === 502) {
						return {
							...APIResponse(),
							message: "Homechart is offline",
						};
					}
				}

				if (path !== "/this/should/fail") {
					NewErr(`API.fetch: unknown response for ${path}:\n${JSON.stringify(err)}`, "Unknown response received");
				}

				return {
					...APIResponse(),
					...{
						message: "Server error",
						status: 500,
					},
				};
			});
	},
	getHostname: async (): Promise<string> => {
		if (apiEndpoint().hostname === null) {
			await IndexedDB.get("APIHostname")
				.then(async (data) => {
					if (data !== null) {
						apiEndpoint().hostname = data as string; // eslint-disable-line @typescript-eslint/consistent-type-assertions
						return;
					}

					apiEndpoint().hostname = "";
				});
		}

		return apiEndpoint().hostname!; // eslint-disable-line @typescript-eslint/no-non-null-assertion
	},
	getLink: (): string => {
		return `${apiEndpoint().hostname === "" ?
			window.location.origin :
			apiEndpoint().hostname}`;
	},
	read: async (path: string, params: {
		/** Filter query string. */
		filter?: string,

		/** Hash header. */
		hash?: string,

		/** Offset query string. */
		offset?: number,

		/** Updated header. */
		updated?: NullUUID,
	}): Promise<APIResponse<unknown> | Err> => {
		let uri = path;
		const query: string[] = [];

		if (params.filter !== undefined) {
			query.push(`filter=${params.filter}`);
		}

		if (params.offset !== undefined) {
			query.push(`offset=${params.offset}`);
		}

		if (query.length > 0) {
			uri += `?${query.join("&")}`;
		}

		return API.fetch("GET", uri, {
			hash: params.hash,
			updated: params.updated,
		});
	},
	setAuth: async (auth: {
		/** ID value. */
		id: NullUUID,

		/** Key value. */
		key: NullUUID,
	}): Promise<void | Err> => {
		apiEndpoint().id = auth.id;
		apiEndpoint().key = auth.key;

		await IndexedDB.set("APIHostname", apiEndpoint().hostname);
		return IndexedDB.set("APIAuth", auth);
	},
	setHostname: (hostname: string): void => {
		apiEndpoint().hostname = hostname;
	},
	toggleDebug: (): void => {
		apiEndpoint({
			...apiEndpoint(),
			...{
				debug: !apiEndpoint().debug,
			},
		});
	},
	update: async (path: string, body?: object): Promise<APIResponse<unknown>| Err> => {
		return API.fetch("PUT", path, {
			body: body,
		});
	},
};
