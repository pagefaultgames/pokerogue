export enum PokemonType {
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
