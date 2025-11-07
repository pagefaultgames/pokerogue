import type { AbilityId } from "#enums/ability-id";
import type { BiomeId } from "#enums/biome-id";
import type { Nature } from "#enums/nature";
import type { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";
import type { StarterMoveset } from "./save-data";

/**
 * Configuration for a custom daily run starter Pokémon.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.ts`
 * - `scripts/daily-seed/schema.js`
 */
export interface DailySeedStarter {
  speciesId: SpeciesId;
  formIndex?: number;
  variant?: Variant;
  moveset?: StarterMoveset;
  nature?: Nature;
  abilityIndex?: number;
}

type DailySeedStarterTuple = [DailySeedStarter, DailySeedStarter, DailySeedStarter];

/**
 * Configuration for a custom daily run boss Pokémon.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.ts`
 * - `scripts/daily-seed/schema.js`
 */
export type DailySeedBoss = {
  speciesId: SpeciesId;
  formIndex?: number;
  variant?: Variant;
  moveset?: StarterMoveset;
  nature?: Nature;
  ability?: AbilityId;
  passive?: AbilityId;
};

/**
 * Configuration for a custom daily run seed.
 * @privateRemarks
 * When updating this interface, also update:
 * - `src/data/daily-seed/schema.ts`
 * - `scripts/daily-seed/schema.js`
 */
export interface CustomDailyRunConfig {
  starters?: DailySeedStarterTuple;
  boss?: DailySeedBoss;
  biome?: BiomeId;
  luck?: number;
  startingMoney?: number;
  /** Used to vary the seed while keeping the same config */
  seedVariation?: string;
}
