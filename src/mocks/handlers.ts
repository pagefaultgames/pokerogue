import { randInt } from "#app/utils.js";
import { http, HttpResponse } from "msw";
import systemClientSession from "./data/system-client-session.json";

export const handlers = [
  http.post("https://api.pokerogue.net/account/login", async () => {
    return HttpResponse.json({
      token: "this-is-your-session-token",
    });
  }),
  http.get("https://api.pokerogue.net/account/info", async () => {
    return HttpResponse.json({
      username: "guest",
    });
  }),
  http.get("https://api.pokerogue.net/savedata/system", async () => {
    return HttpResponse.json(systemClientSession);
  }),
  http.get("https://api.pokerogue.net/savedata/session", async () => {
    return HttpResponse.text();
  }),
  http.get("https://api.pokerogue.net/daily/rankingpagecount", async () => {
    return HttpResponse.text("1");
  }),
  http.get("https://api.pokerogue.net/daily/rankings", async () => {
    const rankings = [...Array(9)]
      .map((_, i) => ({
        username: `Player ${i + 1}`,
        score: randInt(99999),
        wave: randInt(99),
      }))
      .sort((a, b) => (a.score > b.score ? -1 : 1))
      .map((rank, i) => ({ ...rank, rank: i + 1 }));
    return HttpResponse.json(rankings);
  }),
  http.get("https://api.pokerogue.net/game/titlestats", async () => {
    const playerCount = randInt(999999);
    return HttpResponse.json({
      playerCount,
      battleCount: randInt(999999, playerCount),
    });
  }),
  http.get("https://api.pokerogue.net/account/logout", async () => {
    return HttpResponse.text();
  }),
  http.post(
    "https://api.pokerogue.net/account/register",
    async ({ request }) => {
      console.log(request);
      return new HttpResponse("This is just localhost!", {
        status: 500,
        statusText: "Internal Server Error",
      });
    }
  ),
  http.post("https://api.pokerogue.net/savedata/update", async () => {
    return HttpResponse.text(); // right?
  }),
];
