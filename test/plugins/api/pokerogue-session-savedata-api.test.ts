import { PokerogueSessionSavedataApi } from "#api/pokerogue-session-savedata-api";
import type { SessionSaveData } from "#system/game-data";
import { initServerForApiTests } from "#test/test-utils/test-file-initialization";
import { getApiBaseUrl } from "#test/test-utils/test-utils";
import type {
  ClearSessionSavedataRequest,
  ClearSessionSavedataResponse,
  DeleteSessionSavedataRequest,
  GetSessionSavedataRequest,
  NewClearSessionSavedataRequest,
  UpdateSessionSavedataRequest,
} from "#types/api/pokerogue-session-save-data-api";
import { HttpResponse, http } from "msw";
import type { SetupServerApi } from "msw/node";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const apiBase = getApiBaseUrl();
const sessionSavedataApi = new PokerogueSessionSavedataApi(apiBase);

let server: SetupServerApi;
beforeAll(async () => {
  server = await initServerForApiTests();
});

afterEach(() => {
  server.resetHandlers();
});

describe("Pokerogue Session Savedata API", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn");
  });

  describe("Newclear", () => {
    const params: NewClearSessionSavedataRequest = {
      clientSessionId: "test-session-id",
      isVictory: true,
      slot: 3,
    };

    it("should return true on SUCCESS", async () => {
      server.use(http.get(`${apiBase}/savedata/session/newclear`, () => HttpResponse.json(true)));

      const success = await sessionSavedataApi.newclear(params);

      expect(success).toBe(true);
    });

    it("should return false on FAILURE", async () => {
      server.use(http.get(`${apiBase}/savedata/session/newclear`, () => HttpResponse.json(false)));

      const success = await sessionSavedataApi.newclear(params);

      expect(success).toBe(false);
    });

    it("should return false and report a warning on ERROR", async () => {
      server.use(http.get(`${apiBase}/savedata/session/newclear`, () => HttpResponse.error()));

      await expect(sessionSavedataApi.newclear(params)).rejects.toThrow("Could not newclear session!");
      expect(console.warn).toHaveBeenCalledWith("Could not newclear session!", expect.any(Error));
    });
  });

  describe("Get ", () => {
    const params: GetSessionSavedataRequest = {
      clientSessionId: "test-session-id",
      slot: 3,
    };

    it("should return session-savedata string on SUCCESS", async () => {
      server.use(http.get(`${apiBase}/savedata/session/get`, () => HttpResponse.text("TEST SESSION SAVEDATA")));

      const savedata = await sessionSavedataApi.get(params);

      expect(savedata).toBe("TEST SESSION SAVEDATA");
    });

    it("should return null and report a warning on ERROR", async () => {
      server.use(http.get(`${apiBase}/savedata/session/get`, () => HttpResponse.error()));

      const savedata = await sessionSavedataApi.get(params);

      expect(savedata).toBeNull();
      expect(console.warn).toHaveBeenCalledWith("Could not get session savedata!", expect.any(Error));
    });
  });

  describe("Update", () => {
    const params: UpdateSessionSavedataRequest = {
      clientSessionId: "test-session-id",
      slot: 3,
      secretId: 9876543321,
      trainerId: 123456789,
    };

    it("should return an empty string on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/savedata/session/update`, () => HttpResponse.text(null)));

      const error = await sessionSavedataApi.update(params, "UPDATED SESSION SAVEDATA");

      expect(error).toBe("");
    });

    it("should return an error string on FAILURE", async () => {
      server.use(http.post(`${apiBase}/savedata/session/update`, () => HttpResponse.text("Failed to update!")));

      const error = await sessionSavedataApi.update(params, "UPDATED SESSION SAVEDATA");

      expect(error).toBe("Failed to update!");
    });

    it("should return 'Unknown Error!' and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/savedata/session/update`, () => HttpResponse.error()));

      const error = await sessionSavedataApi.update(params, "UPDATED SESSION SAVEDATA");

      expect(error).toBe("Unknown Error!");
      expect(console.warn).toHaveBeenCalledWith("Could not update session savedata!", expect.any(Error));
    });
  });

  describe("Delete", () => {
    const params: DeleteSessionSavedataRequest = {
      clientSessionId: "test-session-id",
      slot: 3,
    };

    it("should return null on SUCCESS", async () => {
      server.use(http.get(`${apiBase}/savedata/session/delete`, () => HttpResponse.text(null)));

      const error = await sessionSavedataApi.delete(params);

      expect(error).toBeNull();
    });

    it("should return an error string on FAILURE", async () => {
      server.use(
        http.get(`${apiBase}/savedata/session/delete`, () => new HttpResponse("Failed to delete!", { status: 400 })),
      );

      const error = await sessionSavedataApi.delete(params);

      expect(error).toBe("Failed to delete!");
    });

    it("should return 'Unknown error' and report a warning on ERROR", async () => {
      server.use(http.get(`${apiBase}/savedata/session/delete`, () => HttpResponse.error()));

      const error = await sessionSavedataApi.delete(params);

      expect(error).toBe("Unknown error");
      expect(console.warn).toHaveBeenCalledWith("Could not delete session savedata!", expect.any(Error));
    });
  });

  describe("Clear", () => {
    const params: ClearSessionSavedataRequest = {
      clientSessionId: "test-session-id",
      slot: 3,
      trainerId: 123456789,
    };

    it("should return sucess=true on SUCCESS", async () => {
      server.use(
        http.post(`${apiBase}/savedata/session/clear`, () =>
          HttpResponse.json<ClearSessionSavedataResponse>({
            success: true,
          }),
        ),
      );

      const { success, error } = await sessionSavedataApi.clear(params, {} as SessionSaveData);

      expect(success).toBe(true);
      expect(error).toBeUndefined();
    });

    it("should return sucess=false & an error string on FAILURE", async () => {
      server.use(
        http.post(`${apiBase}/savedata/session/clear`, () =>
          HttpResponse.json<ClearSessionSavedataResponse>({
            success: false,
            error: "Failed to clear!",
          }),
        ),
      );

      const { success, error } = await sessionSavedataApi.clear(params, {} as SessionSaveData);

      expect(error).toBe("Failed to clear!");
      expect(success).toBe(false);
    });

    it("should return success=false & error='Unknown error' and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/savedata/session/clear`, () => HttpResponse.error()));

      const { success, error } = await sessionSavedataApi.clear(params, {} as SessionSaveData);

      expect(error).toBe("Unknown error");
      expect(success).toBe(false);
    });
  });
});
