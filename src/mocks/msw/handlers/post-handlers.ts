import { http, HttpResponse } from "msw";

const baseUrl = import.meta.env.VITE_SERVER_URL ?? "https://api.pokerogue.net";

export const postHandlers = [
  http.post(`${baseUrl}/account/login`, async () => {
    return HttpResponse.json({
      token: "this-is-your-session-token",
    });
  }),
  http.post(
    `${baseUrl}/account/register`,
    async ({ request }) => {
      console.log(request);
      return new HttpResponse("This is just localhost!", {
        status: 500,
        statusText: "Internal Server Error",
      });
    }
  ),
  http.post(`${baseUrl}/savedata/update`, async () => {
    return HttpResponse.text(); // right?
  }),
];
