/** The min and max waves for mystery encounters to spawn in classic mode */
export const ME_CLASSIC_MODE_WAVES: [number, number] = [10, 180] as const;

/** The min and max waves for mystery encounters to spawn in challenge mode */
export const ME_CHALLENGE_MODE_WAVES: [number, number] = [10, 180] as const;

/**
 * Spawn chance: (`ME_BASE_SPAWN_WEIGHT +` {@linkcode ME_WEIGHT_INCREMENT_ON_SPAWN_MISS} `*` `<number of missed spawns>`) `/` {@linkcode ME_MAX_SPAWN_WEIGHT}
 */
export const ME_BASE_SPAWN_WEIGHT = 3;

/**
 * The divisor for determining ME spawns, defines the "maximum" weight required for a spawn.
 * @remarks
 * If `spawn_weight === ME_MAX_SPAWN_WEIGHT`, 100% chance to spawn a ME
 */
export const ME_MAX_SPAWN_WEIGHT = 256;

/**
 * When an ME spawn roll fails, this is added to future rolls for ME spawn checks.
 * @remarks
 * These values are cleared whenever the next ME spawns,
 * and spawn weight returns to {@linkcode ME_BASE_SPAWN_WEIGHT}
 */
export const ME_WEIGHT_INCREMENT_ON_SPAWN_MISS = 3;

/**
 * Specifies the target average for total ME spawns in a single Classic run.
 * @remarks
 * Used by the anti-variance mechanic to check whether a run is above or below the target on a given wave.
 */
export const ME_AVERAGE_ENCOUNTERS_PER_RUN_TARGET = 12;

/**
 * Will increase/decrease the chance of spawning a ME based on
 * the current run's total MEs encountered vs {@linkcode ME_AVERAGE_ENCOUNTERS_PER_RUN_TARGET}
 * @example
 * ```text
 * Average-Encounters-Per-Run = 17 (expects avg 1 ME every 10 floors)
 * Anti-Variance-Weight = 15
 *
 * On wave 20, if 1 ME has been encountered, the difference from expected average is 0 MEs.
 * So anti-variance adds 0/256 to the spawn weight check for ME spawn.
 *
 * On wave 20, if 0 MEs have been encountered, the difference from expected average is 1 ME.
 * So anti-variance adds 15/256 to the spawn weight check for ME spawn.
 *
 * On wave 20, if 2 MEs have been encountered, the difference from expected average is -1 ME.
 * So anti-variance adds -15/256 to the spawn weight check for ME spawn.
 * ```
 */
export const ME_ANTI_VARIANCE_WEIGHT_MODIFIER = 15;
