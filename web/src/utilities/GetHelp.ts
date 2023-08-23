/* eslint-disable jsdoc/require-jsdoc */

export function GetHelp (path?: string): {
	helpLink: string,
} {
	return {
		helpLink: `https://homechart.app/docs/guides/${path === undefined ?
			"" :
			path}`,
	};
}
