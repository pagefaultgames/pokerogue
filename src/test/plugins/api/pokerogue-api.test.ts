import type { TitleStatsResponse } from "#app/@types/PokerogueApi";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";
import { getApiBaseUrl } from "#app/test/utils/testUtils";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiBase = getApiBaseUrl();
const { server } = global;

afterEach(() => {
  server.resetHandlers();
});

describe("Pokerogue API", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn");
  });

  describe("Game Title Stats", () => {
    const expectedTitleStats: TitleStatsResponse = {
      playerCount: 9999999,
      battleCount: 9999999,
    };

    it("should return the stats on SUCCESS", async () => {
      server.use(http.get(`${apiBase}/game/titlestats`, () => HttpResponse.json(expectedTitleStats)));

      const titleStats = await pokerogueApi.getGameTitleStats();

      expect(titleStats).toEqual(expectedTitleStats);
    });

    it("should return null and report a warning on ERROR", async () => {
      server.use(http.get(`${apiBase}/game/titlestats`, () => HttpResponse.error()));
      const titleStats = await pokerogueApi.getGameTitleStats();

      expect(titleStats).toBeNull();
      expect(console.warn).toHaveBeenCalledWith("Could not get game title stats!", expect.any(Error));
    });
  });

  describe("Unlink Discord", () => {
    it("should return true on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/auth/discord/logout`, () => new HttpResponse("", { status: 200 })));

      const success = await pokerogueApi.unlinkDiscord();

      expect(success).toBe(true);
    });

    it("should return false and report a warning on FAILURE", async () => {
      server.use(http.post(`${apiBase}/auth/discord/logout`, () => new HttpResponse("", { status: 401 })));

      const success = await pokerogueApi.unlinkDiscord();

      expect(success).toBe(false);
      expect(console.warn).toHaveBeenCalledWith("Discord unlink failed (401: Unauthorized)");
    });

    it("should return false and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/auth/discord/logout`, () => HttpResponse.error()));

      const success = await pokerogueApi.unlinkDiscord();

      expect(success).toBe(false);
      expect(console.warn).toHaveBeenCalledWith("Could not unlink Discord!", expect.any(Error));
    });
  });

  describe("Unlink Google", () => {
    it("should return true on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/auth/google/logout`, () => new HttpResponse("", { status: 200 })));

      const success = await pokerogueApi.unlinkGoogle();

      expect(success).toBe(true);
    });

    it("should return false and report a warning on FAILURE", async () => {
      server.use(http.post(`${apiBase}/auth/google/logout`, () => new HttpResponse("", { status: 401 })));

      const success = await pokerogueApi.unlinkGoogle();

      expect(success).toBe(false);
      expect(console.warn).toHaveBeenCalledWith("Google unlink failed (401: Unauthorized)");
    });

    it("should return false and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/auth/google/logout`, () => HttpResponse.error()));

      const success = await pokerogueApi.unlinkGoogle();

      expect(success).toBe(false);
      expect(console.warn).toHaveBeenCalledWith("Could not unlink Google!", expect.any(Error));
    });
  });
});
