import "vitest-canvas-mock";
import "#plugins/i18n"; // tests don't go through `main.ts`, requiring this to be imported here as well

import { PromptHandler } from "#test/helpers/prompt-handler";
import { MockConsole } from "#test/mocks/mock-console/mock-console";
import { logTestEnd, logTestStart } from "#test/setup/test-end-log";
import { initTests } from "#test/setup/test-file-initialization";
import fs from "node:fs";
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

  return await importOriginal();
});

vi.mock(import("#utils/fetch-utils"), async importOriginal => {
  const { getCachedUrl } = await importOriginal();

  function prependPath(originalPath: string) {
    const prefix = "assets";
    if (originalPath.startsWith("./")) {
      return originalPath.replace("./", `${prefix}/`);
    }
    return originalPath;
  }
  // Simulate fetch response
  function createFetchResponse(data: unknown): Response {
    return {
      ok: true,
      status: 200,
      headers: new Headers(),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    } as Response;
  }
  // Simulate fetch response
  function createFetchBadResponse(data: unknown): Response {
    return {
      ok: false,
      status: 404,
      headers: new Headers(),
      json: () => Promise.resolve(data),
      text: () => Promise.resolve(JSON.stringify(data)),
    } as Response;
  }

  async function cachedFetch(url: string, _init?: RequestInit): Promise<Response> {
    // Replace all battle anim fetches solely with the tackle anim to save time.
    // TODO: This effectively bars us from testing battle animation related code ever
    const newUrl = url.includes("./battle-anims/") ? prependPath("./battle-anims/tackle.json") : prependPath(url);
    try {
      const raw = fs.readFileSync(newUrl, { encoding: "utf8", flag: "r" });
      return createFetchResponse(JSON.parse(raw));
    } catch {
      return createFetchBadResponse({});
    }
  }

  return { cachedFetch, getCachedUrl } satisfies typeof import("#utils/fetch-utils");
});

//#endregion Mocking

//#region Hooks

beforeAll(() => {
  initTests();
});

afterAll(() => {
  global.server.close();
  MockConsole.printPostTestWarnings();
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
