import { randInt } from "#app/utils.js";
import { http, HttpResponse } from "msw";

/**
 * Api mock handlers for `/daily` path
 */
export const mswDailyHandlers = (baseUrl: string) => [
  /**
   * Daily rankingpagecount
   */
  http.get(`${baseUrl}/daily/rankingpagecount`, async () => {
    return HttpResponse.text("1");
  }),
  /**
   * Daily rankings
   */
  http.get(`${baseUrl}/daily/rankings`, async () => {
    const rankings = Array.from({ length: 9 })
      .map((n: number) => ({
        username: `Player ${n + 1}`,
        score: randInt(99999),
        wave: randInt(99),
      }))
      .sort((a, b) => (a.score > b.score ? -1 : 1))
      .map((rank, i) => ({ ...rank, rank: i + 1 }));
    return HttpResponse.json(rankings);
  }),
];
