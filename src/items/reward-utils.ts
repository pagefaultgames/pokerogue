import { audioManager } from "#app/global-audio-manager";
import { ChallengeType } from "#enums/challenge-type";
import { isHeldItemId, isTrainerItemId, RewardCategoryId, RewardId } from "#enums/reward-id";
import type { RarityTier } from "#enums/reward-tier";
import { allRewards } from "#items/all-rewards";
import type { EvolutionItemReward } from "#items/evolution-item";
import type { FormChangeItemReward } from "#items/form-change";
import { getHeldItemTier } from "#items/held-item-default-tiers";
import { getRewardTier } from "#items/reward-defaults-tiers";
import { getTrainerItemTier } from "#items/trainer-item-default-tiers";
import type { RewardConfiguration, RewardMatchKey, RewardPoolId } from "#types/rewards";
import type { Exact } from "#types/type-helpers";
import { applyChallenges } from "#utils/challenge-utils";
import { ValueHolder } from "#utils/value-holder";
import { type PokemonMoveReward, type Reward, RewardGenerator, RewardOption } from "./reward";
import { HeldItemReward } from "./rewards/held-item-reward";
import type { RememberMoveReward } from "./rewards/remember-move";
import type { TmReward } from "./rewards/tm";
import { TrainerItemReward } from "./rewards/trainer-item-reward";

export function isTmReward(reward: Reward): reward is TmReward {
  return reward.category === RewardCategoryId.TM;
}

export function isMoveReward(reward: Reward): reward is PokemonMoveReward {
  const { category } = reward;
  return category === RewardCategoryId.ETHER || category === RewardCategoryId.PP_UP;
}

export function isRememberMoveReward(reward: Reward): reward is RememberMoveReward {
  return reward.id === RewardId.MEMORY_MUSHROOM;
}

export function isEvolutionItemReward(reward: Reward): reward is EvolutionItemReward {
  return reward.category === RewardCategoryId.EVOLUTION_ITEM;
}

export function isFormChangeItemReward(reward: Reward): reward is FormChangeItemReward {
  return reward.category === RewardCategoryId.FORM_CHANGE_ITEM;
}

export function applyReward<T extends Reward>(
  reward: T,
  params: Exact<Parameters<T["apply"]>[0]>,
  playSound?: boolean,
): boolean {
  const { soundName } = reward;

  if (playSound) {
    audioManager.playSound(soundName);
  }

  if (!reward.shouldApply(params)) {
    return false;
  }

  reward.apply(params);
  return true;
}

/**
 * Get the rarity tier a pool ID is presented with when it is not drawn from a pool
 * (e.g. shop items, guaranteed rewards, overrides).
 * @param id - The {@linkcode RewardPoolId} to look up
 */
export function getDefaultRewardTier(id: RewardPoolId): RarityTier {
  if (isHeldItemId(id)) {
    return getHeldItemTier(id);
  }
  if (isTrainerItemId(id)) {
    return getTrainerItemTier(id);
  }
  return getRewardTier(id);
}

/**
 * Create a {@linkcode Reward} from a {@linkcode RewardConfiguration}.
 * @param specs - The {@linkcode RewardConfiguration} to resolve
 * @param exclusions - Match keys excluded during random generation
 * @returns The reward, or `null` if a generator has no available variants
 */
export function createRewardFromSpecs(
  specs: RewardConfiguration,
  exclusions?: ReadonlySet<RewardMatchKey>,
): Reward | null {
  const id: RewardPoolId = typeof specs === "object" ? specs.id : specs;
  const args: unknown = typeof specs === "object" ? specs.args : undefined;

  if (isHeldItemId(id)) {
    return new HeldItemReward(id);
  }
  if (isTrainerItemId(id)) {
    return new TrainerItemReward(id);
  }

  const entry = allRewards[id];
  if (!(entry instanceof RewardGenerator)) {
    return entry;
  }
  if (args === undefined) {
    return entry.generateRandomReward(exclusions);
  }
  // `RewardSpecs` guarantees `args` matches this generator's variant type at the call site,
  // but TS cannot carry that relationship through the id -> generator lookup.
  return (entry as RewardGenerator).generateReward(args);
}

/**
 * Dynamically generate a {@linkcode RewardOption} from a given {@linkcode RewardConfiguration}.
 * @param config - The {@linkcode RewardConfiguration} used to generate the reward
 * @param cost - The monetary cost of selecting the option; default `0`
 * @param tierOverride - An optional {@linkcode RarityTier} to override the option's default rarity
 * @param upgradeCount - The number of tier upgrades having occurred; default `0`
 * @returns The generated {@linkcode RewardOption}, or `null` if `specs` names a generator with no available variants
 */
export function generateRewardOptionFromId(
  config: RewardConfiguration,
  cost = 0,
  tierOverride?: RarityTier,
  upgradeCount = 0,
): RewardOption | null {
  const reward = createRewardFromSpecs(config);
  if (!reward) {
    return null;
  }
  const id: RewardPoolId = typeof config === "object" ? config.id : config;
  return new RewardOption(reward, upgradeCount, tierOverride ?? getDefaultRewardTier(id), cost);
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
  return options
    .slice(0, Math.ceil(Math.max(waveIndex + 10, 0) / 30))
    .flat()
    .filter(shopItem => {
      const status = new ValueHolder(true);
      applyChallenges(ChallengeType.SHOP_ITEM, shopItem, status);
      return status.value;
    });
}
