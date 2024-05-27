import infoHandler from "#app/test/essentials/fetchHandlers/infoHandler";
import sessionHandler from "#app/test/essentials/fetchHandlers/sessionHandler";
import titlestatHandler from "#app/test/essentials/fetchHandlers/titlestatHandler";
import systemHandler from "#app/test/essentials/fetchHandlers/systemHandler";

export const MockFetch = (input, init) => {
  const url = typeof input === "string" ? input : input.url;

  let responseHandler;
  let responseText;

  const handlers = {
    "account/info": infoHandler,
    "savedata/session?slot=": sessionHandler,
    "savedata/system": systemHandler,
    "daily/rankingpagecount": { data: 0 },
    "game/titlestats": titlestatHandler,
    "daily/rankings": [],
  };


  for (const key of Object.keys(handlers)) {
    if (url.includes(key)) {
      responseHandler = async() => handlers[key];
      responseText = async() => JSON.stringify(handlers[key]);
      break;
    }
  }

  return Promise.resolve({
    ok: true,
    status: 200,
    json: responseHandler,
    text: responseText,
  });
};
