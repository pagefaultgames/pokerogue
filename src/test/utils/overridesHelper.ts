import { Weather, WeatherType } from "#app/data/weather";
import { Biome } from "#app/enums/biome";
import * as Overrides from "#app/overrides";
import { MockInstance, vi } from "vitest";
import GameManager from "#test/utils/gameManager";
import { MysteryEncounterType } from "#enums/mystery-encounter-type";
import * as overrides from "#app/overrides";

/**
 * Helper to handle overrides in tests
 */
export class OverridesHelper {
  game: GameManager;
  constructor(game: GameManager) {
    this.game = game;
  }

  /**
   * Override the encounter chance for a mystery encounter.
   * @param percentage the encounter chance in %
   * @returns spy instance
   */
  mysteryEncounterChance(percentage: number) {
    const maxRate: number = 256; // 100%
    const rate = maxRate * (percentage / 100);
    const spy = vi.spyOn(Overrides, "MYSTERY_ENCOUNTER_RATE_OVERRIDE", "get").mockReturnValue(rate);
    this.log(`Mystery encounter chance set to ${percentage}% (=${rate})!`);
    return spy;
  }

  /**
   * Override the encounter that spawns for the scene
   * @param encounterType
   * @returns spy instance
   */
  mysteryEncounter(encounterType: MysteryEncounterType): MockInstance {
    const spy = vi.spyOn(overrides, "MYSTERY_ENCOUNTER_OVERRIDE", "get").mockReturnValue(encounterType);
    this.log(`Mystery encounter override set to ${encounterType}!`);
    return spy;
  }

  /**
   * Override the starting biome
   * @warning Any event listeners that are attached to [NewArenaEvent](events\battle-scene.ts) may need to be handled down the line
   * @param biome the biome to set
   */
  startingBiome(biome: Biome) {
    this.game.scene.newArena(biome);
    this.log(`Starting biome set to ${Biome[biome]} (=${biome})!`);
  }

  /**
   * Override the starting wave (index)
   * @param wave the wave (index) to set. Classic: `1`-`200`
   * @returns spy instance
   */
  startingWave(wave: number) {
    const spy = vi.spyOn(Overrides, "STARTING_WAVE_OVERRIDE", "get").mockReturnValue(wave);
    this.log(`Starting wave set to ${wave}!`);
    return spy;
  }

  /**
   * Override each wave to have or not have standard trainer battles
   * @returns spy instance
   * @param isTrainer
   */
  trainerWave(isTrainer: boolean): MockInstance {
    const spy = vi.spyOn(this.game.scene.gameMode, "isWaveTrainer").mockReturnValue(isTrainer);
    this.log(`${isTrainer? "forcing" : "ignoring"} trainer waves!`);
    return spy;
  }

  /**
   * Override the weather (type)
   * @param type weather type to set
   * @returns spy instance
   */
  weather(type: WeatherType) {
    const spy = vi.spyOn(Overrides, "WEATHER_OVERRIDE", "get").mockReturnValue(type);
    this.log(`Weather set to ${Weather[type]} (=${type})!`);
    return spy;
  }

  /**
   * Override the seed
   * @param seed the seed to set
   * @returns spy instance
   */
  seed(seed: string) {
    const spy = vi.spyOn(this.game.scene, "resetSeed").mockImplementation(() => {
      this.game.scene.waveSeed = seed;
      Phaser.Math.RND.sow([seed]);
      this.game.scene.rngCounter = 0;
    });
    this.game.scene.resetSeed();
    this.log(`Seed set to "${seed}"!`);
    return spy;
  }

  private log(...params: any[]) {
    console.log("Overrides:", ...params);
  }
}
