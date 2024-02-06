import type { Page } from "puppeteer";

const output = "./screenshots/";

const username = `e2e-test-${Math.random().toString(36).substring(7)}@${
  process.env.HOMECHART_APP_NOEMAILDOMAINS === undefined
    ? "example.com"
    : process.env.HOMECHART_APP_NOEMAILDOMAINS
}`;

let append = "";

const utilities = {
  click: async (page: Page, selector: string): Promise<void> => {
    await utilities.waitFor(page, selector);
    await page.click(selector);
  },
  getAppend: (): string => {
    return append;
  },
  getUsername: (): string => {
    if (utilities.modeScreenshot()) {
      return "jane@example.com";
    }

    return username;
  },
  input: async (page: Page, selector: string, input: string): Promise<void> => {
    await page.waitForSelector(selector, {
      visible: true,
    });
    await page.focus(selector);
    await page.keyboard.type(input, { delay: 100 });
  },
  modeScreenshot: (): boolean => {
    return process.env.PUPPETEER_SCREENSHOT !== undefined;
  },
  openMenu: async (
    page: Page,
    component: string,
    view?: string,
    item?: string,
  ): Promise<void> => {
    if (!(await utilities.visible(page, "#app-menu-component-settings"))) {
      await utilities.click(page, "#app-logo-toggle");
    }

    const componentID = `#app-menu-component-${component}`;
    if (!(await utilities.visible(page, componentID))) {
      await utilities.waitFor(page, componentID);
    }

    const componentMenu = `#app-menu-${component}`;
    const viewID = `#app-menu-${component}-view-${view}-link`;

    if (view === undefined || !(await utilities.visible(page, componentMenu))) {
      await utilities.click(page, componentID);
    }

    if (view !== undefined) {
      if (item === undefined) {
        await page.$eval(viewID, (el) => {
          (el as HTMLElement).click();
        });
      } else {
        await utilities.click(page, `#app-menu-item-${view}-${item}`);
      }
    }
  },
  screenshot: async (
    page: Page,
    waitForElement: string,
    view: string,
  ): Promise<void> => {
    console.log(`Screenshot ${view}${append}`); // eslint-disable-line

    await utilities.waitFor(page, waitForElement).catch(async (err) => {
      await page.screenshot({
        path: `${output}${view}${append}.png`,
      });

      throw err; //eslint-disable-line no-restricted-syntax
    });
    await page.screenshot({
      path: `${output}${view}${append}.png`,
    });
  },
  setAppend: (newAppend: string): void => {
    append = newAppend;
  },
  visible: async (page: Page, selector: string): Promise<boolean> => {
    return page
      .$eval(selector, (e) => {
        return (
          e !== undefined &&
          window.getComputedStyle(e).getPropertyValue("visibility") !== "hidden"
        );
      })
      .catch(() => {
        return false;
      });
  },
  waitFor: async (page: Page, selector: string): Promise<void> => {
    await page.waitForSelector(selector, {
      visible: true,
    });

    return new Promise((r) => {
      return setTimeout(r, 500);
    });
  },
};

export default utilities;
