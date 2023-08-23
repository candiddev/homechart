/* eslint-disable @typescript-eslint/no-type-alias */

interface Data {
	[index: string]: any, // eslint-disable-line @typescript-eslint/no-explicit-any
	authAccountID?: NullUUID,
	authHouseholdID?: NullUUID,
	id: NullUUID,
	name?: string,
	parentID?: NullUUID,
	shortID?: string,
	tags?: string[],
	updated?: NullTimestamp,
}

interface Tag {
	[key: string]: boolean | null | number | string | undefined,
	count: number,
	name: string,
}
