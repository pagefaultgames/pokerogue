import type { Gender } from "#data/gender";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { PokeballType } from "#enums/pokeball";
import type { SpeciesId } from "#enums/species-id";
import type { Variant } from "#sprites/variant";

/**
 * Data pertaining to a Pokemon's Illusion.
 */
export interface IllusionData {
  basePokemon: {
    /** The actual name of the Pokemon */
    name: string;
    /** The actual nickname of the Pokemon */
    nickname: string;
    /** Whether the base pokemon is shiny or not */
    shiny: boolean;
    /** The shiny variant of the base pokemon */
    variant: Variant;
    /** Whether the fusion species of the base pokemon is shiny or not */
    fusionShiny: boolean;
    /** The variant of the fusion species of the base pokemon */
    fusionVariant: Variant;
  };
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
  /** The fusionGender of the illusion if it's a fusion */
  fusionGender?: Gender;
  /** The level of the illusion (not used currently) */
  level?: number;
}
