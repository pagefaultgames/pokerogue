import "vitest-canvas-mock";
import "#plugins/i18n"; // tests don't go through `main.ts`, requiring this to be imported here as well

import { PromptHandler } from "#test/test-utils/helpers/prompt-handler";
import { MockConsole } from "#test/test-utils/mocks/mock-console/mock-console";
import { logTestEnd, logTestStart } from "#test/test-utils/setup/test-end-log";
import { initTests } from "#test/test-utils/test-file-initialization";
import chalk from "chalk";
import { afterAll, afterEach, beforeAll, beforeEach, vi } from "vitest";

//#region Mocking

// Mock the override import to always return default values, ignoring any custom overrides.
vi.mock(import("#app/overrides"), async importOriginal => {
  const { defaultOverrides } = await importOriginal();

  return {
    default: defaultOverrides,
    // Export `defaultOverrides` as a *copy*.
    // This ensures we can easily reset `overrides` back to its default values after modifying it.
    defaultOverrides: { ...defaultOverrides },
  } satisfies typeof import("#app/overrides");
});

/**
 * This is a hacky way to mock the i18n backend requests (with the help of {@link https://mswjs.io/ | msw}).
 * The reason to put it inside of a mock is to elevate it.
 * This is necessary because how our code is structured.
 * Do NOT try to put any of this code into external functions, it won't work as it's elevated during runtime.
 */
vi.mock(import("i18next"), async importOriginal => {
  // NB: We have to use raw ANSI escapes here since chalk isn't initialized yet.
  // (For those wondering, this corresponds to the same rgb(223, 184, 216) color used in the chalk calls below, just in RGB)
  console.log("\x1b[38;2;223;184;216mMocking i18next...\x1b[0m");
  const { setupServer } = await import("msw/node");
  const { http, HttpResponse } = await import("msw");

  // TODO: This sounds like a good use for Vitest's `globalSetupFiles`...?
  global.server = setupServer(
    http.get("/locales/en/*", async req => {
      const filename = req.params[0];

      try {
        const localeFiles = import.meta.glob("../../locales/en/**/*.json", { eager: true });
        const json = localeFiles[`../../locales/en/${filename}`] || {};
        if (import.meta.env.VITE_I18N_DEBUG === "1") {
          console.log("Loaded locale", filename);
        }
        return HttpResponse.json(json);
      } catch (err) {
        console.error(`Failed to load locale ${filename}!\n`, err);
        return HttpResponse.json({});
      }
    }),
    http.get("https://fonts.googleapis.com/*", () => {
      return HttpResponse.text("");
    }),
  );
  global.server.listen({ onUnhandledRequest: "error" });
  console.log("\x1b[38;2;223;184;216mi18n MSW server listening\x1b[0m");

  return await importOriginal();
});

//#endregion Mocking

//#region Hooks

beforeAll(() => {
  initTests();
});

afterAll(() => {
  global.server.close();
  MockConsole.printPostTestWarnings();
  console.log(chalk.hex("#dfb8d8")("Closing i18n MSW server!"));
});

beforeEach(context => {
  logTestStart(context.task);
});

afterEach(context => {
  logTestEnd(context.task);
  clearInterval(PromptHandler.runInterval);
  PromptHandler.runInterval = undefined;
});

//#endregion Hooks
