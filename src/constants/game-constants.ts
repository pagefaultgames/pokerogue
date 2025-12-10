import { SpeciesId } from "#enums/species-id";

/** The maximum size of the player's party */
export const PLAYER_PARTY_MAX_SIZE: number = 6;

/** The default species that a new player can choose from */
export const DEFAULT_STARTER_SPECIES: readonly SpeciesId[] = [
  SpeciesId.BULBASAUR,
  SpeciesId.CHARMANDER,
  SpeciesId.SQUIRTLE,
  SpeciesId.CHIKORITA,
  SpeciesId.CYNDAQUIL,
  SpeciesId.TOTODILE,
  SpeciesId.TREECKO,
  SpeciesId.TORCHIC,
  SpeciesId.MUDKIP,
  SpeciesId.TURTWIG,
  SpeciesId.CHIMCHAR,
  SpeciesId.PIPLUP,
  SpeciesId.SNIVY,
  SpeciesId.TEPIG,
  SpeciesId.OSHAWOTT,
  SpeciesId.CHESPIN,
  SpeciesId.FENNEKIN,
  SpeciesId.FROAKIE,
  SpeciesId.ROWLET,
  SpeciesId.LITTEN,
  SpeciesId.POPPLIO,
  SpeciesId.GROOKEY,
  SpeciesId.SCORBUNNY,
  SpeciesId.SOBBLE,
  SpeciesId.SPRIGATITO,
  SpeciesId.FUECOCO,
  SpeciesId.QUAXLY,
];

/**
 * The maximum number of times a player can Terastallize between Tera Orb resets
 * (which normally happens after every 10th wave)
 */
export const MAX_TERAS_PER_ARENA = 1;

/**
 * The ceiling on friendship amount that can be reached through the use of rare candies. \
 * Using rare candies will never increase friendship beyond this value.
 */
export const RARE_CANDY_FRIENDSHIP_CAP = 200;

export const MAX_PER_TYPE_POKEBALLS: number = 99;
