import type { AbilityId } from "#enums/ability-id";
import type { BiomeId } from "#enums/biome-id";
import type { Nature } from "#enums/nature";
import type { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";
import type { StarterMoveset } from "./save-data";

export interface DailySeedStarter {
  speciesId: SpeciesId;
  formIndex?: number;
  variant?: Variant;
  moveset?: StarterMoveset;
  nature?: Nature;
  ability?: AbilityId;
  passive?: AbilityId;
}

type DailySeedStarterTuple = [DailySeedStarter, DailySeedStarter, DailySeedStarter];
// todo: make this its own type when needed
export type DailySeedBoss = DailySeedStarter;

export interface CustomDailyRunConfig {
  starters?: DailySeedStarterTuple;
  boss?: DailySeedBoss;
  biome?: BiomeId;
  luck?: number;
  money?: number;
  /** Used to vary the seed while keeping the same config */
  seedVariation?: string;
}
