import * as account from "#app/account";
import * as bypassLoginModule from "#app/global-vars/bypass-login";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";
import type { SessionSaveData } from "#app/system/game-data";
import { AbilityId } from "#enums/ability-id";
import { MoveId } from "#enums/move-id";
import { GameManager } from "#test/test-utils/game-manager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("System - Rename Run", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .moveset([MoveId.SPLASH])
      .battleStyle("single")
      .enemyAbility(AbilityId.BALL_FETCH)
      .enemyMoveset(MoveId.SPLASH);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  describe("renameSession", () => {
    beforeEach(() => {
      vi.spyOn(bypassLoginModule, "bypassLogin", "get").mockReturnValue(false);
      vi.spyOn(account, "updateUserInfo").mockImplementation(async () => [true, 1]);
    });

    it("should return false if slotId < 0", async () => {
      const result = await game.scene.gameData.renameSession(-1, "Named Run");

      expect(result).toEqual(false);
    });

    it("should return false if getSession returns null", async () => {
      vi.spyOn(game.scene.gameData, "getSession").mockResolvedValue(null as unknown as SessionSaveData);

      const result = await game.scene.gameData.renameSession(-1, "Named Run");

      expect(result).toEqual(false);
    });

    it("should return true if bypassLogin is true", async () => {
      vi.spyOn(bypassLoginModule, "bypassLogin", "get").mockReturnValue(true);
      vi.spyOn(game.scene.gameData, "getSession").mockResolvedValue({} as SessionSaveData);

      const result = await game.scene.gameData.renameSession(0, "Named Run");

      expect(result).toEqual(true);
    });

    it("should return false if api returns error", async () => {
      vi.spyOn(game.scene.gameData, "getSession").mockResolvedValue({} as SessionSaveData);
      vi.spyOn(pokerogueApi.savedata.session, "update").mockResolvedValue("Unknown Error!");

      const result = await game.scene.gameData.renameSession(0, "Named Run");

      expect(result).toEqual(false);
    });

    it("should return true if api is succesfull", async () => {
      vi.spyOn(game.scene.gameData, "getSession").mockResolvedValue({} as SessionSaveData);
      vi.spyOn(pokerogueApi.savedata.session, "update").mockResolvedValue("");

      const result = await game.scene.gameData.renameSession(0, "Named Run");

      expect(result).toEqual(true);
      expect(account.updateUserInfo).toHaveBeenCalled();
    });
  });
});
