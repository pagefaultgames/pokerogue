import "vitest-canvas-mock";

import { initLoggedInUser } from "#app/account";
import { initAbilities } from "#app/data/ability";
import { initBiomes } from "#app/data/balance/biomes";
import { initEggMoves } from "#app/data/balance/egg-moves";
import { initPokemonPrevolutions } from "#app/data/balance/pokemon-evolutions";
import { initMoves } from "#app/data/move";
import { initMysteryEncounters } from "#app/data/mystery-encounters/mystery-encounters";
import { initPokemonForms } from "#app/data/pokemon-forms";
import { initSpecies } from "#app/data/pokemon-species";
import { initAchievements } from "#app/system/achv";
import { initVouchers } from "#app/system/voucher";
import { initStatsKeys } from "#app/ui/game-stats-ui-handler";
import { afterAll, beforeAll, vi } from "vitest";

/** Set the timezone to UTC for tests. */
process.env.TZ = "UTC";

/** Mock the override import to always return default values, ignoring any custom overrides. */
vi.mock("#app/overrides", async (importOriginal) => {
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
vi.mock("i18next", async (importOriginal) => {
  console.log("Mocking i18next");
  const { setupServer } = await import("msw/node");
  const { http, HttpResponse } = await import("msw");

  global.i18nServer = setupServer(
    http.get("/locales/en/*", async (req) => {
      const filename = req.params[0];

      try {
        const json = await import(`../../public/locales/en/${req.params[0]}`);
        console.log("Loaded locale", filename);
        return HttpResponse.json(json);
      } catch (err) {
        console.log(`Failed to load locale ${filename}!`, err);
        return HttpResponse.json({});
      }
    })
  );
  global.i18nServer.listen({ onUnhandledRequest: "error" });
  console.log("i18n MSW server listening!");

  return await importOriginal();
});

initVouchers();
initAchievements();
initStatsKeys();
initPokemonPrevolutions();
initBiomes();
initEggMoves();
initPokemonForms();
initSpecies();
initMoves();
initAbilities();
initLoggedInUser();
initMysteryEncounters();

global.testFailed = false;

beforeAll(() => {
  Object.defineProperty(document, "fonts", {
    writable: true,
    value: {
      add: () => {},
    },
  });
});

afterAll(() => {
  global.i18nServer.close();
  console.log("Closing i18n MSW server!");
});
