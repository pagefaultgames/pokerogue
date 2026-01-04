import type { AbilityId } from "#enums/ability-id";
import type { BiomeId } from "#enums/biome-id";
import type { Nature } from "#enums/nature";
import type { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";
import type { TupleOf } from "type-fest";
import type { StarterMoveset } from "./save-data";

/**
 * Configuration for a custom daily run starter Pokémon.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.json`
 */
export interface DailySeedStarter {
  speciesId: SpeciesId;
  formIndex?: number;
  variant?: Variant;
  moveset?: StarterMoveset;
  nature?: Nature;
  abilityIndex?: number;
}

type DailySeedStarterTuple = TupleOf<3, DailySeedStarter>;

/**
 * Configuration for a custom daily run boss Pokémon.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.json`
 */
export interface DailySeedBoss {
  speciesId: SpeciesId;
  formIndex?: number;
  variant?: Variant;
  moveset?: StarterMoveset;
  nature?: Nature;
  ability?: AbilityId;
  passive?: AbilityId;
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
  /** The actual seed used for the daily run. */
  seed: string;
}

/**
 * The daily run config as it is serialized in the save data.
 */
export interface SerializedDailyRunConfig {
  boss?: DailySeedBoss;
  luck?: number;
  seed: string;
}
