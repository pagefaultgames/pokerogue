import { PokerogueAdminApi } from "#api/pokerogue-admin-api";
import { initServerForApiTests } from "#test/test-utils/test-file-initialization";
import { getApiBaseUrl } from "#test/test-utils/test-utils";
import type {
  LinkAccountToDiscordIdRequest,
  LinkAccountToGoogledIdRequest,
  SearchAccountRequest,
  SearchAccountResponse,
  UnlinkAccountFromDiscordIdRequest,
  UnlinkAccountFromGoogledIdRequest,
} from "#types/api/pokerogue-admin-api";
import { HttpResponse, http } from "msw";
import type { SetupServerApi } from "msw/node";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const apiBase = getApiBaseUrl();
const adminApi = new PokerogueAdminApi(apiBase);
let server: SetupServerApi;

beforeAll(async () => {
  server = await initServerForApiTests();
});

afterEach(() => {
  server.resetHandlers();
});

describe("Pokerogue Admin API", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn");
  });

  describe("Link Account to Discord", () => {
    const params: LinkAccountToDiscordIdRequest = {
      username: "test",
      discordId: "test-12575756",
    };

    it("should return null on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/admin/account/discordLink`, () => HttpResponse.json(true)));

      const success = await adminApi.linkAccountToDiscord(params);

      expect(success).toBeNull();
    });

    it("should return a ERR_GENERIC and report a warning on FAILURE", async () => {
      server.use(http.post(`${apiBase}/admin/account/discordLink`, () => new HttpResponse("", { status: 400 })));

      const success = await adminApi.linkAccountToDiscord(params);

      expect(success).toBe(adminApi.ERR_GENERIC);
      expect(console.warn).toHaveBeenCalledWith("Could not link account with discord!", 400, "Bad Request");
    });

    it("should return a ERR_USERNAME_NOT_FOUND and report a warning on 404", async () => {
      server.use(http.post(`${apiBase}/admin/account/discordLink`, () => new HttpResponse("", { status: 404 })));

      const success = await adminApi.linkAccountToDiscord(params);

      expect(success).toBe(adminApi.ERR_USERNAME_NOT_FOUND);
      expect(console.warn).toHaveBeenCalledWith("Could not link account with discord!", 404, "Not Found");
    });

    it("should return a ERR_GENERIC and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/admin/account/discordLink`, () => HttpResponse.error()));

      const success = await adminApi.linkAccountToDiscord(params);

      expect(success).toBe(adminApi.ERR_GENERIC);
      expect(console.warn).toHaveBeenCalledWith("Could not link account with discord!", expect.any(Error));
    });
  });

  describe("Unlink Account from Discord", () => {
    const params: UnlinkAccountFromDiscordIdRequest = {
      username: "test",
      discordId: "test-12575756",
    };

    it("should return null on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/admin/account/discordUnlink`, () => HttpResponse.json(true)));

      const success = await adminApi.unlinkAccountFromDiscord(params);

      expect(success).toBeNull();
    });

    it("should return a ERR_GENERIC and report a warning on FAILURE", async () => {
      server.use(http.post(`${apiBase}/admin/account/discordUnlink`, () => new HttpResponse("", { status: 400 })));

      const success = await adminApi.unlinkAccountFromDiscord(params);

      expect(success).toBe(adminApi.ERR_GENERIC);
      expect(console.warn).toHaveBeenCalledWith("Could not unlink account from discord!", 400, "Bad Request");
    });

    it("should return a ERR_USERNAME_NOT_FOUND and report a warning on 404", async () => {
      server.use(http.post(`${apiBase}/admin/account/discordUnlink`, () => new HttpResponse("", { status: 404 })));

      const success = await adminApi.unlinkAccountFromDiscord(params);

      expect(success).toBe(adminApi.ERR_USERNAME_NOT_FOUND);
      expect(console.warn).toHaveBeenCalledWith("Could not unlink account from discord!", 404, "Not Found");
    });

    it("should return a ERR_GENERIC and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/admin/account/discordUnlink`, () => HttpResponse.error()));

      const success = await adminApi.unlinkAccountFromDiscord(params);

      expect(success).toBe(adminApi.ERR_GENERIC);
      expect(console.warn).toHaveBeenCalledWith("Could not unlink account from discord!", expect.any(Error));
    });
  });

  describe("Link Account to Google", () => {
    const params: LinkAccountToGoogledIdRequest = {
      username: "test",
      googleId: "test-12575756",
    };

    it("should return null on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/admin/account/googleLink`, () => HttpResponse.json(true)));

      const success = await adminApi.linkAccountToGoogleId(params);

      expect(success).toBeNull();
    });

    it("should return a ERR_GENERIC and report a warning on FAILURE", async () => {
      server.use(http.post(`${apiBase}/admin/account/googleLink`, () => new HttpResponse("", { status: 400 })));

      const success = await adminApi.linkAccountToGoogleId(params);

      expect(success).toBe(adminApi.ERR_GENERIC);
      expect(console.warn).toHaveBeenCalledWith("Could not link account with google!", 400, "Bad Request");
    });

    it("should return a ERR_USERNAME_NOT_FOUND and report a warning on 404", async () => {
      server.use(http.post(`${apiBase}/admin/account/googleLink`, () => new HttpResponse("", { status: 404 })));

      const success = await adminApi.linkAccountToGoogleId(params);

      expect(success).toBe(adminApi.ERR_USERNAME_NOT_FOUND);
      expect(console.warn).toHaveBeenCalledWith("Could not link account with google!", 404, "Not Found");
    });

    it("should return a ERR_GENERIC and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/admin/account/googleLink`, () => HttpResponse.error()));

      const success = await adminApi.linkAccountToGoogleId(params);

      expect(success).toBe(adminApi.ERR_GENERIC);
      expect(console.warn).toHaveBeenCalledWith("Could not link account with google!", expect.any(Error));
    });
  });

  describe("Unlink Account from Google", () => {
    const params: UnlinkAccountFromGoogledIdRequest = {
      username: "test",
      googleId: "test-12575756",
    };

    it("should return null on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/admin/account/googleUnlink`, () => HttpResponse.json(true)));

      const success = await adminApi.unlinkAccountFromGoogleId(params);

      expect(success).toBeNull();
    });

    it("should return a ERR_GENERIC and report a warning on FAILURE", async () => {
      server.use(http.post(`${apiBase}/admin/account/googleUnlink`, () => new HttpResponse("", { status: 400 })));

      const success = await adminApi.unlinkAccountFromGoogleId(params);

      expect(success).toBe(adminApi.ERR_GENERIC);
      expect(console.warn).toHaveBeenCalledWith("Could not unlink account from google!", 400, "Bad Request");
    });

    it("should return a ERR_USERNAME_NOT_FOUND and report a warning on 404", async () => {
      server.use(http.post(`${apiBase}/admin/account/googleUnlink`, () => new HttpResponse("", { status: 404 })));

      const success = await adminApi.unlinkAccountFromGoogleId(params);

      expect(success).toBe(adminApi.ERR_USERNAME_NOT_FOUND);
      expect(console.warn).toHaveBeenCalledWith("Could not unlink account from google!", 404, "Not Found");
    });

    it("should return a ERR_GENERIC and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/admin/account/googleUnlink`, () => HttpResponse.error()));

      const success = await adminApi.unlinkAccountFromGoogleId(params);

      expect(success).toBe(adminApi.ERR_GENERIC);
      expect(console.warn).toHaveBeenCalledWith("Could not unlink account from google!", expect.any(Error));
    });
  });

  describe("Search Account", () => {
    const params: SearchAccountRequest = { username: "test" };

    it("should return [data, undefined] on SUCCESS", async () => {
      const responseData: SearchAccountResponse = {
        username: "test",
        discordId: "discord-test-123",
        googleId: "google-test-123",
        lastLoggedIn: "2022-01-01",
        registered: "2022-01-01",
      };
      server.use(http.get(`${apiBase}/admin/account/adminSearch`, () => HttpResponse.json(responseData)));

      const [data, err] = await adminApi.searchAccount(params);

      expect(data).toStrictEqual(responseData);
      expect(err).toBeUndefined();
    });

    it("should return [undefined, ERR_GENERIC] and report a warning on on FAILURE", async () => {
      server.use(http.get(`${apiBase}/admin/account/adminSearch`, () => new HttpResponse("", { status: 400 })));

      const [data, err] = await adminApi.searchAccount(params);

      expect(data).toBeUndefined();
      expect(err).toBe(adminApi.ERR_GENERIC);
      expect(console.warn).toHaveBeenCalledWith("Could not find account!", 400, "Bad Request");
    });

    it("should return [undefined, ERR_USERNAME_NOT_FOUND] and report a warning on on 404", async () => {
      server.use(http.get(`${apiBase}/admin/account/adminSearch`, () => new HttpResponse("", { status: 404 })));

      const [data, err] = await adminApi.searchAccount(params);

      expect(data).toBeUndefined();
      expect(err).toBe(adminApi.ERR_USERNAME_NOT_FOUND);
      expect(console.warn).toHaveBeenCalledWith("Could not find account!", 404, "Not Found");
    });

    it("should return [undefined, ERR_GENERIC] and report a warning on on ERROR", async () => {
      server.use(http.get(`${apiBase}/admin/account/adminSearch`, () => HttpResponse.error()));

      const [data, err] = await adminApi.searchAccount(params);

      expect(data).toBeUndefined();
      expect(err).toBe(adminApi.ERR_GENERIC);
      expect(console.warn).toHaveBeenCalledWith("Could not find account!", expect.any(Error));
    });
  });
});
