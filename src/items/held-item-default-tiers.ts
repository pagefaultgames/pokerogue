import { getHeldItemCategory, HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import { RarityTier } from "#enums/reward-tier";

export const heldItemRarities = {
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
  [HeldItemId.BATON]: RarityTier.ROGUE,
  [HeldItemId.GOLDEN_EGG]: RarityTier.ULTRA,

  [HeldItemId.MINI_BLACK_HOLE]: RarityTier.MASTER,
  [HeldItemId.MULTI_LENS]: RarityTier.MASTER,
};

export function getHeldItemTier(item: HeldItemId): RarityTier {
  let tier = heldItemRarities[item];
  if (!tier) {
    const category = getHeldItemCategory(item);
    tier = heldItemRarities[category];
  }
  return tier ?? RarityTier.LUXURY;
}
