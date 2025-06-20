import { getHeldItemCategory, HeldItemCategoryId, HeldItemId } from "#enums/held-item-id";
import { RewardTier } from "#enums/reward-tier";

export const heldItemTiers = {
  [HeldItemCategoryId.BERRY]: RewardTier.COMMON,

  [HeldItemCategoryId.BASE_STAT_BOOST]: RewardTier.GREAT,
  [HeldItemId.WHITE_HERB]: RewardTier.GREAT,
  [HeldItemId.METAL_POWDER]: RewardTier.GREAT,
  [HeldItemId.QUICK_POWDER]: RewardTier.GREAT,
  [HeldItemId.DEEP_SEA_SCALE]: RewardTier.GREAT,
  [HeldItemId.DEEP_SEA_TOOTH]: RewardTier.GREAT,
  [HeldItemId.SOOTHE_BELL]: RewardTier.GREAT,

  [HeldItemCategoryId.TYPE_ATTACK_BOOSTER]: RewardTier.ULTRA,
  [HeldItemId.REVIVER_SEED]: RewardTier.ULTRA,
  [HeldItemId.LIGHT_BALL]: RewardTier.ULTRA,
  [HeldItemId.EVIOLITE]: RewardTier.ULTRA,
  [HeldItemId.QUICK_CLAW]: RewardTier.ULTRA,
  [HeldItemId.MYSTICAL_ROCK]: RewardTier.ULTRA,
  [HeldItemId.WIDE_LENS]: RewardTier.ULTRA,
  [HeldItemId.GOLDEN_PUNCH]: RewardTier.ULTRA,
  [HeldItemId.TOXIC_ORB]: RewardTier.ULTRA,
  [HeldItemId.FLAME_ORB]: RewardTier.ULTRA,
  [HeldItemId.LUCKY_EGG]: RewardTier.ULTRA,

  [HeldItemId.FOCUS_BAND]: RewardTier.ROGUE,
  [HeldItemId.KINGS_ROCK]: RewardTier.ROGUE,
  [HeldItemId.LEFTOVERS]: RewardTier.ROGUE,
  [HeldItemId.SHELL_BELL]: RewardTier.ROGUE,
  [HeldItemId.GRIP_CLAW]: RewardTier.ROGUE,
  [HeldItemId.SOUL_DEW]: RewardTier.ROGUE,
  [HeldItemId.BATON]: RewardTier.ROGUE,
  [HeldItemId.GOLDEN_EGG]: RewardTier.ULTRA,

  [HeldItemId.MINI_BLACK_HOLE]: RewardTier.MASTER,
  [HeldItemId.MULTI_LENS]: RewardTier.MASTER,
};

export function getHeldItemTier(item: HeldItemId): RewardTier | undefined {
  let tier = heldItemTiers[item];
  if (!tier) {
    const category = getHeldItemCategory(item);
    tier = heldItemTiers[category];
  }
  return tier;
}
