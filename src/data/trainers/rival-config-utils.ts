import { SpeciesId } from "#enums/species-id";
import type { EnemyPokemon } from "#field/pokemon";

export function forceRivalStarterTraits(pokemon: EnemyPokemon): void {
  pokemon.abilityIndex = 0;
  pokemon.teraType = pokemon.species.type1;
}

/**
 * Post-process rival birds to override their sets
 *
 * @remarks
 * Currently used to force ability indices
 *
 * @param pokemon - The rival bird pokemon to force an ability for
 */
export function forceRivalBirdAbility(pokemon: EnemyPokemon): void {
  switch (pokemon.species.speciesId) {
    // Guts for Tailow line
    case SpeciesId.TAILLOW: // guts
    case SpeciesId.SWELLOW: // guts
    // Intimidate for Starly line
    case SpeciesId.STARLY:
    case SpeciesId.STARAVIA:
    case SpeciesId.STARAPTOR: {
      pokemon.abilityIndex = 0;
      break;
    }
    // Tangled Feet for Pidgey line
    case SpeciesId.PIDGEY:
    case SpeciesId.PIDGEOTTO:
    case SpeciesId.PIDGEOT:
    // Super Luck for pidove line
    case SpeciesId.PIDOVE:
    case SpeciesId.TRANQUILL:
    case SpeciesId.UNFEZANT:
    // Volt Absorb for Wattrel line
    case SpeciesId.WATTREL:
    case SpeciesId.KILOWATTREL: {
      pokemon.abilityIndex = 1;
      break;
    }
    // Tinted lens for Hoothoot line
    case SpeciesId.HOOTHOOT:
    case SpeciesId.NOCTOWL:
    // Skill link for Pikipek line
    case SpeciesId.PIKIPEK:
    case SpeciesId.TRUMBEAK:
    case SpeciesId.TOUCANNON:
    // Gale Wings for Fletchling line
    case SpeciesId.FLETCHLING:
    case SpeciesId.FLETCHINDER:
    case SpeciesId.TALONFLAME: {
      pokemon.abilityIndex = 2;
      break;
    }
  }
}
