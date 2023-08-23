import { Icons } from "@lib/types/Icons";
import { Timestamp } from "@lib/types/Timestamp";
import { Clone } from "@lib/utilities/Clone";
import { FilterSortChildren } from "@lib/utilities/FilterSortChildren";

import seed from "../jest/seed";
import { Permission } from "../types/Permission";
import { AuthAccountState } from "./AuthAccount";
import { AuthHouseholdState } from "./AuthHousehold";
import { AuthSessionState } from "./AuthSession";
import { NotesPageState } from "./NotesPage";

const now = Timestamp.now()
	.toString();

beforeEach(() => {
	NotesPageState.data([
		...seed.notesPages,
		{
			...NotesPageState.new(),
			...{
				authAccountID: seed.authAccounts[0].id,
				deleted: now,
				id: "1",
				name: "a",
			},
		},
		{
			...NotesPageState.new(),
			...{
				authHouseholdID: seed.authHouseholds[0].id,
				deleted: now,
				id: "2",
				name: "b",
			},
		},
	]);
});

describe("NotesPage", () => {
	AuthAccountState.data(seed.authAccounts[0]);
	AuthHouseholdState.data(seed.authHouseholds);

	const filterSorted = [
		{
			...seed.notesPages[0],
			...{
				children: [
					{
						...seed.notesPages[1],
						...{
							children: [],
						},
					},
				],
			},
		},
		{
			...seed.notesPages[2],
			...{
				children: [
					{
						...seed.notesPages[3],
						...{
							children: [],
						},
					},
				],
			},
		},
		{
			...seed.notesPages[4],
			...{
				children: [],
			},
		},
	];

	NotesPageState.data.map((data) => {
		NotesPageState.nested(FilterSortChildren({
			input: Clone(data),
		}));
	});

	test("data", () => {
		NotesPageState.data(seed.notesPages);
	});

	test("findTag", () => {
		const data = [
			{
				...NotesPageState.new(),
				...{
					id: "0",
					name: "a",
					tags: [
						"a",
						"b",
					],
				},
			},
			{
				...NotesPageState.new(),
				...{
					id: "1",
					name: "b",
					tags: [
						"b",
						"c",
					],
				},
			},
			{
				...NotesPageState.new(),
				...{
					id: "2",
					name: "c",
					tags: [
						"c",
						"a",
					],
				},
			},
		];
		NotesPageState.data(data);

		expect(NotesPageState.findTag("b"))
			.toStrictEqual([
				data[0],
				data[1],
			]);

	});

	test("getNested", () => {
		expect(NotesPageState.nested())
			.toStrictEqual(filterSorted);
	});

	test("getHousehold", () => {
		expect(NotesPageState.household())
			.toStrictEqual([
				filterSorted[1],
			]);
	});

	test("getColorNamesID", () => {
		const output = [
			{
				id: "personal",
				level: 0,
				name: "Personal",
			},
			{
				color: seed.notesPages[0].color,
				icon: seed.notesPages[0].icon,
				id: seed.notesPages[0].id,
				level: 1,
				name: seed.notesPages[0].name,
			},
			{
				color: seed.notesPages[1].color,
				icon: seed.notesPages[1].icon,
				id: seed.notesPages[1].id,
				level: 2,
				name: seed.notesPages[1].name,
			},
			{
				color: seed.notesPages[4].color,
				icon: Icons.Notes,
				id: seed.notesPages[4].id,
				level: 1,
				name: seed.notesPages[4].name,
			},
			{
				id: "household",
				level: 0,
				name: "Household",
			},
			{
				color: seed.notesPages[2].color,
				icon: seed.notesPages[2].icon,
				id: seed.notesPages[2].id,
				level: 1,
				name: seed.notesPages[2].name,
			},
			{
				color: seed.notesPages[3].color,
				icon: seed.notesPages[3].icon,
				id: seed.notesPages[3].id,
				level: 2,
				name: seed.notesPages[3].name,
			},
		];
		AuthSessionState.data({
			...AuthSessionState.new(),
			...{
				permissionsHouseholds: [
					{
						authHouseholdID: seed.authHouseholds[0].id,
						permissions: {
							...Permission.new(),
							...{
								notes: 1,
							},
						},
					},
				],
			},
		});
		expect(NotesPageState.getColorNamesIDs())
			.toStrictEqual(output.slice(0, 4));
		AuthSessionState.data().permissionsHouseholds![0].permissions.notes = 0;
		expect(NotesPageState.getColorNamesIDs())
			.toStrictEqual(output);
		AuthSessionState.data().permissionsHouseholds![0].permissions.notes = 2;
		AuthAccountState.data(seed.authAccounts[1]);
		expect(NotesPageState.getColorNamesIDs())
			.toStrictEqual([
				{
					id: "personal",
					level: 0,
					name: "Personal",
				},
			]);
		AuthAccountState.data(seed.authAccounts[0]);
	});

	test("getPersonal", () => {
		expect(NotesPageState.personal())
			.toStrictEqual([
				filterSorted[0],
				filterSorted[2],
			]);
	});
});
