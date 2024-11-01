import * as BattleScene from "#app/battle-scene";
import { SessionSaveData } from "#app/system/game-data";
import { Abilities } from "#enums/abilities";
import { GameDataType } from "#enums/game-data-type";
import { Moves } from "#enums/moves";
import GameManager from "#test/utils/gameManager";
import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import Phaser from "phaser";
import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import * as account from "../../account";

const apiBase = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8001";

/** We need a custom server. For some reasons I can't extend the listeners of {@linkcode global.i18nServer} with {@linkcode global.i18nServer.use} */
const server = setupServer();

describe("System - Game Data", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    global.i18nServer.close();
    server.listen();
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
  });

  afterAll(() => {
    server.close();
    global.i18nServer.listen();
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
    server.resetHandlers();
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
      server.use(http.post(`${apiBase}/savedata/session/clear`, () => HttpResponse.json({ success: true })));

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([ true, true ]);
      expect(account.updateUserInfo).toHaveBeenCalled();
    });

    it("should return [true, false] if not successful", async () => {
      server.use(http.post(`${apiBase}/savedata/session/clear`, () => HttpResponse.json({ success: false })));

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([ true, false ]);
      expect(account.updateUserInfo).toHaveBeenCalled();
    });

    it("should return [false, false] session is out of date", async () => {
      server.use(
        http.post(`${apiBase}/savedata/session/clear`, () => HttpResponse.json({ error: "session out of date" }))
      );

      const result = await game.scene.gameData.tryClearSession(game.scene, 0);

      expect(result).toEqual([ false, false ]);
      expect(account.updateUserInfo).toHaveBeenCalled();
    });
  });

  describe("getDataToExport", () => {
    it("should get default settings", async () => {
      const defaultSettings = "{\"PLAYER_GENDER\":0,\"gameVersion\":\"1.0.4\"}";
      localStorage.setItem("settings", defaultSettings);

      const result = await game.scene.gameData.getDataToExport(GameDataType.SETTINGS);

      expect(result).toEqual(defaultSettings);
    });

    it("should get undefined when there is no settings", async () => {
      const result = await game.scene.gameData.getDataToExport(GameDataType.SETTINGS);

      expect(result).toBeUndefined();
    });
  });

  describe("setImportedData", () => {
    it("should set settings in local storage", () => {
      const settings = "{\"PLAYER_GENDER\":0,\"gameVersion\":\"1.0.4\"}";
      game.scene.gameData.setImportedData(settings, GameDataType.SETTINGS);

      expect(localStorage.getItem("settings")).toEqual(settings);
    });

    it("should override default settings", () => {
      const defaultSettings = "{\"PLAYER_GENDER\":0,\"gameVersion\":\"1.0.4\"}";
      localStorage.setItem("settings", defaultSettings);

      const newSettings = "{\"PLAYER_GENDER\":1,\"gameVersion\":\"1.0.7\",\"GAME_SPEED\":7}";
      game.scene.gameData.setImportedData(newSettings, GameDataType.SETTINGS);

      expect(localStorage.getItem("settings")).toEqual(newSettings);
    });
  });

  describe("validateDataToImport", () => {
    it("should be true when the setting data is valid", async () => {
      const settings = "{\"PLAYER_GENDER\":0,\"gameVersion\":\"1.0.4\"}";
      const result = await game.scene.gameData.validateDataToImport(settings, GameDataType.SETTINGS);

      expect(result).toBeTruthy();
    });

    it("should be false when the setting data is an invalid JSON", async () => {
      const settings = "";
      const result = await game.scene.gameData.validateDataToImport(settings, GameDataType.SETTINGS);

      expect(result).toBeFalsy();
    });

    it("should be false when the setting data contains an unknow value", async () => {
      const settings = "{\"PLAYER_GENDER\":0,\"gameVersion\":\"1.0.4\",\"GAME_SPEED\":999}";
      const result = await game.scene.gameData.validateDataToImport(settings, GameDataType.SETTINGS);

      expect(result).toBeFalsy();
    });
  });
});
