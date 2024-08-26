import { TerrainType, getTerrainName } from "#app/data/terrain";
import { getTerrainBlockMessage, getTerrainClearMessage, getTerrainStartMessage } from "#app/data/weather";
import { Species } from "#enums/species";
import GameManager from "#test/utils/gameManager";
import { mockI18next } from "#test/utils/testUtils";
import i18next from "i18next";
import Phaser from "phaser";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

describe("terrain", () => {
  let phaserGame: Phaser.Game;
  let game: GameManager;

  beforeAll(() => {
    phaserGame = new Phaser.Game({
      type: Phaser.HEADLESS,
    });
    i18next.init();
  });

  beforeEach(() => {
    game = new GameManager(phaserGame);
    game.override.battleType("single");
  });

  describe("NONE", () => {
    const terrainType = TerrainType.NONE;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getTerrainName(terrainType);
      expect(text).toBe("");
    });

    it("should return the start text", () => {
      mockI18next();

      const text = getTerrainStartMessage(terrainType);
      expect(text).toBeNull();
    });

    it("should return the clear text", () => {
      mockI18next();
      const text = getTerrainClearMessage(terrainType);
      expect(text).toBeNull();
    });

    it("should return the block text", async () => {
      await game.startBattle([Species.MAGIKARP]);
      const pokemon = game.scene.getPlayerPokemon()!;
      mockI18next();
      const text = getTerrainBlockMessage(pokemon, terrainType);
      expect(text).toBe("terrain:defaultBlockMessage");
    });
  });

  describe("MISTY", () => {
    const terrainType = TerrainType.MISTY;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getTerrainName(terrainType);
      expect(text).toBe("terrain:misty");
    });

    it("should return the start text", () => {
      mockI18next();

      const text = getTerrainStartMessage(terrainType);
      expect(text).toBe("terrain:mistyStartMessage");
    });

    it("should return the clear text", () => {
      mockI18next();
      const text = getTerrainClearMessage(terrainType);
      expect(text).toBe("terrain:mistyClearMessage");
    });

    it("should return the block text", async () => {
      await game.startBattle([Species.MAGIKARP]);
      const pokemon = game.scene.getPlayerPokemon()!;
      mockI18next();
      const text = getTerrainBlockMessage(pokemon, terrainType);
      expect(text).toBe("terrain:mistyBlockMessage");
    });
  });

  describe("ELECTRIC", () => {
    const terrainType = TerrainType.ELECTRIC;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getTerrainName(terrainType);
      expect(text).toBe("terrain:electric");
    });

    it("should return the start text", () => {
      mockI18next();

      const text = getTerrainStartMessage(terrainType);
      expect(text).toBe("terrain:electricStartMessage");
    });

    it("should return the clear text", () => {
      mockI18next();
      const text = getTerrainClearMessage(terrainType);
      expect(text).toBe("terrain:electricClearMessage");
    });

    it("should return the block text", async () => {
      await game.startBattle([Species.MAGIKARP]);
      const pokemon = game.scene.getPlayerPokemon()!;
      mockI18next();
      const text = getTerrainBlockMessage(pokemon, terrainType);
      expect(text).toBe("terrain:defaultBlockMessage");
    });
  });

  describe("GRASSY", () => {
    const terrainType = TerrainType.GRASSY;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getTerrainName(terrainType);
      expect(text).toBe("terrain:grassy");
    });

    it("should return the start text", () => {
      mockI18next();

      const text = getTerrainStartMessage(terrainType);
      expect(text).toBe("terrain:grassyStartMessage");
    });

    it("should return the clear text", () => {
      mockI18next();
      const text = getTerrainClearMessage(terrainType);
      expect(text).toBe("terrain:grassyClearMessage");
    });

    it("should return the block text", async () => {
      await game.startBattle([Species.MAGIKARP]);
      const pokemon = game.scene.getPlayerPokemon()!;
      mockI18next();
      const text = getTerrainBlockMessage(pokemon, terrainType);
      expect(text).toBe("terrain:defaultBlockMessage");
    });
  });

  describe("PSYCHIC", () => {
    const terrainType = TerrainType.PSYCHIC;

    it("should return the obtain text", () => {
      mockI18next();

      const text = getTerrainName(terrainType);
      expect(text).toBe("terrain:psychic");
    });

    it("should return the start text", () => {
      mockI18next();

      const text = getTerrainStartMessage(terrainType);
      expect(text).toBe("terrain:psychicStartMessage");
    });

    it("should return the clear text", () => {
      mockI18next();
      const text = getTerrainClearMessage(terrainType);
      expect(text).toBe("terrain:psychicClearMessage");
    });

    it("should return the block text", async () => {
      await game.startBattle([Species.MAGIKARP]);
      const pokemon = game.scene.getPlayerPokemon()!;
      mockI18next();
      const text = getTerrainBlockMessage(pokemon, terrainType);
      expect(text).toBe("terrain:defaultBlockMessage");
    });
  });


  afterEach(() => {
    game.phaseInterceptor.restoreOg();
    vi.resetAllMocks();
  });
});
