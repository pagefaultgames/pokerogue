import { heldItemRarities } from "#data/items/held-item-default-tiers";
import { rewardRarities } from "#data/items/reward-defaults-tiers";
import { trainerItemRarities } from "#data/items/trainer-item-default-tiers";
import type { HeldItemId } from "#enums/held-item-id";
import { getRewardCategory, RewardCategoryId, RewardId } from "#enums/reward-id";
import type { RarityTier } from "#enums/reward-tier";
import type { TrainerItemId } from "#enums/trainer-item-id";
import { allRewards } from "#items/all-rewards";
import type { RewardPoolId, RewardSpecs } from "#types/rewards";
import { EmptyReward, type PokemonMoveReward, type Reward, RewardGenerator, RewardOption } from "./reward";
import { HeldItemReward } from "./rewards/held-item-reward";
import type { RememberMoveReward } from "./rewards/remember-move";
import type { TmReward } from "./rewards/tm";
import { TrainerItemReward } from "./rewards/trainer-item-reward";

export function isTmReward(reward: Reward): reward is TmReward {
  return getRewardCategory(reward.id) === RewardCategoryId.TM;
}

export function isMoveReward(reward: Reward): reward is PokemonMoveReward {
  const categoryId = getRewardCategory(reward.id);
  return categoryId === RewardCategoryId.ETHER || categoryId === RewardCategoryId.PP_UP;
}

export function isRememberMoveReward(reward: Reward): reward is RememberMoveReward {
  return reward.id === RewardId.MEMORY_MUSHROOM;
}

/**
 * Dynamically generate a {@linkcode RewardOption} from a given RewardSpecs.
 * @param specs - The {@linkcode RewardSpecs} used to generate the reward
 * @param cost - The monetary cost of selecting the option; default `0`
 * @param tierOverride - An optional {@linkcode RarityTier} to override the option's rarity
 * @param upgradeCount - The number of tier upgrades having occurred; default `0`
 * @returns The generated {@linkcode RewardOption}, or `null` if no reward could be generated
 * @todo Remove `null` from signature eventually
 */
export function generateRewardOptionFromId<T extends RewardPoolId>(
  specs: RewardSpecs<T>,
  cost = 0,
  tierOverride?: RarityTier,
  upgradeCount = 0,
): RewardOption {
  // Destructure specs into individual parameters
  const pregenArgs = typeof specs === "object" ? specs.args : undefined;
  const id: RewardPoolId = typeof specs === "object" ? specs.id : specs;

  if (isHeldItemId(id)) {
    const reward = new HeldItemReward(id);
    const tier = tierOverride ?? heldItemRarities[id];
    return new RewardOption(reward, upgradeCount, tier, cost);
  }

  if (isTrainerItemId(id)) {
    const reward = new TrainerItemReward(id);
    const tier = tierOverride ?? trainerItemRarities[id];
    return new RewardOption(reward, upgradeCount, tier, cost);
  }

  const tempReward = allRewards[id] as Reward | RewardGenerator;
  let reward = tempReward instanceof RewardGenerator ? tempReward.generateReward(pregenArgs) : tempReward;
  if (!reward) {
    reward = new EmptyReward();
  }
  const tier = tierOverride ?? rewardRarities[id];
  return new RewardOption(reward, upgradeCount, tier, cost);
}

export function getPlayerShopRewardOptionsForWave(waveIndex: number, baseCost: number): RewardOption[] {
  if (!(waveIndex % 10)) {
    return [];
  }

  const options = [
    [
      generateRewardOptionFromId(RewardId.POTION, baseCost * 0.2),
      generateRewardOptionFromId(RewardId.ETHER, baseCost * 0.4),
      generateRewardOptionFromId(RewardId.REVIVE, baseCost * 2),
    ],
    [
      generateRewardOptionFromId(RewardId.SUPER_POTION, baseCost * 0.45),
      generateRewardOptionFromId(RewardId.FULL_HEAL, baseCost),
    ],
    [generateRewardOptionFromId(RewardId.ELIXIR, baseCost), generateRewardOptionFromId(RewardId.MAX_ETHER, baseCost)],
    [
      generateRewardOptionFromId(RewardId.HYPER_POTION, baseCost * 0.8),
      generateRewardOptionFromId(RewardId.MAX_REVIVE, baseCost * 2.75),
      generateRewardOptionFromId(RewardId.MEMORY_MUSHROOM, baseCost * 4),
    ],
    [
      generateRewardOptionFromId(RewardId.MAX_POTION, baseCost * 1.5),
      generateRewardOptionFromId(RewardId.MAX_ELIXIR, baseCost * 2.5),
    ],
    [generateRewardOptionFromId(RewardId.FULL_RESTORE, baseCost * 2.25)],
    [generateRewardOptionFromId(RewardId.SACRED_ASH, baseCost * 10)],
  ];
  return options.slice(0, Math.ceil(Math.max(waveIndex + 10, 0) / 30)).flat();
}

export function isRewardId(id: RewardPoolId): id is RewardId {
  return id > 0x2000;
}

export function isTrainerItemId(id: RewardPoolId): id is TrainerItemId {
  return id > 0x1000 && id < 0x2000;
}

export function isHeldItemId(id: RewardPoolId): id is HeldItemId {
  return id < 0x1000;
}
