import * as BattleScene from "#app/battle-scene";
import { pokerogueApi } from "#app/plugins/api/pokerogue-api";
import { SessionSaveData } from "#app/system/game-data";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as account from "../../account";

describe("System - Game Data", () => {
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
      .moveset([ Moves.SPLASH ])
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  afterEach(() => {
    game.phaseInterceptor.restoreOg();
  });

  describe("tryClearSession", () => {
    beforeEach(() => {
      vi.spyOn(BattleScene, "bypassLogin", "get").mockReturnValue(false);
      vi.spyOn(game.scene.gameData, "getSessionSaveData").mockReturnValue({} as SessionSaveData);
      vi.spyOn(account, "updateUserInfo").mockImplementation(async () => [ true, 1 ]);
    });

    it("should return [true, true] if bypassLogin is true", async () => {
      vi.spyOn(BattleScene, "bypassLogin", "get").mockReturnValue(true);

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([ true, true ]);
    });

    it("should return [true, true] if successful", async () => {
      vi.spyOn(pokerogueApi.savedata.session, "clear").mockResolvedValue({ success: true });

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([ true, true ]);
      expect(account.updateUserInfo).toHaveBeenCalled();
    });

    it("should return [true, false] if not successful", async () => {
      vi.spyOn(pokerogueApi.savedata.session, "clear").mockResolvedValue({ success: false });

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([ true, false ]);
      expect(account.updateUserInfo).toHaveBeenCalled();
    });

    it("should return [false, false] session is out of date", async () => {
      vi.spyOn(pokerogueApi.savedata.session, "clear").mockResolvedValue({ error: "session out of date" });

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([ false, false ]);
      expect(account.updateUserInfo).toHaveBeenCalled();
    });
  });
});
