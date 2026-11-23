// TODO: rename either the file or the enum to match each other
export enum RarityTier {
  COMMON,
  GREAT,
  ULTRA,
  ROGUE,
  MASTER,
  LUXURY,
}

/** Valid rarity tiers for reward pools. */
export type PoolRarityTier = Exclude<RarityTier, RarityTier.LUXURY>;
