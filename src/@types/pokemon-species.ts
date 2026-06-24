import type { SpeciesFormEvolution } from "#balance/pokemon-evolutions";
import type { SpeciesFormChange } from "#data/pokemon-forms";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { AbilityId } from "#enums/ability-id";
import type { EggTier } from "#enums/egg-type";
import type { LearnableMoveSource } from "#enums/learnable-move-source";
import type { MoveId } from "#enums/move-id";
import type { SpeciesId } from "#enums/species-id";

/**
 * Mapping of formIndex to passive ability for species with multiple passives.
 */
interface PokemonSpeciesPassives {
  [key: number]: AbilityId;
}

export type LevelMoves = [level: number, move: MoveId][];
export type LevelMovesWithSource = [level: number, move: MoveId, source: LearnableMoveSource][];

export interface SpeciesFormLevelMoves {
  [key: string]: LevelMoves;
}

export interface SpeciesFormTmMoves {
  [key: string]: MoveId[];
}

export interface PokemonSpeciesData {
  species: PokemonSpecies;
  starter: SpeciesId;
  /** The starter cost. Should be omitted for non starters */
  starterCost?: number;
  evolutions: SpeciesFormEvolution[];
  prevolution: SpeciesId | null;
  formChanges?: SpeciesFormChange[];
  /** The egg tier of the Pokémon. Should be omitted for non starters */
  eggTier?: EggTier;
  /** The passive ability of the species or a mapping of its formIndex to a passive ability */
  passives: AbilityId | PokemonSpeciesPassives;
  /** An array of level moves shared across **all** forms */
  levelMoves: LevelMoves;
  /** Form specific level moves. Record of formKey to an array of level moves */
  formLevelMoves?: SpeciesFormLevelMoves;
  /** An array of TM moves shared across **all** forms */
  tms: MoveId[];
  /** Form specific TM moves. Record of `formKey` to an array of TM moves */
  formTms?: SpeciesFormTmMoves;
}

export type SpeciesDataMap = Record<SpeciesId, PokemonSpeciesData>;
/**
 * The `prevolution` field is set on load based on the evolutions of the starter and doesn't need to be configured
 */
export type SpeciesDataMapConfig = Record<SpeciesId, Omit<PokemonSpeciesData, "prevolution">>;
