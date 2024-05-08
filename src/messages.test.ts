import { expect, describe, it } from "vitest";
import Pokemon from "./field/pokemon";
import { getPokemonMessage, getPokemonPrefix } from "./messages";
import { BattleSpec } from "./enums/battle-spec";

describe("messages", () => {
  describe("getPokemonPrefix", () => {
    it("returns an empty prefix if the pokemon is a pokemon of the player", () => {
      const pokemon = {
        isPlayer: () => true,
        hasTrainer: () => false,
        scene: {
          currentBattle: {
            battleSpec: BattleSpec.DEFAULT
          }
        }
      } as Pokemon;

      expect(getPokemonPrefix(pokemon)).toBe('');
    });

    it("returns the wild prefix if the pokemon does not have a trainer", () => {
      const pokemon = {
        isPlayer: () => false,
        hasTrainer: () => false,
        scene: {
          currentBattle: {
            battleSpec: BattleSpec.DEFAULT
          }
        }
      } as Pokemon;
      
      expect(getPokemonPrefix(pokemon)).toBe('Wild ');
    });

    it("returns the foe prefix if the pokemon has a trainer which is not the player", () => {
      const pokemon = {
        isPlayer: () => false,
        hasTrainer: () => true,
        scene: {
          currentBattle: {
            battleSpec: BattleSpec.DEFAULT
          }
        }
      } as Pokemon;

      expect(getPokemonPrefix(pokemon)).toBe('Foe ');
    });

    it("returns the foe prefix if the pokemon is the final boss", () => {
      const pokemon = {
        isPlayer: () => false,
        hasTrainer: () => false,
        scene: {
          currentBattle: {
            battleSpec: BattleSpec.FINAL_BOSS
          }
        }
      } as Pokemon;

      expect(getPokemonPrefix(pokemon)).toBe('Foe ');
    });
  });

  describe("getPokemonMessage", () => {
    it("returns a message with pokemon prefix, pokemon name and content given", () => {
      const pokemon = {
        name: "Gengar",
        isPlayer: () => false,
        hasTrainer: () => true,
        scene: {
          currentBattle: {
            battleSpec: BattleSpec.DEFAULT
          }
        }
      } as Pokemon;

      expect(getPokemonMessage(pokemon, " is hurt\nby poison!")).toBe('Foe Gengar is hurt\nby poison!');
    });
  });
});
