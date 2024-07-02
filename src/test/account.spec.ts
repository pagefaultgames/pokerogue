import * as battleScene from "#app/battle-scene.js";
import { describe, expect, it, vi } from "vitest";
import { loggedInUser, updateUserInfo } from "../account";
import * as utils from "../utils";

describe("account", () => {
  describe("updateUserInfo", () => {
    it("should set loggedInUser to Guest if bypassLogin is true", async () => {
      vi.spyOn(battleScene, "bypassLogin", "get").mockReturnValue(true);

      await updateUserInfo();

      expect(loggedInUser.username).toBe("Guest");
      expect(loggedInUser.lastSessionSlot).toBe(-1);
    });

    it("should fetch user info from the API if bypassLogin is false", async () => {
      const apiFetchSpy = vi.spyOn(utils, "apiFetch");
      apiFetchSpy.mockResolvedValue(
        new Response(
          JSON.stringify({
            username: "test",
            lastSessionSlot: 99,
          }),
          {
            status: 200,
          }
        )
      );
      vi.spyOn(battleScene, "bypassLogin", "get").mockReturnValue(false);

      const [success, status] = await updateUserInfo();

      expect(success).toBe(true);
      expect(status).toBe(200);
      expect(loggedInUser.username).toBe("test");
      expect(loggedInUser.lastSessionSlot).toBe(99);
    });

    it("should handle API errors", async () => {
      const apiFetchSpy = vi.spyOn(utils, "apiFetch");
      apiFetchSpy.mockResolvedValue(new Response(null, { status: 500 }));
      vi.spyOn(battleScene, "bypassLogin", "get").mockReturnValue(false);

      const [success, status] = await updateUserInfo();

      expect(success).toBe(false);
      expect(status).toBe(500);
    });
  });
});
