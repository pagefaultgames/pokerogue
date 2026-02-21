import { allBiomes, catchableSpecies } from "#data/data-lists";
import type { BiomeId } from "#enums/biome-id";
import type { BiomePoolTier } from "#enums/biome-pool-tier";
import { SpeciesId } from "#enums/species-id";
import type { TimeOfDay } from "#enums/time-of-day";
import type { BiomeTierTimeOfDay } from "#types/biomes";
import type { Mutable } from "#types/type-helpers";
import { getEnumValues } from "#utils/enums";

type SpeciesBiomeMap = Record<SpeciesId, Record<BiomeId, Record<BiomePoolTier, TimeOfDay[]>>>;

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: temporary
export function initCatchableSpecies(): void {
  const speciesBiomeMap: SpeciesBiomeMap = {} as SpeciesBiomeMap;

  for (const biome of allBiomes.values()) {
    for (const [biomePoolTier, timeOfDayEntry] of Object.entries(biome.pokemonPool)) {
      for (const [timeOfDay, speciesArray] of Object.entries(timeOfDayEntry)) {
        for (const speciesId of speciesArray) {
          if (speciesBiomeMap[speciesId] == null) {
            speciesBiomeMap[speciesId] = {} as Record<BiomeId, Record<BiomePoolTier, TimeOfDay[]>>;
          }
          if (speciesBiomeMap[speciesId][biome.biomeId] == null) {
            speciesBiomeMap[speciesId][biome.biomeId] = {} as Record<BiomePoolTier, TimeOfDay[]>;
          }
          const bpt = Number(biomePoolTier) as BiomePoolTier;
          if (speciesBiomeMap[speciesId][biome.biomeId][bpt] == null) {
            speciesBiomeMap[speciesId][biome.biomeId][bpt] = [];
          }
          const tod = Number(timeOfDay) as TimeOfDay;
          speciesBiomeMap[speciesId][biome.biomeId][bpt].push(tod);
        }
      }
    }
  }

  // TODO: replace `catchableSpecies` with `speciesBiomeMap` and refactor pokedex
  for (const speciesId of getEnumValues(SpeciesId)) {
    (catchableSpecies[speciesId] as Mutable<BiomeTierTimeOfDay[]>) = [];
  }

  for (const [speciesId, biomeTierTod] of Object.entries(speciesBiomeMap)) {
    for (const [biomeId, tierTod] of Object.entries(biomeTierTod)) {
      for (const [biomePoolTier, timesOfDay] of Object.entries(tierTod)) {
        const biome = Number(biomeId) as BiomeId;
        const tier = Number(biomePoolTier) as BiomePoolTier;
        (catchableSpecies[speciesId] as Mutable<BiomeTierTimeOfDay[]>).push({ biome, tier, timesOfDay });
      }
    }
  }
}
