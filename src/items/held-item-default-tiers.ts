import { HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import { RarityTier } from "#enums/reward-tier";
import { getHeldItemCategory } from "#utils/item-utils";

/** Default rarity tiers for held items, by item or (as a fallback) by category. */
const heldItemRarities: Readonly<Partial<Record<HeldItemId | HeldItemCategoryId, RarityTier>>> = {
  [HeldItemCategoryId.BERRY]: RarityTier.COMMON,

  [HeldItemCategoryId.BASE_STAT_BOOST]: RarityTier.GREAT,
  [HeldItemId.WHITE_HERB]: RarityTier.GREAT,
  [HeldItemId.METAL_POWDER]: RarityTier.GREAT,
  [HeldItemId.QUICK_POWDER]: RarityTier.GREAT,
  [HeldItemId.DEEP_SEA_SCALE]: RarityTier.GREAT,
  [HeldItemId.DEEP_SEA_TOOTH]: RarityTier.GREAT,
  [HeldItemId.SOOTHE_BELL]: RarityTier.GREAT,

  [HeldItemCategoryId.TYPE_ATTACK_BOOSTER]: RarityTier.ULTRA,
  [HeldItemId.REVIVER_SEED]: RarityTier.ULTRA,
  [HeldItemId.LIGHT_BALL]: RarityTier.ULTRA,
  [HeldItemId.EVIOLITE]: RarityTier.ULTRA,
  [HeldItemId.QUICK_CLAW]: RarityTier.ULTRA,
  [HeldItemId.MYSTICAL_ROCK]: RarityTier.ULTRA,
  [HeldItemId.WIDE_LENS]: RarityTier.ULTRA,
  [HeldItemId.GOLDEN_PUNCH]: RarityTier.ULTRA,
  [HeldItemId.TOXIC_ORB]: RarityTier.ULTRA,
  [HeldItemId.FLAME_ORB]: RarityTier.ULTRA,
  [HeldItemId.LUCKY_EGG]: RarityTier.ULTRA,

  [HeldItemId.FOCUS_BAND]: RarityTier.ROGUE,
  [HeldItemId.KINGS_ROCK]: RarityTier.ROGUE,
  [HeldItemId.LEFTOVERS]: RarityTier.ROGUE,
  [HeldItemId.SHELL_BELL]: RarityTier.ROGUE,
  [HeldItemId.GRIP_CLAW]: RarityTier.ROGUE,
  [HeldItemId.SOUL_DEW]: RarityTier.ROGUE,
  [HeldItemId.SCOPE_LENS]: RarityTier.ROGUE,
  [HeldItemId.BATON]: RarityTier.ROGUE,
  [HeldItemId.GOLDEN_EGG]: RarityTier.ROGUE,

  [HeldItemId.MINI_BLACK_HOLE]: RarityTier.MASTER,
  [HeldItemId.MULTI_LENS]: RarityTier.MASTER,
} as const;

/**
 * Get the default rarity tier of a held item.
 * @param item - The {@linkcode HeldItemId} to look up
 * @returns The default rarity tier of the item, falling back to its category then {@linkcode RarityTier.LUXURY}
 */
export function getHeldItemTier(item: HeldItemId): RarityTier {
  return heldItemRarities[item] ?? heldItemRarities[getHeldItemCategory(item)] ?? RarityTier.LUXURY;
}
