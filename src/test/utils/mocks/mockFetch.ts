export const MockFetch = (input, init) => {
  const url = typeof input === "string" ? input : input.url;

  let responseHandler;
  let responseText;

  const handlers = {
    "account/info": {"username":"greenlamp", "lastSessionSlot":0},
    "savedata/session": {},
    "savedata/system": {},
    "savedata/updateall": "",
    "daily/rankingpagecount": { data: 0 },
    "game/titlestats": {"playerCount":0, "battleCount":5},
    "daily/rankings": [],
  };


  for (const key of Object.keys(handlers)) {
    if (url.includes(key)) {
      responseHandler = async() => handlers[key];
      responseText = async() => handlers[key] ? JSON.stringify(handlers[key]) : handlers[key];
      break;
    }
  }

  const response: Partial<Response> = {
    ok: true,
    status: 200,
    json: responseHandler,
    text: responseText,
    headers: new Headers({}),
  };

  return Promise.resolve(response);
};
