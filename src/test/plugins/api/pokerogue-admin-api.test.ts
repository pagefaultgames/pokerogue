import type { LinkAccountToDiscordIdRequest } from "#app/@types/PokerogueAdminApi";
import { PokerogueAdminApi } from "#app/plugins/api/pokerogue-admin-api";
import { getApiBaseUrl } from "#app/test/utils/testUtils";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

const apiBase = getApiBaseUrl();
const adminApi = new PokerogueAdminApi(apiBase);
const server = setupServer();

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
});

afterAll(() => {
  server.close();
});

afterEach(() => {
  server.resetHandlers();
});

describe("Pokerogue Admin API", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn");
  });

  describe("Link Account to Discord Title Stats", () => {
    const params: LinkAccountToDiscordIdRequest = { username: "test", discordId: "test-12575756" };

    it("should return true on SUCCESS", async () => {
      server.use(http.post(`${apiBase}/admin/account/discord-link`, () => HttpResponse.json(true)));

      const success = await adminApi.linkAccountToDiscord(params);

      expect(success).toBe(true);
    });

    it("should return false and report a warning on FAILURE", async () => {
      server.use(http.post(`${apiBase}/admin/account/discord-link`, () => new HttpResponse("", { status: 400 })));

      const success = await adminApi.linkAccountToDiscord(params);

      expect(success).toBe(false);
      expect(console.warn).toHaveBeenCalledWith("Could not link account with discord!", 400, "Bad Request");
    });

    it("should return false and report a warning on ERROR", async () => {
      server.use(http.post(`${apiBase}/admin/account/discord-link`, () => HttpResponse.error()));

      const success = await adminApi.linkAccountToDiscord(params);

      expect(success).toBe(false);
      expect(console.warn).toHaveBeenCalledWith("Could not link account with discord!", expect.any(Error));
    });
  });
});
