import { isMegaSolSunny } from "#abilities/ability-utils";
import { AbilityId } from "#enums/ability-id";
import { WeatherType } from "#enums/weather-type";
import type { Pokemon } from "#field/pokemon";
import { describe, expect, it } from "vitest";

describe("Ability Utils", () => {
  describe("isMegaSolSunny", () => {
    it("should return true if weatherTypes contains sunny weather and the pokemon has Mega Sol as ability", () => {
      const pokemon = {
        getAbility: () => ({ id: AbilityId.MEGA_SOL }),
        hasPassive: () => false,
      } as unknown as Pokemon;

      expect(isMegaSolSunny(pokemon, [WeatherType.SUNNY])).toBe(true);
    });

    it("should return true if weatherTypes contains sunny weather and the pokemon has Mega Sol as passive", () => {
      const pokemon = {
        getAbility: () => ({ id: AbilityId.GRASSY_SURGE }),
        hasPassive: () => true,
        getPassiveAbility: () => ({ id: AbilityId.MEGA_SOL }),
      } as unknown as Pokemon;

      expect(isMegaSolSunny(pokemon, [WeatherType.SUNNY])).toBe(true);
    });

    it("should return true if weatherTypes contains harsh sun weather and the pokemon has Mega Sol as ability", () => {
      const pokemon = {
        getAbility: () => ({ id: AbilityId.MEGA_SOL }),
        hasPassive: () => false,
      } as unknown as Pokemon;

      expect(isMegaSolSunny(pokemon, [WeatherType.HARSH_SUN])).toBe(true);
    });

    it("should return true if weatherTypes contains harsh sun weather and the pokemon has Mega Sol as passive", () => {
      const pokemon = {
        getAbility: () => ({ id: AbilityId.GRASSY_SURGE }),
        hasPassive: () => true,
        getPassiveAbility: () => ({ id: AbilityId.MEGA_SOL }),
      } as unknown as Pokemon;

      expect(isMegaSolSunny(pokemon, [WeatherType.HARSH_SUN])).toBe(true);
    });

    it("should return false if weatherTypes contains sunny weather and the pokemon does not have Mega Sol", () => {
      const pokemon = {
        getAbility: () => ({ id: AbilityId.GRASSY_SURGE }),
        hasPassive: () => true,
        getPassiveAbility: () => ({ id: AbilityId.PICKPOCKET }),
      } as unknown as Pokemon;

      expect(isMegaSolSunny(pokemon, [WeatherType.HARSH_SUN, WeatherType.SUNNY])).toBe(false);
    });

    it("should return false if weatherTypes contains rainy weather and the pokemon has Mega Sol", () => {
      const pokemon = {
        getAbility: () => ({ id: AbilityId.MEGA_SOL }),
        hasPassive: () => true,
        getPassiveAbility: () => ({ id: AbilityId.MEGA_SOL }),
      } as unknown as Pokemon;

      expect(isMegaSolSunny(pokemon, [WeatherType.RAIN, WeatherType.HEAVY_RAIN])).toBe(false);
    });

    it("should return false if weatherTypes is empty and the pokemon has Mega Sol", () => {
      const pokemon = {
        getAbility: () => ({ id: AbilityId.MEGA_SOL }),
        hasPassive: () => true,
        getPassiveAbility: () => ({ id: AbilityId.MEGA_SOL }),
      } as unknown as Pokemon;

      expect(isMegaSolSunny(pokemon, [])).toBe(false);
    });
  });
});
