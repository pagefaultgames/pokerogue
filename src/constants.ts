import { SpeciesId } from "#enums/species-id";

/** The maximum size of the player's party */
export const PLAYER_PARTY_MAX_SIZE: number = 6;

/** Whether to use seasonal splash messages in general */
export const USE_SEASONAL_SPLASH_MESSAGES: boolean = true;

/** Name of the session ID cookie */
export const SESSION_ID_COOKIE_NAME: string = "pokerogue_sessionId";

/** Max value for an integer attribute in {@linkcode SystemSaveData} */
export const MAX_INT_ATTR_VALUE = 0x80000000;

/** The min and max waves for mystery encounters to spawn in classic mode */
export const CLASSIC_MODE_MYSTERY_ENCOUNTER_WAVES: [number, number] = [10, 180] as const;
/** The min and max waves for mystery encounters to spawn in challenge mode */
export const CHALLENGE_MODE_MYSTERY_ENCOUNTER_WAVES: [number, number] = [10, 180] as const;

/** The raw percentage power boost for type boost items*/
export const TYPE_BOOST_ITEM_BOOST_PERCENT = 20;

/**
 * The default species that a new player can choose from
 */
export const defaultStarterSpecies: SpeciesId[] = [
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

export const saveKey = "x0i2O7WRiANTqPmZ"; // Temporary; secure encryption is not yet necessary

/**
 * Spawn chance: (BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT + WIGHT_INCREMENT_ON_SPAWN_MISS * <number of missed spawns>) / MYSTERY_ENCOUNTER_SPAWN_MAX_WEIGHT
 */
export const BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT = 3;

/**
 * The divisor for determining ME spawns, defines the "maximum" weight required for a spawn
 * If spawn_weight === MYSTERY_ENCOUNTER_SPAWN_MAX_WEIGHT, 100% chance to spawn a ME
 */
export const MYSTERY_ENCOUNTER_SPAWN_MAX_WEIGHT = 256;

/**
 * When an ME spawn roll fails, WEIGHT_INCREMENT_ON_SPAWN_MISS is added to future rolls for ME spawn checks.
 * These values are cleared whenever the next ME spawns, and spawn weight returns to BASE_MYSTERY_ENCOUNTER_SPAWN_WEIGHT
 */
export const WEIGHT_INCREMENT_ON_SPAWN_MISS = 3;

/**
 * Specifies the target average for total ME spawns in a single Classic run.
 * Used by anti-variance mechanic to check whether a run is above or below the target on a given wave.
 */
export const AVERAGE_ENCOUNTERS_PER_RUN_TARGET = 12;

/**
 * Will increase/decrease the chance of spawning a ME based on the current run's total MEs encountered vs AVERAGE_ENCOUNTERS_PER_RUN_TARGET
 * Example:
 * AVERAGE_ENCOUNTERS_PER_RUN_TARGET = 17 (expects avg 1 ME every 10 floors)
 * ANTI_VARIANCE_WEIGHT_MODIFIER = 15
 *
 * On wave 20, if 1 ME has been encountered, the difference from expected average is 0 MEs.
 * So anti-variance adds 0/256 to the spawn weight check for ME spawn.
 *
 * On wave 20, if 0 MEs have been encountered, the difference from expected average is 1 ME.
 * So anti-variance adds 15/256 to the spawn weight check for ME spawn.
 *
 * On wave 20, if 2 MEs have been encountered, the difference from expected average is -1 ME.
 * So anti-variance adds -15/256 to the spawn weight check for ME spawn.
 */
export const ANTI_VARIANCE_WEIGHT_MODIFIER = 15;

/**
 * The chance (out of 1) that a different title logo will show when the title screen is drawn.
 * Inverted during April Fools (such that this becomes the chance for the _normal_ title logo is displayed).
 * Default: `10000` (0.01%)
 */
export const FAKE_TITLE_LOGO_CHANCE = 10000;

/**
 * The ceiling on friendship amount that can be reached through the use of rare candies.
 * Using rare candies will never increase friendship beyond this value.
 */
export const RARE_CANDY_FRIENDSHIP_CAP = 200;
