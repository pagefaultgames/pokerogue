import "vitest-canvas-mock";
import { initializeGame } from "#app/init/init";
import { MockConsole } from "#test/test-utils/mocks/mock-console/mock-console";
import { initTests } from "#test/test-utils/test-file-initialization";
import chalk from "chalk";
import { afterAll, beforeAll, vi } from "vitest";

/** Set the timezone to UTC for tests. */

/** Mock the override import to always return default values, ignoring any custom overrides. */
vi.mock("#app/overrides", async importOriginal => {
  const { defaultOverrides } = await importOriginal<typeof import("#app/overrides")>();

  return {
    default: defaultOverrides,
    defaultOverrides,
  } satisfies typeof import("#app/overrides");
});

//#region Mocking

/** Mock the override import to always return default values, ignoring any custom overrides. */
vi.mock("#app/overrides", async importOriginal => {
  const { defaultOverrides } = await importOriginal<typeof import("#app/overrides")>();

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
vi.mock("i18next", async importOriginal => {
  console.log("Mocking i18next");
  const { setupServer } = await import("msw/node");
  const { http, HttpResponse } = await import("msw");

  global.server = setupServer(
    http.get("/locales/en/*", async req => {
      const filename = req.params[0];

      try {
        const localeFiles = import.meta.glob("../public/locales/en/**/*.json", { eager: true });
        const json = localeFiles[`../public/locales/en/${filename}`] || {};
        //
        if (import.meta.env.VITE_I18N_DEBUG === "1") {
          console.log("Loaded locale", filename);
        }
        return HttpResponse.json(json);
      } catch (err) {
        console.log(`Failed to load locale ${filename}!`, err);
        return HttpResponse.json({});
      }
    }),
    http.get("https://fonts.googleapis.com/*", () => {
      return HttpResponse.text("");
    }),
  );
  global.server.listen({ onUnhandledRequest: "error" });
  console.log("i18n MSW server listening!");

  return await importOriginal();
});

/** Ensure that i18n is initialized on all calls. */
// TODO: Initialize i18n directly on import instead of initializing it during importing of trainer code
vi.mock("#app/plugins/i18n", async importOriginal => {
  const importedStuff = await importOriginal<typeof import("#app/plugins/i18n")>();
  const { initI18n } = importedStuff;
  await initI18n();
  return importedStuff;
});

global.testFailed = false;

initializeGame();

beforeAll(() => {
  initTests();
});

afterAll(() => {
  global.server.close();
  MockConsole.printPostTestWarnings();
  console.log(chalk.hex("#dfb8d8")("Closing i18n MSW server!"));
});
