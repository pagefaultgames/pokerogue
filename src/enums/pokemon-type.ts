/**
 * A `PokemonType` represents the type of a Pokemon or its moves.
 *
 * @see {@link https://bulbapedia.bulbagarden.net/wiki/Type | Types on Bulbapedia}
 */
export enum PokemonType {
  /** Also known as typelessness. */
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

  STELLAR,
}

/** The largest legal value for a {@linkcode PokemonType} (includes Stellar) */
export const MAX_POKEMON_TYPE = PokemonType.STELLAR;
