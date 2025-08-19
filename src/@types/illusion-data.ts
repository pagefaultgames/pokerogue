import type { Gender } from "#data/gender";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { PokeballType } from "#enums/pokeball";
import type { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";

/**
 * Data pertaining to a Pokemon's Illusion.
 */
export interface IllusionData {
  /** The name of pokemon featured in the illusion */
  name: string;
  /** The nickname of the pokemon featured in the illusion */
  nickname?: string;
  /** Whether the pokemon featured in the illusion is shiny or not */
  shiny: boolean;
  /** The variant of the pokemon featured in the illusion */
  variant: Variant;
  /** The species of the illusion */
  species: SpeciesId;
  /** The formIndex of the illusion */
  formIndex: number;
  /** The gender of the illusion */
  gender: Gender;
  /** The pokeball of the illusion */
  pokeball: PokeballType;
  /** The fusion species of the illusion if it's a fusion */
  fusionSpecies?: PokemonSpecies;
  /** The fusionFormIndex of the illusion */
  fusionFormIndex?: number;
  /** Whether the fusion species of the pokemon featured in the illusion is shiny or not */
  fusionShiny?: boolean;
  /** The variant of the fusion species of the pokemon featured in the illusion */
  fusionVariant?: Variant;
  /** The fusionGender of the illusion if it's a fusion */
  fusionGender?: Gender;
  /** The level of the illusion (not used currently) */
  level?: number;
}
