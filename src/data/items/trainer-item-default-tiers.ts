import { RarityTier } from "#enums/reward-tier";
import { TrainerItemId } from "#enums/trainer-item-id";

export const trainerItemRarities = {
  [TrainerItemId.MAP]: RarityTier.COMMON,
  [TrainerItemId.IV_SCANNER]: RarityTier.ULTRA,
  [TrainerItemId.LOCK_CAPSULE]: RarityTier.ROGUE,
  [TrainerItemId.MEGA_BRACELET]: RarityTier.ROGUE,
  [TrainerItemId.DYNAMAX_BAND]: RarityTier.ROGUE,
  [TrainerItemId.TERA_ORB]: RarityTier.ULTRA,

  [TrainerItemId.GOLDEN_POKEBALL]: RarityTier.LUXURY,

  [TrainerItemId.OVAL_CHARM]: RarityTier.LUXURY,
  [TrainerItemId.EXP_SHARE]: RarityTier.ULTRA,
  [TrainerItemId.EXP_BALANCE]: RarityTier.LUXURY,

  [TrainerItemId.CANDY_JAR]: RarityTier.ULTRA,
  [TrainerItemId.BERRY_POUCH]: RarityTier.ROGUE,

  [TrainerItemId.HEALING_CHARM]: RarityTier.MASTER,
  [TrainerItemId.EXP_CHARM]: RarityTier.ULTRA,
  [TrainerItemId.SUPER_EXP_CHARM]: RarityTier.ROGUE,
  [TrainerItemId.GOLDEN_EXP_CHARM]: RarityTier.LUXURY,
  [TrainerItemId.AMULET_COIN]: RarityTier.ULTRA,

  [TrainerItemId.ABILITY_CHARM]: RarityTier.ULTRA,
  [TrainerItemId.SHINY_CHARM]: RarityTier.MASTER,
  [TrainerItemId.CATCHING_CHARM]: RarityTier.ULTRA,

  [TrainerItemId.BLACK_SLUDGE]: RarityTier.LUXURY,
  [TrainerItemId.GOLDEN_BUG_NET]: RarityTier.LUXURY,

  [TrainerItemId.LURE]: RarityTier.COMMON,
  [TrainerItemId.SUPER_LURE]: RarityTier.GREAT,
  [TrainerItemId.MAX_LURE]: RarityTier.ULTRA,

  [TrainerItemId.X_ATTACK]: RarityTier.COMMON,
  [TrainerItemId.X_DEFENSE]: RarityTier.COMMON,
  [TrainerItemId.X_SP_ATK]: RarityTier.COMMON,
  [TrainerItemId.X_SP_DEF]: RarityTier.COMMON,
  [TrainerItemId.X_SPEED]: RarityTier.COMMON,
  [TrainerItemId.X_ACCURACY]: RarityTier.COMMON,
  [TrainerItemId.DIRE_HIT]: RarityTier.GREAT,
};

export function getTrainerItemTier(item: TrainerItemId): RarityTier {
  const tier = trainerItemRarities[item];
  return tier ?? RarityTier.LUXURY;
}
