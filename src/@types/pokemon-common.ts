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

/**
 * Various configurations for generating a random encounter, including pulling from the ongoing event's encounter pool
 * If the mon is from the event encounter list, it may do an extra shiny or HA roll.
 * If a mon is already shiny, a reroll will attempt to upgrade its variant tier.
 * @param level the level of the mon
 * @param speciesFunction - the default function to be used to return the {@linkcode PokemonSpecies} to be encountered
 * @param isBoss whether the mon should be a Boss
 * @param includeSubLegendary - whether Sub-legendaries can be encountered, mainly for event encounters
 * @param includeLegendary - whether Legendaries can be encountered
 * @param includeMythical - whether Mythicals can be encountered
 * @param eventChance - the chance out of 100 to pick an event encounter
 * @param hiddenRerolls - number of rerolls for HA that should be attempted
 * @param shinyRerolls - number of rerolls for shininess/variant tier that should be attempted
 * @param eventHiddenRerolls - number of extra HA rerolls for event mons
 * @param eventShinyRerolls - number of extra shiny rerolls for event mons
 * @param hiddenAbilityChance - The overridden HA chance, defaults to base
 * @param shinyChance - The overridden shiny chance, defaults to base
 * @param maxShinyChance - The max shiny threshold after modifiers are applied. Values below 1 mean no maximum
 * @param speciesFilter - {@linkcode PokemonSpeciesFilter} filter for eligible mons, applied to event encounter pool
 * @param isEventEncounter - {@linkcode BooleanHolder} to let the caller know if it pulled from an event
 * @returns The EnemyPokemon for the requested encounter
 */
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
