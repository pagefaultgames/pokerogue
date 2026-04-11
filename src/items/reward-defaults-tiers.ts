import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";

export const rewardRarities = {
  [RewardId.POKEBALL]: RarityTier.COMMON,
  [RewardId.GREAT_BALL]: RarityTier.GREAT,
  [RewardId.ULTRA_BALL]: RarityTier.ULTRA,
  [RewardId.ROGUE_BALL]: RarityTier.ROGUE,
  [RewardId.MASTER_BALL]: RarityTier.MASTER,

  [RewardId.VOUCHER]: RarityTier.GREAT,
  [RewardId.VOUCHER_PLUS]: RarityTier.ROGUE,
  [RewardId.VOUCHER_PREMIUM]: RarityTier.MASTER,

  [RewardId.NUGGET]: RarityTier.GREAT,
  [RewardId.BIG_NUGGET]: RarityTier.ULTRA,
  [RewardId.RELIC_GOLD]: RarityTier.ROGUE,

  [RewardId.RARE_CANDY]: RarityTier.COMMON,
  [RewardId.RARER_CANDY]: RarityTier.ULTRA,

  [RewardId.EVOLUTION_ITEM]: RarityTier.GREAT,
  [RewardId.RARE_EVOLUTION_ITEM]: RarityTier.ULTRA,

  [RewardId.POTION]: RarityTier.COMMON,
  [RewardId.SUPER_POTION]: RarityTier.COMMON,
  [RewardId.HYPER_POTION]: RarityTier.GREAT,
  [RewardId.MAX_POTION]: RarityTier.GREAT,
  [RewardId.FULL_HEAL]: RarityTier.GREAT,
  [RewardId.FULL_RESTORE]: RarityTier.GREAT,

  [RewardId.REVIVE]: RarityTier.GREAT,
  [RewardId.MAX_REVIVE]: RarityTier.GREAT,
  [RewardId.SACRED_ASH]: RarityTier.GREAT,

  [RewardId.ETHER]: RarityTier.COMMON,
  [RewardId.MAX_ETHER]: RarityTier.COMMON,

  [RewardId.ELIXIR]: RarityTier.GREAT,
  [RewardId.MAX_ELIXIR]: RarityTier.GREAT,

  [RewardId.PP_UP]: RarityTier.GREAT,
  [RewardId.PP_MAX]: RarityTier.ULTRA,

  [RewardId.TM_COMMON]: RarityTier.COMMON,
  [RewardId.TM_GREAT]: RarityTier.GREAT,
  [RewardId.TM_ULTRA]: RarityTier.ULTRA,

  [RewardId.MINT]: RarityTier.ULTRA,
  [RewardId.TERA_SHARD]: RarityTier.GREAT,
  [RewardId.MEMORY_MUSHROOM]: RarityTier.GREAT,
  [RewardId.DNA_SPLICERS]: RarityTier.MASTER,

  [RewardId.SPECIES_STAT_BOOSTER]: RarityTier.GREAT,
  [RewardId.RARE_SPECIES_STAT_BOOSTER]: RarityTier.ULTRA,
  [RewardId.VITAMIN]: RarityTier.GREAT,
  [RewardId.ATTACK_TYPE_BOOSTER]: RarityTier.ULTRA,
  [RewardId.BERRY]: RarityTier.COMMON,

  [RewardId.TEMP_STAT_STAGE_BOOSTER]: RarityTier.COMMON,
  [RewardId.LURE]: RarityTier.COMMON,
  [RewardId.SUPER_LURE]: RarityTier.GREAT,
  [RewardId.MAX_LURE]: RarityTier.ULTRA,

  [RewardId.FORM_CHANGE_ITEM]: RarityTier.ULTRA,
  [RewardId.RARE_FORM_CHANGE_ITEM]: RarityTier.ROGUE,
};

export function getRewardTier(reward: RewardId): RarityTier {
  const tier = rewardRarities[reward];
  return tier ?? RarityTier.LUXURY;
}
