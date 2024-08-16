import { http, HttpResponse } from "msw";
import everythingJson from "../data/everything.json";

/**
 * Api mock handlers for `/savedata` path
 */
export const mswSavedataHandlers = (baseUrl: string) => [
  /**
   * Savedata system
   */
  http.get(`${baseUrl}/savedata/system/get`, async () => {
    try {
      const lsData = localStorage.getItem("data_Guest") ?? "";
      const data = atob(lsData);
      const json = JSON.parse(data);
      return HttpResponse.json(json);
    } catch (e) {
      console.warn("Failed to load localStorage data. Falling back to everything.json", e);
      return HttpResponse.json(everythingJson); // make sure that the localhost data is loaded
    }
  }),
  /**
   * Savedata session
   */
  http.get(`${baseUrl}/savedata/session/get`, async ({ request }) => {
    console.log(`${baseUrl}/savedata/session/get`, request);
    const { searchParams } = new URL(request.url);
    const slot = searchParams.get("slot");
    const lsData = localStorage.getItem(`sessionData${slot}_Guest`);

    return HttpResponse.text(lsData ?? null);
  }),
  /**
   * Savedata update
   */
  http.post(`${baseUrl}/savedata/updateAll`, async () => {
    return HttpResponse.text(); // right?
  }),
  /**
   * Savedata verify
   */
  http.get(`${baseUrl}/savedata/system/verify`, async () => {
    return HttpResponse.json({
      valid: true,
    });
  }),
];
