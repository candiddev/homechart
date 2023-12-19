import fs from "fs";
import type { Browser } from "puppeteer";
import puppeteer from "puppeteer";

import utilities from "./utilities";
import views from "./views";

let browser: Browser;

beforeAll(async () => {
	browser = await puppeteer.launch({
		args: [
			"--no-sandbox",
			"--disable-setuid-sandbox",
			"--disable-web-security",
		],
		dumpio: true,
		ignoreHTTPSErrors: true,
	});
});

afterAll(async () => {
	await browser.close();
});

const devices = [
	// Desktop (1920 x 1080)
	{
		append: "",
		viewport: {
			height: 1080,
			width: 1920,
		},
	},
	/*
	// 5.5" iPhone (1242 x 2208)
	{
		append: "_5-5",
		viewport: {
			deviceScaleFactor: 3,
			height: 736,
			width: 414,
		},
	},
	// 6.5" iPhone/Android (1242 x 2688)
	{
		append: "_6-5",
		viewport: {
			deviceScaleFactor: 3,
			height: 896,
			width: 414,
		},
	},
	// 12.9" iPad3 (2048 x 2732)
	{
		append: "_ipad",
		viewport: {
			deviceScaleFactor: 2,
			height: 1366,
			width: 1024,
		},
	},*/
];

test("homechart.app", async () => {
	const page = await browser.newPage();
	await page.setExtraHTTPHeaders({
		"x-homechart-ratelimiterkey": process.env.HOMECHART_APP_RATELIMITERKEY === undefined ?
			"" :
			process.env.HOMECHART_APP_RATELIMITERKEY,
	});
	await page.setBypassCSP(true);

	fs.mkdir("screenshots", () => {});

	let i = 0;

	for (const device of devices) {
		if (! utilities.modeScreenshot() && device.append !== "") {
			continue;
		}

		utilities.setAppend(device.append);

		await page.setViewport(device.viewport);
		await page.goto(`${process.env.PUPPETEER_URL === undefined || process.env.PUPPETEER_URL=== "" ?
			"http://localhost" :
			process.env.PUPPETEER_URL}`);

		if (! utilities.modeScreenshot()) {
			await utilities.click(page, "#button-sign-up");
			await views.signUp(page);

			await views.setup(page);

			// SignOut
			await utilities.openMenu(page, "signout");
			await utilities.waitFor(page, "#button-sign-in-with-email-address");
		}

		if (i === 0) {
			// SignIn
			await views.signIn(page);
		}

		i++;

		// Home
		await utilities.screenshot(page, "#home", "home");

		await views.budgetAccounts(page);
		await views.budgetCategories(page);
		await views.budgetTransactions(page);
		await views.calendar(page);
		await views.cookMeals(page);
		await views.cookRecipes(page);
		await views.healthItems(page);
		await views.inventoryCollections(page);
		await views.inventoryItems(page);
		await views.notesPages(page);
		await views.planTasks(page);
		await views.rewardCards(page);
		await views.secretsValue(page);
		await views.shopCategories(page);
		await views.shopItems(page);
		await views.settingsHousehold(page);
		await views.subscription(page);
		await views.settingsAccount(page);
	}
}, utilities.modeScreenshot() ?
	900000 :
	90000);
