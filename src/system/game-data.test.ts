import { expect, describe, it, beforeAll, vi, afterAll } from "vitest";
import { GameDataType, getDataTypeKey } from "./game-data";

describe("game-data", () => {
  describe("getDataTypeKey", () => {
    beforeAll(() => {
      // Error when importing biomes (imported by different files)
      vi.mock('../data/biomes', () => ({
        biomeLinks: {},
        BiomePoolTier: {},
        PokemonPools: {},
        getBiomeName: () => "",
        BiomeTierTrainerPools: {},
        biomePokemonPools: {},
        biomeTrainerPools: {},
      }));
    });

    afterAll(() => {
      vi.clearAllMocks();
    });

    it("returns sessionData for session data type", () => {
      expect(getDataTypeKey(GameDataType.SESSION)).toBe("sessionData");
      expect(getDataTypeKey(GameDataType.SESSION, 0)).toBe("sessionData");
    });

    it("returns sessionData with the slot id given for session data type", () => {
      expect(getDataTypeKey(GameDataType.SESSION, 1)).toBe("sessionData1");
    });

    it("returns data for system data type", () => {
      expect(getDataTypeKey(GameDataType.SYSTEM)).toBe("data");
      expect(getDataTypeKey(GameDataType.SYSTEM, 0)).toBe("data");
      expect(getDataTypeKey(GameDataType.SYSTEM, 1)).toBe("data");
    });

    it("returns settings for settings data type", () => {
      expect(getDataTypeKey(GameDataType.SETTINGS)).toBe("settings");
      expect(getDataTypeKey(GameDataType.SETTINGS, 0)).toBe("settings");
      expect(getDataTypeKey(GameDataType.SETTINGS, 1)).toBe("settings");
    });

    it("returns tutorials for tutorials data type", () => {
      expect(getDataTypeKey(GameDataType.TUTORIALS)).toBe("tutorials");
      expect(getDataTypeKey(GameDataType.TUTORIALS, 0)).toBe("tutorials");
      expect(getDataTypeKey(GameDataType.TUTORIALS, 1)).toBe("tutorials");
    });
  });
});
