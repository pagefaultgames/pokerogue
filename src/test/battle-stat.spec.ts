import { BattleStat, getBattleStatName } from "#app/data/battle-stat.js";
import { describe, expect, it } from "vitest";
import { mockI18next } from "./utils/testUtils";

const UNKNOWN_BATTLE_STAT = "UNKNOWN_BATTLE_STAT" as unknown as BattleStat;

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
      expect(getBattleStatName(UNKNOWN_BATTLE_STAT)).toBe("???");
    });
  });
});
