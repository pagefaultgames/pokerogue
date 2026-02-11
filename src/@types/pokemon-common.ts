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

export interface IncludeSpecialSpeciesParams {
  /**
   * Whether to include legendaries.
   * @defaultValue `false`
   */
  legendary?: boolean;
  /**
   * Whether to include sub-legendaries.
   * @defaultValue `false`
   */
  subLegendary?: boolean;
  /**
   * Whether to include mythicals.
   * @defaultValue `false`
   */
  mythical?: boolean;
  /**
   * Whether to include Paradox Mons. Note that this does not include Koraidon/Miraidon.
   * @defaultValue `false`
   */
  paradox?: boolean;
  /**
   * Whether to include Ultra Beasts. Note that the Cosmog line and Necrozma are NOT Ultra Beasts.
   * @defaultValue `false`
   */
  ultraBeast?: boolean;
}

export interface RandomEncounterParams {
  /** The level of the mon */
  level: number;

  /** A custom function used to return the {@linkcode PokemonSpecies} to generate */
  speciesFunction?: () => PokemonSpecies;

  /**
   * Whether the Pokemon should be a Boss.
   * @defaultValue `false`
   */
  isBoss?: boolean;

  includeSpeciesGroups?: IncludeSpecialSpeciesParams;

  /**
   * The chance out of 100 to pick an event encounter
   * @defaultValue `50`
   */
  eventChance?: number;

  /**
   * Number of rerolls for Hidden Ability (HA) that should be attempted
   * @defaultValue `0`
   */
  hiddenRerolls?: number;

  /**
   * Number of rerolls for shininess/variants that should be attempted
   * @defaultValue `0`
   */
  shinyRerolls?: number;

  /**
   * Number of extra HA rerolls for event mons
   * @defaultValue `0`
   */
  eventHiddenRerolls?: number;

  /**
   * Number of extra shiny rerolls for event mons
   * @defaultValue `0`
   */
  eventShinyRerolls?: number;

  /**
   * The overridden HA chance, defaults to base
   */
  hiddenAbilityChance?: number;

  /**
   * The overridden shiny chance, defaults to base
   */
  shinyChance?: number;

  /**
   * The max shiny threshold after modifiers are applied. Values below 1 mean no maximum
   * @defaultValue `0` (no maximum)
   */
  maxShinyChance?: number;

  /**
   * An optional filter for eligible mons, applied to the event encounter pool.
   * If omitted, no filter will be applied.
   */
  speciesFilter?: PokemonSpeciesFilter;

  /** An optional {@linkcode BooleanHolder} used to let the caller know if it pulled from an event. */
  isEventEncounter?: BooleanHolder;
}
