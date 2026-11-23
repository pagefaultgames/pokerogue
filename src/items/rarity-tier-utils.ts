/**
 * Rarity tier primitives shared by held item pools and reward pools.
 * @module
 */

import { type PoolRarityTier, RarityTier } from "#enums/reward-tier";
import { randSeedInt } from "#utils/common";

/** Every {@linkcode PoolRarityTier}, in ascending order of rarity. */
export const POOL_RARITY_TIERS = [
  RarityTier.COMMON,
  RarityTier.GREAT,
  RarityTier.ULTRA,
  RarityTier.ROGUE,
  RarityTier.MASTER,
] as const satisfies readonly PoolRarityTier[];

type Assert<T extends true> = T;

// biome-ignore lint/correctness/noUnusedVariables: Compile time verifier
type EnsureAllPoolTiersListed = Assert<
  Exclude<PoolRarityTier, (typeof POOL_RARITY_TIERS)[number]> extends never ? true : false
>;

/**
 * @param tier - The tier to check
 * @returns Whether the numeric tier is a valid pool tier
 */
export function isPoolRarityTier(tier: number): tier is PoolRarityTier {
  return POOL_RARITY_TIERS.includes(tier);
}

/**
 * @param tier - The tier to clamp
 * @returns The tier clamped between common and master
 */
export function clampPoolRarityTier(tier: number): PoolRarityTier {
  return Phaser.Math.Clamp(tier, RarityTier.COMMON, RarityTier.MASTER) as PoolRarityTier;
}

/**
 * Create a record with one value per {@linkcode PoolRarityTier}.
 * @param init - Function producing the value for each tier
 *
 * @privateRemarks
 * This is useful because it applies to both rarity tiers and weights. I don't like the split parallel
 * structure, so it's likely that this is eventually removed.
 */
export function createTieredRecord<T>(init: (tier: PoolRarityTier) => T): Record<PoolRarityTier, T> {
  return {
    [RarityTier.COMMON]: init(RarityTier.COMMON),
    [RarityTier.GREAT]: init(RarityTier.GREAT),
    [RarityTier.ULTRA]: init(RarityTier.ULTRA),
    [RarityTier.ROGUE]: init(RarityTier.ROGUE),
    [RarityTier.MASTER]: init(RarityTier.MASTER),
  };
}

/**
 * Roll a random base rarity tier, used by both reward pools and enemy held item pools.
 *
 * Probability distribution (out of 1024):
 * - Common: 768/1024 (~75.00%)
 * - Great:  195/1024 (~19.04%)
 * - Ultra:   48/1024 (~4.69%)
 * - Rogue:   12/1024 (~1.17%)
 * - Master:   1/1024 (~0.098%)
 *
 * @returns The rolled {@linkcode PoolRarityTier}
 */
export function rollRarityTier(): PoolRarityTier {
  const tierValue = randSeedInt(1024);

  if (tierValue > 255) {
    return RarityTier.COMMON;
  }
  if (tierValue > 60) {
    return RarityTier.GREAT;
  }
  if (tierValue > 12) {
    return RarityTier.ULTRA;
  }
  if (tierValue > 0) {
    return RarityTier.ROGUE;
  }
  return RarityTier.MASTER;
}
