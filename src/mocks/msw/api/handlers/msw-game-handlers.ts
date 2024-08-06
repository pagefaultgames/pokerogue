import { randInt } from "#app/utils.js";
import { http, HttpResponse } from "msw";

/**
 * Api mock handlers for `/game` path
 */
export const mswGameHandlers = (baseUrl: string) => [
  /**
   * Game titlestats
   */
  http.get(`${baseUrl}/game/titlestats`, async () => {
    const playerCount = randInt(999999);
    return HttpResponse.json({
      playerCount,
      battleCount: randInt(999999, playerCount),
    });
  }),
];
