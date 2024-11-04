import type { GetDailyRankingsPageCountRequest, GetDailyRankingsRequest } from "#app/@types/PokerogueDailyApi";
import { PokerogueDailyApi } from "#app/plugins/api/pokerogue-daily-api";
import { getApiBaseUrl } from "#app/test/utils/testUtils";
import { ScoreboardCategory, type RankingEntry } from "#app/ui/daily-run-scoreboard";
import { http, HttpResponse } from "msw";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const apiBase = getApiBaseUrl();
const dailyApi = new PokerogueDailyApi(apiBase);
const { server } = global;

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
