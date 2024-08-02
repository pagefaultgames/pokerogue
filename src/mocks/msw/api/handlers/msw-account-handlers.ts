import { http, HttpResponse } from "msw";

/**
 * Api mock handlers for `/account` path
 */
export const mswAccountHandlers = (baseUrl: string) => [
  /**
   * Account Info
   */
  http.get(`${baseUrl}/account/info`, async () => {
    return HttpResponse.json({
      username: "Guest",
    });
  }),
  /**
   * Account login
   */
  http.post(`${baseUrl}/account/login`, async () => {
    return HttpResponse.json({
      token: "this-is-your-session-token",
    });
  }),
  /**
   * Account logout
   */
  http.get(`${baseUrl}/account/logout`, async () => {
    return HttpResponse.text();
  }),
  /**
   * Account register
   */
  http.post(`${baseUrl}/account/register`, async ({ request }) => {
    return new HttpResponse("This is just a mocked API. Registration not possible!", {
      status: 500,
      statusText: "Internal Server Error",
    });
  }),
];
