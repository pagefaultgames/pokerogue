import "vitest-canvas-mock";
import { afterAll, beforeAll, vi } from "vitest";

import { initTestFile } from "./testUtils/testFileInitialization";

/** Set the timezone to UTC for tests. */

/** Mock the override import to always return default values, ignoring any custom overrides. */
vi.mock("#app/overrides", async importOriginal => {
  const { defaultOverrides } = await importOriginal<typeof import("#app/overrides")>();

  return {
    default: defaultOverrides,
    defaultOverrides,
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
        const json = await import(`../public/locales/en/${req.params[0]}`);
        console.log("Loaded locale", filename);
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

global.testFailed = false;

beforeAll(() => {
  initTestFile();
});

afterAll(() => {
  global.server.close();
  console.log("Closing i18n MSW server!");
});
