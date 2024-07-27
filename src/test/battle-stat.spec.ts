import {
  BattleStat,
  getBattleStatLevelChangeDescription,
  getBattleStatName,
} from "#app/data/battle-stat.js";
import { describe, expect, it } from "vitest";
import { arrayOfRange, mockI18next } from "./utils/testUtils";

const TEST_BATTLE_STAT = -99 as unknown as BattleStat;
const TEST_POKEMON = "Testmon";
const TEST_STAT = "Teststat";

describe("battle-stat", () => {
  describe("getBattleStatName", () => {
    it("should return the correct name for each BattleStat", () => {
      mockI18next();

      expect(getBattleStatName(BattleStat.ATK)).toBe("pokemonInfo:Stat.ATK");
      expect(getBattleStatName(BattleStat.DEF)).toBe("pokemonInfo:Stat.DEF");
      expect(getBattleStatName(BattleStat.SPATK)).toBe(
        "pokemonInfo:Stat.SPATK"
      );
      expect(getBattleStatName(BattleStat.SPDEF)).toBe(
        "pokemonInfo:Stat.SPDEF"
      );
      expect(getBattleStatName(BattleStat.SPD)).toBe("pokemonInfo:Stat.SPD");
      expect(getBattleStatName(BattleStat.ACC)).toBe("pokemonInfo:Stat.ACC");
      expect(getBattleStatName(BattleStat.EVA)).toBe("pokemonInfo:Stat.EVA");
    });

    it("should fall back to ??? for an unknown BattleStat", () => {
      expect(getBattleStatName(TEST_BATTLE_STAT)).toBe("???");
    });
  });

  describe("getBattleStatLevelChangeDescription", () => {
    it("should return battle:statRose for +1", () => {
      mockI18next();

      const message = getBattleStatLevelChangeDescription(
        TEST_POKEMON,
        TEST_STAT,
        1,
        true
      );

      expect(message).toBe("battle:statRose");
    });

    it("should return battle:statSharplyRose for +2", () => {
      mockI18next();

      const message = getBattleStatLevelChangeDescription(
        TEST_POKEMON,
        TEST_STAT,
        2,
        true
      );

      expect(message).toBe("battle:statSharplyRose");
    });

    it("should return battle:statRoseDrastically for +3 to +6", () => {
      mockI18next();

      arrayOfRange(3, 6).forEach((n) => {
        const message = getBattleStatLevelChangeDescription(
          TEST_POKEMON,
          TEST_STAT,
          n,
          true
        );

        expect(message).toBe("battle:statRoseDrastically");
      });
    });

    it("should return battle:statWontGoAnyHigher for 7 or higher", () => {
      mockI18next();

      arrayOfRange(7, 10).forEach((n) => {
        const message = getBattleStatLevelChangeDescription(
          TEST_POKEMON,
          TEST_STAT,
          n,
          true
        );

        expect(message).toBe("battle:statWontGoAnyHigher");
      });
    });

    it("should return battle:statFell for -1", () => {
      mockI18next();

      const message = getBattleStatLevelChangeDescription(
        TEST_POKEMON,
        TEST_STAT,
        1,
        false
      );

      expect(message).toBe("battle:statFell");
    });

    it("should return battle:statHarshlyFell for -2", () => {
      mockI18next();

      const message = getBattleStatLevelChangeDescription(
        TEST_POKEMON,
        TEST_STAT,
        2,
        false
      );

      expect(message).toBe("battle:statHarshlyFell");
    });

    it("should return battle:statSeverelyFell for -3 to -6", () => {
      mockI18next();

      arrayOfRange(3, 6).forEach((n) => {
        const message = getBattleStatLevelChangeDescription(
          TEST_POKEMON,
          TEST_STAT,
          n,
          false
        );

        expect(message).toBe("battle:statSeverelyFell");
      });
    });

    it("should return battle:statWontGoAnyLower for -7 or lower", () => {
      mockI18next();

      arrayOfRange(7, 10).forEach((n) => {
        const message = getBattleStatLevelChangeDescription(
          TEST_POKEMON,
          TEST_STAT,
          n,
          false
        );

        expect(message).toBe("battle:statWontGoAnyLower");
      });
    });
  });
});
