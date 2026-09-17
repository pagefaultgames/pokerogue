/**
 * A `PokemonType` represents the type of a Pokemon or its moves.
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Type}
 */
export enum PokemonType {
  /** Also known as {@link https://bulbapedia.bulbagarden.net/wiki/Type#Typeless | typeless}. */
  UNKNOWN = -1,

  NORMAL = 0,
  FIGHTING,
  FLYING,
  POISON,
  GROUND,
  ROCK,
  BUG,
  GHOST,
  STEEL,
  FIRE,
  WATER,
  GRASS,
  ELECTRIC,
  PSYCHIC,
  ICE,
  DRAGON,
  DARK,
  FAIRY,

  /**
   * A pseudo-type used for Terastallization.
   * @see {@link https://bulbapedia.bulbagarden.net/wiki/Stellar_(type)}
   */
  STELLAR,
}

/** Types that a Pokemon can naturally have; excludes Typeless and Stellar */
export type RegularPokemonType = Exclude<PokemonType, PokemonType.UNKNOWN | PokemonType.STELLAR>;

/** The smallest legal value for a {@linkcode PokemonType} (excludes Typeless) */
export const MIN_REGULAR_POKEMON_TYPE = PokemonType.NORMAL;

/** The largest legal value for a {@linkcode PokemonType} (excludes Stellar) */
export const MAX_REGULAR_POKEMON_TYPE = PokemonType.FAIRY;

/** The largest legal value for a {@linkcode PokemonType} (includes Stellar) */
export const MAX_POKEMON_TYPE = PokemonType.STELLAR;
