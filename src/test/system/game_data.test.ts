import * as BattleScene from "#app/battle-scene";
import { SessionSaveData } from "#app/system/game-data";
import { Abilities } from "#enums/abilities";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import Phaser from "phaser";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as account from "../../account";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001";

export const server = setupServer();

describe("System - Game Data", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    server.listen();
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override
      .moveset([Moves.SPLASH])
      .battleType("single")
      .enemyAbility(Abilities.BALL_FETCH)
      .enemyMoveset(Moves.SPLASH);
  });

  afterEach(() => {
    server.resetHandlers();
    game.phaseInterceptor.restoreOg();
  });

  describe("tryClearSession", () => {
    beforeEach(() => {
      vi.spyOn(BattleScene, "bypassLogin", "get").mockReturnValue(false);
      vi.spyOn(game.scene.gameData, "getSessionSaveData").mockReturnValue({} as SessionSaveData);
      vi.spyOn(account, "updateUserInfo").mockImplementation(async () => [true, 1]);
    });

    it("should return [true, true] if bypassLogin is true", async () => {
      vi.spyOn(BattleScene, "bypassLogin", "get").mockReturnValue(true);

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([true, true]);
    });

    it("should return [true, true] if successful", async () => {
      server.use(http.post(`${apiBase}/savedata/session/clear`, () => HttpResponse.json({ success: true })));

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([true, true]);
      expect(account.updateUserInfo).toHaveBeenCalled();
    });

    it("should return [true, false] if not successful", async () => {
      server.use(http.post(`${apiBase}/savedata/session/clear`, () => HttpResponse.json({ success: false })));

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([true, false]);
      expect(account.updateUserInfo).toHaveBeenCalled();
    });

    it("should return [false, false] session is out of date", async () => {
      server.use(
        http.post(`${apiBase}/savedata/session/clear`, () => HttpResponse.json({ error: "session out of date" }))
      );

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([false, false]);
      expect(account.updateUserInfo).toHaveBeenCalled();
    });
  });
});
