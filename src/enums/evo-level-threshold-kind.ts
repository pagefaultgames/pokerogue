import type { EvoLevelThreshold } from "#types/species-gen-types";

/**
 * Enum for the different evolution level threholds based on the encounter type
 * @see {@linkcode EvoLevelThreshold}
 */
export const EvoLevelThresholdKind = Object.freeze({
  /** Meant to be used for Gym Leaders and Evil Admins */
  STRONG: 0,
  /** Normal trainers and Boss Pokémon */
  NORMAL: 1,
  /** Non-boss Pokémon encountered in the wild */
  WILD: 2,
});

/** {@inheritdoc EvoLevelThresholdKind} */
export type EvoLevelThresholdKind = (typeof EvoLevelThresholdKind)[keyof typeof EvoLevelThresholdKind];
