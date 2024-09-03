/** Enum that comprises all possible stat-related attributes, in-battle and permanent, of a Pokemon. */
export enum Stat {
  /** Hit Points */
  HP = 0,
  /** Attack */
  ATK,
  /** Defense */
  DEF,
  /** Special Attack */
  SPATK,
  /** Special Defense */
  SPDEF,
  /** Speed */
  SPD,
  /** Accuracy */
  ACC,
  /** Evasiveness */
  EVA
}

/** A constant array comprised of the {@linkcode Stat} values that make up {@linkcode PermanentStat}. */
export const PERMANENT_STATS = [ Stat.HP, Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ] as const;
/** Type used to describe the core, permanent stats of a Pokemon. */
export type PermanentStat = typeof PERMANENT_STATS[number];

/** A constant array comprised of the {@linkcode Stat} values that make up {@linkcode EFfectiveStat}. */
export const EFFECTIVE_STATS = [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD ] as const;
/** Type used to describe the intersection of core stats and stats that have stages in battle. */
export type EffectiveStat = typeof EFFECTIVE_STATS[number];

/** A constant array comprised of {@linkcode Stat} the values that make up {@linkcode BattleStat}. */
export const BATTLE_STATS = [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD, Stat.ACC, Stat.EVA ] as const;
/** Type used to describe the stats that have stages which can be incremented and decremented in battle. */
export type BattleStat = typeof BATTLE_STATS[number];

/** A constant array comprised of {@linkcode Stat} the values that make up {@linkcode TempBattleStat}. */
export const TEMP_BATTLE_STATS = [ Stat.ATK, Stat.DEF, Stat.SPATK, Stat.SPDEF, Stat.SPD, Stat.ACC ] as const;
/** Type used to describe the stats that have X item (`TEMP_STAT_STAGE_BOOSTER`) equivalents. */
export type TempBattleStat = typeof TEMP_BATTLE_STATS[number];

/**
 * Provides the translation key corresponding to the amount of stat stages and whether those stat stages
 * are positive or negative.
 * @param stages the amount of stages
 * @param isIncrease dictates a negative (`false`) or a positive (`true`) stat stage change
 * @returns the translation key fitting the conditions described by {@linkcode stages} and {@linkcode isIncrease}
 */
export function getStatStageChangeDescriptionKey(stages: number, isIncrease: boolean) {
  if (stages === 1) {
    return isIncrease ? "battle:statRose" : "battle:statFell";
  } else if (stages === 2) {
    return isIncrease ? "battle:statSharplyRose" : "battle:statHarshlyFell";
  } else if (stages <= 6) {
    return isIncrease ? "battle:statRoseDrastically" : "battle:statSeverelyFell";
  }
  return isIncrease ? "battle:statWontGoAnyHigher" : "battle:statWontGoAnyLower";
}

/**
 * Provides the translation key corresponding to a given stat which can be translated into its full name.
 * @param stat the {@linkcode Stat} to be translated
 * @returns the translation key corresponding to the given {@linkcode Stat}
 */
export function getStatKey(stat: Stat) {
  return `pokemonInfo:Stat.${Stat[stat]}`;
}

/**
 * Provides the translation key corresponding to a given stat which can be translated into its shortened name.
 * @param stat the {@linkcode Stat} to be translated
 * @returns the translation key corresponding to the given {@linkcode Stat}
 */
export function getShortenedStatKey(stat: PermanentStat) {
  return `pokemonInfo:Stat.${Stat[stat]}shortened`;
}
