import { pokerogueApi } from "#api/pokerogue-api";
import { initLoggedInUser, loggedInUser, updateUserInfo } from "#app/account";
import * as bypassLogin from "#app/global-vars/bypass-login";
import { describe, expect, it, vi } from "vitest";

describe("account", () => {
  describe("initLoggedInUser", () => {
    it("should set loggedInUser to Guest and lastSessionSlot to -1", () => {
      initLoggedInUser();

      expect(loggedInUser!.username).toBe("Guest");
      expect(loggedInUser!.lastSessionSlot).toBe(-1);
    });
  });

  describe("updateUserInfo", () => {
    it("should set loggedInUser! to Guest if bypassLogin is true", async () => {
      vi.spyOn(bypassLogin, "bypassLogin", "get").mockReturnValue(true);

      const [success, status] = await updateUserInfo();

      expect(success).toBe(true);
      expect(status).toBe(200);
      expect(loggedInUser!.username).toBe("Guest");
      expect(loggedInUser!.lastSessionSlot).toBe(-1);
    });

    it("should fetch user info from the API if bypassLogin is false", async () => {
      vi.spyOn(bypassLogin, "bypassLogin", "get").mockReturnValue(false);
      vi.spyOn(pokerogueApi.account, "getInfo").mockResolvedValue([
        {
          username: "test",
          lastSessionSlot: 99,
          discordId: "",
          googleId: "",
          hasAdminRole: false,
        },
        200,
      ]);

      const [success, status] = await updateUserInfo();

      expect(success).toBe(true);
      expect(status).toBe(200);
      expect(loggedInUser!.username).toBe("test");
      expect(loggedInUser!.lastSessionSlot).toBe(99);
    });

    it("should handle resolved API errors", async () => {
      vi.spyOn(bypassLogin, "bypassLogin", "get").mockReturnValue(false);
      vi.spyOn(pokerogueApi.account, "getInfo").mockResolvedValue([null, 401]);

      const [success, status] = await updateUserInfo();

      expect(success).toBe(false);
      expect(status).toBe(401);
    });

    it("should handle 500 API errors", async () => {
      vi.spyOn(bypassLogin, "bypassLogin", "get").mockReturnValue(false);
      vi.spyOn(pokerogueApi.account, "getInfo").mockResolvedValue([null, 500]);

      const [success, status] = await updateUserInfo();

      expect(success).toBe(false);
      expect(status).toBe(500);
    });
  });
});
