import { PokerogueDailyApi } from "#api/daily-api";
import { initServerForApiTests } from "#test/setup/test-file-initialization";
import { getApiBaseUrl } from "#test/utils/test-utils";
import { HttpResponse, http } from "msw";
import type { SetupServer } from "msw/node";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("Pokerogue Daily API", () => {
  const apiBase = getApiBaseUrl();
  const dailyApi = new PokerogueDailyApi(apiBase);
  let server: SetupServer;

  beforeAll(async () => {
    server = await initServerForApiTests();
  });

  afterEach(() => {
    server.resetHandlers();
  });

  beforeEach(() => {
    vi.spyOn(console, "warn");
  });

  describe("Get Seed", () => {
    it("should return seed string if successful", async () => {
      server.use(http.get(`${apiBase}/daily/seed`, () => HttpResponse.text("this-is-a-test-seed")));

      const seed = await dailyApi.getSeed();

      expect(seed).toBe("this-is-a-test-seed");
    });

    it("should return null and report a warning if there was an error", async () => {
      server.use(http.get(`${apiBase}/daily/seed`, () => HttpResponse.error()));

      const seed = await dailyApi.getSeed();

      expect(seed).toBeNull();
      expect(console.warn).toHaveBeenCalledWith("Could not get daily-run seed!", expect.any(Error));
    });
  });
});
