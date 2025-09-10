import { PokerogueDailyApi } from "#api/pokerogue-daily-api";
import { initServerForApiTests } from "#test/test-utils/test-file-initialization";
import { getApiBaseUrl } from "#test/test-utils/test-utils";
import type { GetDailyRankingsPageCountRequest, GetDailyRankingsRequest } from "#types/api/pokerogue-daily-api";
import { type RankingEntry, ScoreboardCategory } from "#ui/containers/daily-run-scoreboard";
import { HttpResponse, http } from "msw";
import type { SetupServerApi } from "msw/node";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const apiBase = getApiBaseUrl();
const dailyApi = new PokerogueDailyApi(apiBase);
let server: SetupServerApi;

beforeAll(async () => {
  server = await initServerForApiTests();
});

afterEach(() => {
  server.resetHandlers();
});

describe("Pokerogue Daily API", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn");
  });

  describe("Get Seed", () => {
    it("should return seed string on SUCCESS", async () => {
      server.use(http.get(`${apiBase}/daily/seed`, () => HttpResponse.text("this-is-a-test-seed")));

      const seed = await dailyApi.getSeed();

      expect(seed).toBe("this-is-a-test-seed");
    });

    it("should return null and report a warning on ERROR", async () => {
      server.use(http.get(`${apiBase}/daily/seed`, () => HttpResponse.error()));

      const seed = await dailyApi.getSeed();

      expect(seed).toBeNull();
      expect(console.warn).toHaveBeenCalledWith("Could not get daily-run seed!", expect.any(Error));
    });
  });

  describe("Get Rankings", () => {
    const params: GetDailyRankingsRequest = {
      category: ScoreboardCategory.DAILY,
    };

    it("should return ranking entries on SUCCESS", async () => {
      const expectedRankings: RankingEntry[] = [
        { rank: 1, score: 999, username: "Player 1", wave: 200 },
        { rank: 2, score: 10, username: "Player 2", wave: 1 },
      ];
      server.use(http.get(`${apiBase}/daily/rankings`, () => HttpResponse.json(expectedRankings)));

      const rankings = await dailyApi.getRankings(params);

      expect(rankings).toStrictEqual(expectedRankings);
    });

    it("should return null and report a warning on ERROR", async () => {
      server.use(http.get(`${apiBase}/daily/rankings`, () => HttpResponse.error()));

      const rankings = await dailyApi.getRankings(params);

      expect(rankings).toBeNull();
      expect(console.warn).toHaveBeenCalledWith("Could not get daily rankings!", expect.any(Error));
    });
  });

  describe("Get Rankings Page Count", () => {
    const params: GetDailyRankingsPageCountRequest = {
      category: ScoreboardCategory.DAILY,
    };

    it("should return a number on SUCCESS", async () => {
      server.use(http.get(`${apiBase}/daily/rankingpagecount`, () => HttpResponse.json(5)));

      const pageCount = await dailyApi.getRankingsPageCount(params);

      expect(pageCount).toBe(5);
    });

    it("should return 1 and report a warning on ERROR", async () => {
      server.use(http.get(`${apiBase}/daily/rankingpagecount`, () => HttpResponse.error()));

      const pageCount = await dailyApi.getRankingsPageCount(params);

      expect(pageCount).toBe(1);
      expect(console.warn).toHaveBeenCalledWith("Could not get daily rankings page count!", expect.any(Error));
    });
  });
});
