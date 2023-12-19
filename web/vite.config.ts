/* eslint-disable camelcase */

import viteDefaultConfig from "./vite-default.config";

export default viteDefaultConfig({
	devOptions: {
		enabled: true,
		type: "module",
	},
	filename: "sw.ts",
	injectManifest: {
		globPatterns: [
			"**/*.{js,css,html,png,webp,woff2}",
		],
	},
	injectRegister: null,
	manifest: {
		description: "Your Handy Home Assistant",
		display: "standalone",
		icons: [
			{
				sizes: "192x192",
				src: "homechart_192_202312171.png",
				type: "image/png",
			},
			{
				sizes: "512x512",
				src: "homechart_512_202312171.png",
				type: "image/png",
			},
			{
				purpose: "maskable",
				sizes: "512x512",
				src: "homechart_512_mask_202312171.png",
				type: "image/png",
			},
		],
		id: "/",
		name: "Homechart",
		share_target: {
			action: "/share",
			enctype: "application/x-www-form-urlencoded",
			method: "GET",
			params: {
				text: "text",
				title: "title",
				url: "url",
			},
		},
		short_name: "Homechart",
		shortcuts: [
			{
				description: "View your calendar",
				icons: [
					{
						sizes: "192x192",
						src: "calendar_20220729.png",
					},
				],
				name: "Calendar",
				short_name: "Calendar",
				url: "/calendar",
			},
			{
				description: "View your tasks",
				icons: [
					{
						sizes: "192x192",
						src: "plan_20220729.png",
					},
				],
				name: "Plan",
				short_name: "Plan",
				url: "/plan/tasks?filter=today",
			},
		],
		start_url: "/",
	} as any, // eslint-disable-line @typescript-eslint/no-explicit-any
	srcDir: "",
	strategies: "injectManifest",
});
