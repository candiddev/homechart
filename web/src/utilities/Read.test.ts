import type { ReadResponse } from "./Read";
import { read } from "./Read";

const input = {
	id: "1",
	path: "/api/v1/datas",
	typeArray: "Datas",
	typeObject: "Data",
};

test.each([
	[
		"offline",
		{
			status: 0,
		},
		{
			hash: "",
			offline: true,
		},
	],
	[
		"new values",
		{
			dataType: "Data",
			dataValue: [
				{
					id: "1",
				},
			],
		},
		{
			data: {
				id: "1",
			},
			hash: "",
			offline: false,
		},
	],
	[
		"no values / error",
		{
			dataType: "D",
		},
		{
			hash: "",
			offline: false,
		},
	],
])("read: %s", async (_name: string, response: XHRResponse, output: ReadResponse<Data>) => {
	testing.mocks.responses = [
		response,
	];

	expect(await read(input))
		.toStrictEqual(output);

	testing.requests([
		{
			method: "GET",
			path: "/api/v1/datas/1",
		},
	]);
});
