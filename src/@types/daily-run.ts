import type { AbilityId } from "#enums/ability-id";
import type { BiomeId } from "#enums/biome-id";
import type { BiomePoolTier } from "#enums/biome-pool-tier";
import type { Nature } from "#enums/nature";
import type { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";
import type { StarterMoveset } from "./save-data";
import type { TupleRange } from "./type-helpers";

/**
 * Configuration for a custom daily run starter Pokémon.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.json`
 */
export interface DailySeedStarter {
  speciesId: SpeciesId;
  formIndex?: number | undefined;
  variant?: Variant | undefined;
  moveset?: StarterMoveset | undefined;
  nature?: Nature | undefined;
  abilityIndex?: number | undefined;
}

type DailySeedStarterTuple = TupleRange<1, 6, DailySeedStarter>;

/**
 * Configuration for a custom daily run boss Pokémon.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.json`
 */
export interface DailySeedBoss {
  speciesId: SpeciesId;
  formIndex?: number | undefined;
  variant?: Variant | undefined;
  moveset?: StarterMoveset | undefined;
  nature?: Nature | undefined;
  ability?: AbilityId | undefined;
  passive?: AbilityId | undefined;
}

/**
 * Configuration for a custom daily run forced wave.
 * @example
 * ```ts
 * const forcedWave: DailyForcedWave = {
 *   waveIndex: 7,
 *   speciesId: SpeciesId.MEW,
 * };
 * ```
 */
export type DailyForcedWave =
  | {
      waveIndex: number;
      speciesId: SpeciesId;
      tier?: never;
      hiddenAbility?: boolean | undefined;
    }
  | {
      waveIndex: number;
      tier: BiomePoolTier;
      speciesId?: never;
      hiddenAbility?: boolean | undefined;
    };

/**
 * Configuration for a custom daily run seed.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.json`
 */
export interface CustomDailyRunConfig {
  starters?: DailySeedStarterTuple;
  boss?: DailySeedBoss;
  biome?: BiomeId;
  luck?: number;
  startingMoney?: number;
  forcedWaves?: DailyForcedWave[];
  /** The actual seed used for the daily run. */
  seed: string;
}

/**
 * The daily run config as it is serialized in the save data.
 */
export interface SerializedDailyRunConfig {
  boss?: DailySeedBoss | undefined;
  luck?: number | undefined;
  forcedWaves?: DailyForcedWave[] | undefined;
  seed: string;
}
