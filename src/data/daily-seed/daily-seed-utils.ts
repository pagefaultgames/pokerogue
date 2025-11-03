import { globalScene } from "#app/global-scene";
import type { CustomDailyRunConfig } from "#types/daily-run";

/**
 * If this is Daily Mode and the seed can be parsed into json it is a Daily Event Seed.
 * @returns `true` if it is a Daily Event Seed.
 */
export function isDailyEventSeed(seed: string): boolean {
  return globalScene.gameMode.isDaily && parseDailySeed(seed) != null;
}

/**
 * Attempt to parse the seed as a custom daily run seed.
 * @returns The parsed {@linkcode CustomDailyRunConfig}, or `null` if it can't be parsed into json.
 */
export function parseDailySeed(seed: string): CustomDailyRunConfig | null {
  try {
    const config = JSON.parse(seed) as CustomDailyRunConfig;
    // todo: remove this later since it gets logged a lot
    console.log("Using a custom config for the daily run:", config);
    return config;
  } catch {
    return null;
  }
}

export function isDailyFinalBoss() {
  return globalScene.gameMode.isDaily && globalScene.gameMode.isWaveFinal(globalScene.currentBattle.waveIndex);
}
