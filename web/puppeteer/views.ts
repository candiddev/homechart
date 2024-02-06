import type { Page } from "puppeteer";

import utilities from "./utilities";

const views = {
  bookmarks: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "bookmarks", "all");
    await utilities.screenshot(page, ".TableData", "bookmarks");

    if (!utilities.modeScreenshot()) {
      const rows = await page.$$("tr");
      expect(rows.length).toBe(3);
    }
  },
  budgetAccounts: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "budget", "accounts");
    await utilities.screenshot(page, ".TableData", "budget_accounts");

    if (!utilities.modeScreenshot()) {
      const rows = await page.$$("tr");
      expect(rows.length).toBe(4);
    }
  },
  budgetCategories: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "budget", "categories");
    await utilities.screenshot(page, "#subtitle-income", "budget_categories");

    if (!utilities.modeScreenshot()) {
      const rows = await page.$$("tr");
      expect(rows.length).toBe(17);
    }
  },
  budgetTransactions: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "budget", "accounts");
    await utilities.waitFor(page, ".TableData");
    await utilities.click(page, ".TableData__link");
    await utilities.screenshot(
      page,
      "#table-container-transactions",
      "budget_transactions",
    );
  },
  calendar: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "calendar");
    await utilities.screenshot(page, "#calendar", "calendar_week");

    if (utilities.getAppend() === "") {
      await utilities.click(page, "#button-array-display-month");
      await utilities.screenshot(page, "#calendar", "calendar_month");
    }
  },
  cookMeals: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "cook", "meal-times");
    await utilities.screenshot(page, ".TableData", "cook_meals");

    if (!utilities.modeScreenshot()) {
      const rows = await page.$$("tr");
      expect(rows.length).toBe(5);
    }
  },
  cookRecipes: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "cook", "recipes");
    await utilities.screenshot(page, "#table", "cook_recipes");

    if (utilities.modeScreenshot()) {
      await utilities.click(page, ".TableData__img");
      await utilities.screenshot(page, ".TableData", "cook_recipe");
    }
  },
  healthItems: async (page: Page): Promise<void> => {
    if (utilities.modeScreenshot()) {
      await utilities.openMenu(page, "health", "inputs", "jane");
    } else {
      await utilities.openMenu(page, "health", "inputs");
    }
    await utilities.screenshot(page, ".TableData", "health_inputs");

    if (!utilities.modeScreenshot()) {
      const rows = await page.$$("tr");
      expect(rows.length).toBe(22);
    }

    if (utilities.modeScreenshot()) {
      await utilities.openMenu(page, "health", "outputs", "jane");
    } else {
      await utilities.openMenu(page, "health", "outputs");
    }
    await utilities.screenshot(page, ".TableData", "health_outputs");

    if (!utilities.modeScreenshot()) {
      const rows = await page.$$("tr");
      expect(rows.length).toBe(20);
    }
  },
  inventoryCollections: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "inventory", "all-collections");
    await utilities.screenshot(page, "#table", "inventory_collections");

    if (!utilities.modeScreenshot()) {
      const rows = await page.$$("tr");
      expect(rows.length).toBe(7);
    }
  },
  inventoryItems: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "inventory", "all-items");
    await utilities.screenshot(page, "#table", "inventory_items");
  },
  notesPages: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "notes", "personal");
    await utilities.screenshot(page, ".TableData", "notes_pages");

    if (utilities.modeScreenshot()) {
      await utilities.click(page, ".Table__edit:nth-child(3)");
      await utilities.screenshot(page, "#notes-body", "notes_page");
    } else {
      const rows = await page.$$("tr");
      expect(rows.length).toBe(3);
    }
  },
  planTasks: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "plan", "today");
    await utilities.screenshot(page, ".PlanTasks__name--header", "plan_today");

    if (utilities.modeScreenshot()) {
      await page.evaluate(() => {
        (document.querySelector("#tab-household") as HTMLElement).click();
      });
      await utilities.screenshot(
        page,
        ".PlanTasks__name--header",
        "plan_household",
      );
    } else {
      await page.evaluate(() => {
        (document.querySelector("#tab-personal") as HTMLElement).click();
      });
      await utilities.screenshot(
        page,
        ".PlanTasks__name--header",
        "plan_personal",
      );
      const rows = await page.$$(".PlanTasks__item--task");
      expect(rows.length).toBe(20);
    }
  },
  rewardCards: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "reward", "redeemable");
    await utilities.screenshot(page, ".Form", "reward_redeem");
    await utilities.openMenu(page, "reward", "sent");
    await utilities.screenshot(page, ".Form", "reward_sent");

    if (!utilities.modeScreenshot()) {
      const cards = await page.$$(".RewardCards__card");
      expect(cards.length).toBe(1);
    }
  },
  secretsValue: async (page: Page): Promise<void> => {
    if (utilities.modeScreenshot()) {
      await utilities.openMenu(page, "secrets", "all-vaults");
      await utilities.screenshot(page, "#table", "secrets_vaults");

      await utilities.openMenu(page, "secrets", "personal", "janes-vault");
      await utilities.screenshot(page, "#table", "secrets_values");
    } else {
      await utilities.openMenu(page, "settings", "account");
      await utilities.click(page, "#tab-security");
      await utilities.screenshot(page, "#title-private-key-passphrases", "wtf");
      await utilities.waitFor(page, "#table");
      let rows = await page.$$("tr");
      expect(rows.length).toBe(3);
      await utilities.click(page, "#button-lock-private-key");
      await utilities.waitFor(page, "#form-item-input-passphrase");
      rows = await page.$$("tr");
      expect(rows.length).toBe(0);
      await utilities.input(
        page,
        "#form-item-input-passphrase",
        utilities.getUsername(),
      );
      await utilities.click(page, "#button-unlock-private-key");
      await utilities.waitFor(page, "#table");
      rows = await page.$$("tr");
      expect(rows.length).toBe(3);
      await utilities.openMenu(page, "secrets", "all-vaults");
      await utilities.click(page, "#app-toolbar-action-toggle");
      await utilities.click(page, "#dropdown-item-secretsvault");
      await utilities.input(page, "#form-item-input-name", "My Vault");
      await utilities.screenshot(page, "#table", "secrets_vaults");
      await utilities.click(page, "#button-add");
      await utilities.openMenu(page, "secrets", "all-vaults");
      await utilities.screenshot(page, "#table", "secrets_vaults");

      // Add value
      await utilities.openMenu(page, "secrets", "household", "my-vault");
      await utilities.click(page, "#button-new-value");
      await utilities.input(page, "#form-item-input-name", "Homechart");
      await utilities.input(page, "#form-item-input-tags", "app ");
      await utilities.click(page, "#button-add-value");
      await utilities.input(
        page,
        "#form-item-input-properties-key-1",
        "Username",
      );
      await utilities.input(
        page,
        "#form-item-input-properties-value-1",
        "user@example.com",
      );
      await utilities.click(page, "#button-add-value");
      await utilities.input(
        page,
        "#form-item-input-properties-key-2",
        "Password",
      );
      await utilities.input(
        page,
        "#form-item-input-properties-value-2",
        "password",
      );
      await utilities.click(page, "#button-add");
      await utilities.screenshot(page, "#table", "secrets_values");
    }
  },
  settingsAccount: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "settings", "account");
    await utilities.click(page, "#form-expander-color-and-theme");
    await utilities.click(page, "#form-checkbox-label-dark-mode");
    await utilities.screenshot(page, "#form", "settings_account");
    if (!utilities.modeScreenshot()) {
      await utilities.click(page, "#tab-delete-account");
      await utilities.click(page, "#button-delete-account");
      await utilities.click(page, "#button-confirm-delete-account");
      await utilities.waitFor(page, "#button-sign-in-with-email-address");
    }
  },
  settingsHousehold: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "settings", "households");
    await utilities.screenshot(page, ".TableData", "settings_households");
    await utilities.click(page, ".TableData");
    await utilities.screenshot(page, "#form", "settings_household");
  },
  setup: async (page: Page): Promise<void> => {
    await utilities.waitFor(page, "#form");
    await utilities.click(page, "#button-next");
    await utilities.waitFor(page, "#form");
    await utilities.click(page, "#button-next");
    await utilities.waitFor(page, "#form");
    await utilities.click(page, "#button-add-household");
    await utilities.click(page, "#button-next");
    await utilities.waitFor(page, "#form");
    await utilities.click(page, "#button-finish");
    await utilities.waitFor(page, "#home");
  },
  shopCategories: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "shop", "categories");
    await utilities.screenshot(page, "#table", "shop_categories");

    if (!utilities.modeScreenshot()) {
      const rows = await page.$$("tr");
      expect(rows.length).toBe(18);
    }
  },
  shopItems: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "shop", "pick-up");
    await utilities.screenshot(page, "#table", "shop_items");
  },
  signIn: async (page: Page): Promise<void> => {
    await utilities.waitFor(page, "#homechart-logo");
    await utilities.screenshot(page, "#homechart-logo", "sign_in");
    await page.type("#form-item-input-email-address", utilities.getUsername());
    await page.type("#form-item-input-password", utilities.getUsername());
    await utilities.click(page, "#button-sign-in-with-email-address");
  },
  signUp: async (page: Page): Promise<void> => {
    await utilities.waitFor(page, "#terms");
    await utilities.screenshot(page, "#terms", "sign_up");
    await page.type("#form-item-input-email-address", utilities.getUsername());
    await page.type("#form-item-input-password", utilities.getUsername());
    await utilities.click(page, "#button-sign-up-with-email-address");
  },
  subscription: async (page: Page): Promise<void> => {
    await utilities.openMenu(page, "subscription");
    await utilities.waitFor(page, "#form");
    await utilities.screenshot(page, "#form", "subscription");
  },
};

export default views;
