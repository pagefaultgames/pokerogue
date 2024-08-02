import { randInt } from "#app/utils.js";
import { http, HttpResponse } from "msw";
import everythingPrsv from "../test/utils/saves/everything.prsv?raw";

const baseUrl = import.meta.env.VITE_SERVER_URL ?? "https://api.pokerogue.net";

export const getHandlers = [
  http.get(`${baseUrl}/account/info`, async () => {
    return HttpResponse.json({
      username: "guest",
    });
  }),
  http.get(`${baseUrl}/savedata/system`, async () => {
    return HttpResponse.text(everythingPrsv);
  }),
  http.get(`${baseUrl}/savedata/session`, async () => {
    return HttpResponse.text();
  }),
  http.get(`${baseUrl}/daily/rankingpagecount`, async () => {
    return HttpResponse.text("1");
  }),
  http.get(`${baseUrl}/daily/rankings`, async () => {
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
  http.get(`${baseUrl}/game/titlestats`, async () => {
    const playerCount = randInt(999999);
    return HttpResponse.json({
      playerCount,
      battleCount: randInt(999999, playerCount),
    });
  }),
  http.get(`${baseUrl}/account/logout`, async () => {
    return HttpResponse.text();
  }),
];
