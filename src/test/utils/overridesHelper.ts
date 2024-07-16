import { Biome } from "#app/enums/biome";
import * as Overrides from "#app/overrides";
import { vi } from "vitest";

/**
 * Helper to handle overrides in tests
 */
export class OverridesHelper {
  constructor() {}

  /**
   * Set the encounter chance for a mystery encounter.
   * @param percentage the encounter chance in %
   */
  mysteryEncounterChance(percentage: number) {
    const maxRate: number = 256; // 100%
    const rate = maxRate * (percentage / 100);
    vi.spyOn(Overrides, "MYSTERY_ENCOUNTER_RATE_OVERRIDE", "get").mockReturnValue(rate);
    this.log(`Mystery encounter chance set to ${percentage}% (=${rate})!`);
  }

  /**
   * Set the starting biome
   * @warning The biome will not be overridden unless you call `workaround_reInitSceneWithOverrides()` (testUtils)
   * @param biome the biome to set
   */
  startingBiome(biome: Biome) {
    vi.spyOn(Overrides, "STARTING_BIOME_OVERRIDE", "get").mockReturnValue(biome);
    this.log(`Starting biome set to ${Biome[biome]} (=${biome})!`);
  }

  /**
   * Set the starting wave (index)
   *
   * @param wave the wave (index) to set. Classic: `1`-`200`
   */
  startingWave(wave: number) {
    vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(wave);
    this.log(`Starting wave set to ${wave}!`);
  }

  private log(...params: any[]) {
    console.log("Overrides:", ...params);
  }
}
