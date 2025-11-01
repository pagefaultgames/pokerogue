import type { AbilityId } from "#enums/ability-id";
import type { BiomeId } from "#enums/biome-id";
import type { MoveId } from "#enums/move-id";
import type { Nature } from "#enums/nature";
import type { SpeciesId } from "#enums/species-id";

interface DailySeedStarter {
  speciesId: SpeciesId;
  formIndex?: number;
  variant?: number;
  moveset?: MoveId[];
  nature?: Nature;
  ability?: AbilityId;
  passive?: AbilityId;
}

type DailySeedStarterTuple = [DailySeedStarter, DailySeedStarter, DailySeedStarter];

export interface DailyRunConfig {
  starters?: DailySeedStarterTuple;
  boss?: DailySeedStarter;
  biome?: BiomeId;
  luck?: number;
  money?: number;
  seedVariation?: string;
}
