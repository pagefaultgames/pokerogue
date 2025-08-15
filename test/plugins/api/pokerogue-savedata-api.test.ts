import { PokerogueSavedataApi } from "#api/pokerogue-savedata-api";
import { initServerForApiTests } from "#test/test-utils/test-file-initialization";
import { getApiBaseUrl } from "#test/test-utils/test-utils";
import type { UpdateAllSavedataRequest } from "#types/api/pokerogue-save-data-api";
import { HttpResponse, http } from "msw";
import type { SetupServerApi } from "msw/node";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const apiBase = getApiBaseUrl();
const savedataApi = new PokerogueSavedataApi(apiBase);
let server: SetupServerApi;

beforeAll(async () => {
  server = await initServerForApiTests();
});

afterEach(() => {
  server.resetHandlers();
});

describe("Pokerogue Savedata API", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn");
  });

  describe("Update All", () => {
    it("should return an empty string on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/savedata/updateall`, () => HttpResponse.text(null)));

      const error = await savedataApi.updateAll({} as UpdateAllSavedataRequest);

      expect(error).toBe("");
    });

    it("should return an error message on FAILURE", async () => {
      server.use(http.post(`${apiBase}/savedata/updateall`, () => HttpResponse.text("Failed to update all!")));

      const error = await savedataApi.updateAll({} as UpdateAllSavedataRequest);

      expect(error).toBe("Failed to update all!");
    });

    it("should return 'Unknown error' and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/savedata/updateall`, () => HttpResponse.error()));

      const error = await savedataApi.updateAll({} as UpdateAllSavedataRequest);

      expect(error).toBe("Unknown error");
      expect(console.warn).toHaveBeenCalledWith("Could not update all savedata!", expect.any(Error));
    });
  });
});
