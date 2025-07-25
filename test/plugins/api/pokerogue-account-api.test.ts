import { PokerogueAccountApi } from "#api/pokerogue-account-api";
import { SESSION_ID_COOKIE_NAME } from "#app/constants";
import { initServerForApiTests } from "#test/test-utils/test-file-initialization";
import { getApiBaseUrl } from "#test/test-utils/test-utils";
import type { AccountInfoResponse } from "#types/api/pokerogue-account-api";
import * as CookieUtils from "#utils/cookies";
import * as cookies from "#utils/cookies";
import { HttpResponse, http } from "msw";
import type { SetupServerApi } from "msw/node";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const apiBase = getApiBaseUrl();
const accountApi = new PokerogueAccountApi(apiBase);
let server: SetupServerApi;

beforeAll(async () => {
  server = await initServerForApiTests();
});

afterEach(() => {
  server.resetHandlers();
});

describe("Pokerogue Account API", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn");
  });

  describe("Get Info", () => {
    it("should return account-info & 200 on SUCCESS", async () => {
      const expectedAccountInfo: AccountInfoResponse = {
        username: "test",
        lastSessionSlot: -1,
        discordId: "23235353543535",
        googleId: "1ed1d1d11d1d1d1d1d1",
        hasAdminRole: false,
      };
      server.use(http.get(`${apiBase}/account/info`, () => HttpResponse.json(expectedAccountInfo)));

      const [accountInfo, status] = await accountApi.getInfo();

      expect(accountInfo).toEqual(expectedAccountInfo);
      expect(status).toBe(200);
    });

    it("should return null + status-code anad report a warning on FAILURE", async () => {
      server.use(http.get(`${apiBase}/account/info`, () => new HttpResponse("", { status: 401 })));

      const [accountInfo, status] = await accountApi.getInfo();

      expect(accountInfo).toBeNull();
      expect(status).toBe(401);
      expect(console.warn).toHaveBeenCalledWith("Could not get account info!", 401, "Unauthorized");
    });

    it("should return null + 500 anad report a warning on ERROR", async () => {
      server.use(http.get(`${apiBase}/account/info`, () => HttpResponse.error()));

      const [accountInfo, status] = await accountApi.getInfo();

      expect(accountInfo).toBeNull();
      expect(status).toBe(500);
      expect(console.warn).toHaveBeenCalledWith("Could not get account info!", expect.any(Error));
    });
  });

  describe("Register", () => {
    const registerParams = { username: "test", password: "test" };

    it("should return null on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/account/register`, () => HttpResponse.text()));

      const error = await accountApi.register(registerParams);

      expect(error).toBeNull();
    });

    it("should return error message on FAILURE", async () => {
      server.use(
        http.post(`${apiBase}/account/register`, () => new HttpResponse("Username is already taken", { status: 400 })),
      );

      const error = await accountApi.register(registerParams);

      expect(error).toBe("Username is already taken");
    });

    it('should return "Unknown error" and report a warning on ERROR', async () => {
      server.use(http.post(`${apiBase}/account/register`, () => HttpResponse.error()));

      const error = await accountApi.register(registerParams);

      expect(error).toBe("Unknown error!");
      expect(console.warn).toHaveBeenCalledWith("Register failed!", expect.any(Error));
    });
  });

  describe("Login", () => {
    const loginParams = { username: "test", password: "test" };

    it("should return null and set the cookie on SUCCESS", async () => {
      vi.spyOn(CookieUtils, "setCookie");
      server.use(http.post(`${apiBase}/account/login`, () => HttpResponse.json({ token: "abctest" })));

      const error = await accountApi.login(loginParams);

      expect(error).toBeNull();
      expect(cookies.setCookie).toHaveBeenCalledWith(SESSION_ID_COOKIE_NAME, "abctest");
    });

    it("should return error message and report a warning on FAILURE", async () => {
      server.use(
        http.post(`${apiBase}/account/login`, () => new HttpResponse("Password is incorrect", { status: 401 })),
      );

      const error = await accountApi.login(loginParams);

      expect(error).toBe("Password is incorrect");
      expect(console.warn).toHaveBeenCalledWith("Login failed!", 401, "Unauthorized");
    });

    it('should return "Unknown error" and report a warning on ERROR', async () => {
      server.use(http.post(`${apiBase}/account/login`, () => HttpResponse.error()));

      const error = await accountApi.login(loginParams);

      expect(error).toBe("Unknown error!");
      expect(console.warn).toHaveBeenCalledWith("Login failed!", expect.any(Error));
    });
  });

  describe("Logout", () => {
    beforeEach(() => {
      vi.spyOn(CookieUtils, "removeCookie");
    });

    it("should remove cookie on success", async () => {
      vi.spyOn(CookieUtils, "setCookie");
      server.use(http.get(`${apiBase}/account/logout`, () => new HttpResponse("", { status: 200 })));

      await accountApi.logout();

      expect(cookies.removeCookie).toHaveBeenCalledWith(SESSION_ID_COOKIE_NAME);
    });

    it("should report a warning on and remove cookie on FAILURE", async () => {
      server.use(http.get(`${apiBase}/account/logout`, () => new HttpResponse("", { status: 401 })));

      await accountApi.logout();

      expect(cookies.removeCookie).toHaveBeenCalledWith(SESSION_ID_COOKIE_NAME);
      expect(console.warn).toHaveBeenCalledWith("Log out failed!", expect.any(Error));
    });

    it("should report a warning on and remove cookie on ERROR", async () => {
      server.use(http.get(`${apiBase}/account/logout`, () => HttpResponse.error()));

      await accountApi.logout();

      expect(cookies.removeCookie).toHaveBeenCalledWith(SESSION_ID_COOKIE_NAME);
      expect(console.warn).toHaveBeenCalledWith("Log out failed!", expect.any(Error));
    });
  });
});
