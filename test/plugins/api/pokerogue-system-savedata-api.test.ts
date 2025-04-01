import type {
  GetSystemSavedataRequest,
  UpdateSystemSavedataRequest,
  VerifySystemSavedataRequest,
  VerifySystemSavedataResponse,
} from "#app/@types/PokerogueSystemSavedataApi";
import { PokerogueSystemSavedataApi } from "#app/plugins/api/pokerogue-system-savedata-api";
import type { SystemSaveData } from "#app/system/game-data";
import { initServerForApiTests } from "#test/testUtils/testFileInitialization";
import { getApiBaseUrl } from "#test/testUtils/testUtils";
import { http, HttpResponse } from "msw";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { SetupServerApi } from "msw/node";

const apiBase = getApiBaseUrl();
const systemSavedataApi = new PokerogueSystemSavedataApi(getApiBaseUrl());

let server: SetupServerApi;

beforeAll(async () => {
  server = await initServerForApiTests();
});

afterEach(() => {
  server.resetHandlers();
});

describe("Pokerogue System Savedata API", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn");
  });

  describe("Get", () => {
    const params: GetSystemSavedataRequest = {
      clientSessionId: "test-session-id",
    };

    it("should return system-savedata string on SUCCESS", async () => {
      server.use(http.get(`${apiBase}/savedata/system/get`, () => HttpResponse.text("TEST SYSTEM SAVEDATA")));

      const savedata = await systemSavedataApi.get(params);

      expect(savedata).toBe("TEST SYSTEM SAVEDATA");
    });

    it("should return null and report a warning on ERROR", async () => {
      server.use(http.get(`${apiBase}/savedata/system/get`, () => HttpResponse.error()));

      const savedata = await systemSavedataApi.get(params);

      expect(savedata).toBeNull();
      expect(console.warn).toHaveBeenCalledWith("Could not get system savedata!", expect.any(Error));
    });
  });

  describe("Verify", () => {
    const params: VerifySystemSavedataRequest = {
      clientSessionId: "test-session-id",
    };

    it("should return null on SUCCESS", async () => {
      server.use(
        http.get(`${apiBase}/savedata/system/verify`, () =>
          HttpResponse.json<VerifySystemSavedataResponse>({
            systemData: {
              trainerId: 123456789,
            } as SystemSaveData,
            valid: true,
          }),
        ),
      );

      const savedata = await systemSavedataApi.verify(params);

      expect(savedata).toBeNull();
    });

    it("should return system-savedata and report a warning on FAILURE", async () => {
      server.use(
        http.get(`${apiBase}/savedata/system/verify`, () =>
          HttpResponse.json<VerifySystemSavedataResponse>({
            systemData: {
              trainerId: 123456789,
            } as SystemSaveData,
            valid: false,
          }),
        ),
      );

      const savedata = await systemSavedataApi.verify(params);

      expect(savedata?.trainerId).toBe(123456789);
      expect(console.warn).toHaveBeenCalledWith("Invalid system savedata!");
    });
  });

  describe("Update", () => {
    const params: UpdateSystemSavedataRequest = {
      clientSessionId: "test-session-id",
      secretId: 9876543321,
      trainerId: 123456789,
    };

    it("should return an empty string on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/savedata/system/update`, () => HttpResponse.text(null)));

      const error = await systemSavedataApi.update(params, "UPDATED SYSTEM SAVEDATA");

      expect(error).toBe("");
    });

    it("should return an error string on FAILURE", async () => {
      server.use(http.post(`${apiBase}/savedata/system/update`, () => HttpResponse.text("Failed to update!")));

      const error = await systemSavedataApi.update(params, "UPDATED SYSTEM SAVEDATA");

      expect(error).toBe("Failed to update!");
    });

    it("should return 'Unknown Error' and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/savedata/system/update`, () => HttpResponse.error()));

      const error = await systemSavedataApi.update(params, "UPDATED SYSTEM SAVEDATA");

      expect(error).toBe("Unknown Error");
      expect(console.warn).toHaveBeenCalledWith("Could not update system savedata!", expect.any(Error));
    });
  });
});
