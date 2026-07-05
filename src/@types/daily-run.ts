import type { AbilityId } from "#enums/ability-id";
import type { BiomeId } from "#enums/biome-id";
import type { BiomePoolTier } from "#enums/biome-pool-tier";
import type { Challenges } from "#enums/challenges";
import type { MysteryEncounterType } from "#enums/mystery-encounter-type";
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
  ability?: AbilityId | undefined;
  passive?: AbilityId | undefined;
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
  segments?: number | undefined;
  catchable?: boolean | undefined;
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
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.json`
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
 * Configuration to manipulate on what waves a trainer spawns for a custom seed.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.json`
 */
export interface DailyTrainerManipulation {
  waveIndex: number;
  isTrainer: boolean;
}

/**
 * Configuration for a custom daily run challenge.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.json`
 */
export interface DailyEventChallenge {
  id: Challenges;
  value: number;
}

/**
 * Configuration for a custom daily run mystery encounter.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.json`
 */
export interface DailyEventMysteryEncounter {
  waveIndex: number;
  type: MysteryEncounterType;
}

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
  trainerManipulations?: DailyTrainerManipulation[];
  challenges?: DailyEventChallenge[];
  mysteryEncounters?: DailyEventMysteryEncounter[];
  /** The actual seed used for the daily run. */
  seed: string;
}

/**
 * The daily run config as it is serialized in the save data.
 * @privateRemarks
 * When updating this interface, also update:
 * `daily-seed-utils.ts` -> `getSerializedDailyRunConfig`
 */
export interface SerializedDailyRunConfig {
  boss?: DailySeedBoss | undefined;
  luck?: number | undefined;
  forcedWaves?: DailyForcedWave[] | undefined;
  trainerManipulations?: DailyTrainerManipulation[] | undefined;
  challenges?: DailyEventChallenge[] | undefined;
  mysteryEncounters?: DailyEventMysteryEncounter[] | undefined;
  seed: string;
}
