// TODO: Avoid hardcoding these endpoints and move them somewhere shared with the API code
// TODO: Better yet, use dependency injection to inject a mock API client instead of stubbing out fetch directly
const handlers = {
  "account/info": { username: "greenlamp", lastSessionSlot: 0 },
  "savedata/session": {},
  "savedata/system": {},
  "savedata/updateall": "",
  "daily/rankingpagecount": { data: 0 },
  "game/titlestats": { playerCount: 0, battleCount: 5 },
  "daily/rankings": [],
};

export const MockFetch: typeof globalThis.fetch = async (
  input: string | URL | Request,
  _init?: RequestInit | undefined,
) => {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
  const cannedResponse = Object.entries(handlers).find(([key]) => url.includes(key))?.[1];

  return Response.json(cannedResponse, { status: 200, statusText: "OK" });
};
