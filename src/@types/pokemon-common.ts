import type { PokemonSpecies, PokemonSpeciesFilter } from "#data/pokemon-species";
import type { SpeciesId } from "#enums/species-id";
import type { BooleanHolder } from "#utils/common";

/**
 * The type that {@linkcode PokemonSpeciesForm} is converted to when an object containing it serializes it.
 */
export type SerializedSpeciesForm = {
  id: SpeciesId;
  formIdx: number;
};

export interface RandomEncounterParams {
  level: number;
  speciesFunction?: () => PokemonSpecies;
  isBoss?: boolean;
  includeSubLegendary?: boolean;
  includeLegendary?: boolean;
  includeMythical?: boolean;
  eventChance?: number;
  hiddenRerolls?: number;
  shinyRerolls?: number;
  eventHiddenRerolls?: number;
  eventShinyRerolls?: number;
  hiddenAbilityChance?: number;
  shinyChance?: number;
  maxShinyChance?: number;
  speciesFilter?: PokemonSpeciesFilter;
  isEventEncounter?: BooleanHolder;
}
