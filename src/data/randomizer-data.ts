import { globalScene } from "#app/global-scene";
import { allAbilities } from "#data/data-lists";
import { AbilityId } from "#enums/ability-id";
import { PokemonType } from "#enums/pokemon-type";
import { SpeciesId } from "#enums/species-id";
import { randSeedInt } from "#utils/common";
import { getPokemonSpecies } from "#utils/pokemon-utils";

const RANDOMIZER_SEED_OFFSET = 0x52414e44;

export interface RandomizerEntry {
  ability: AbilityId;
  types: PokemonType[];
}

let randomizerMap: Map<number, RandomizerEntry> | null = null;

const VALID_TYPES: PokemonType[] = (Object.values(PokemonType) as PokemonType[]).filter(
  t => typeof t === "number" && t !== PokemonType.UNKNOWN && t !== PokemonType.STELLAR,
);

function buildValidAbilityPool(): AbilityId[] {
  return allAbilities.filter(a => a.id !== AbilityId.NONE && !a.unimplemented).map(a => a.id);
}

function randomType(exclude?: PokemonType): PokemonType {
  const pool = exclude !== undefined ? VALID_TYPES.filter(t => t !== exclude) : VALID_TYPES;
  return pool[randSeedInt(pool.length)];
}

export function generateRandomizerMap(): void {
  const abilityPool = buildValidAbilityPool();

  globalScene.executeWithSeedOffset(() => {
    const map = new Map<number, RandomizerEntry>();

    for (const value of Object.values(SpeciesId)) {
      if (typeof value !== "number") {
        continue;
      }
      const speciesId = value as SpeciesId;
      const species = getPokemonSpecies(speciesId);
      if (!species) {
        continue;
      }

      const ability = abilityPool[randSeedInt(abilityPool.length)];
      const type1 = randomType();
      const isDual = species.type2 !== null && species.type2 !== PokemonType.UNKNOWN;

      let types: PokemonType[];
      if (isDual) {
        types = [type1, randomType(type1)];
      } else if (randSeedInt(3) === 0) {
        types = [type1, randomType(type1)];
      } else {
        types = [type1];
      }

      map.set(speciesId, { ability, types });
    }

    randomizerMap = map;
  }, RANDOMIZER_SEED_OFFSET);
}

export function getRandomizerEntry(speciesId: number): RandomizerEntry | undefined {
  return randomizerMap?.get(speciesId);
}

export function clearRandomizerMap(): void {
  randomizerMap = null;
}
