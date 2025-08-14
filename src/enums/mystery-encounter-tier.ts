/**
 * Enum values are base spawn weights of each tier.
 * The weights aim for 46.25/31.25/18.5/4% spawn ratios, AFTER accounting for anti-variance and pity mechanisms
 */
export enum MysteryEncounterTier {
  COMMON = 66,
  GREAT = 40,
  ULTRA = 19,
  ROGUE = 3,
  MASTER = 0, // Not currently used
}
