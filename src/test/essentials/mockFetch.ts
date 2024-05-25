const handleFetch = async () => ({
  data: "api data response",
});

export const MockFetch = (input, init) => {
  const url = typeof input === "string" ? input : input.url;

  let responseHandler;

  if (url.includes("api/data")) {
    responseHandler = handleFetch;
  } else if (url.includes("other/data")) {
    responseHandler = handleFetch;
  } else {
    responseHandler = async () => ({ data: "default response" });
  }

  return Promise.resolve({
    ok: true,
    status: 200,
    json: responseHandler,
    text: async () => JSON.stringify(await responseHandler()),
  });
};
