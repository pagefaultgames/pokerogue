import { tmPoolTiers } from "#balance/tm-pool-tiers";
import type { EvolutionItemId } from "#enums/evolution-item";
import type { FormChangeItemId } from "#enums/form-change-item-id";
import type { MoveId } from "#enums/move-id";
import type { Nature } from "#enums/nature";
import type { PokemonType } from "#enums/pokemon-type";
import { RewardId } from "#enums/reward-id";
import { RarityTier } from "#enums/reward-tier";
import { EvolutionItemReward } from "#items/rewards/evolution-item";
import { FormChangeItemReward } from "#items/rewards/form-change";
import { PokemonNatureChangeReward } from "#items/rewards/nature-change";
import { ChangeTeraTypeReward } from "#items/rewards/tera-type";
import { TmReward } from "#items/rewards/tm";

// Note that none of these factory methods are actually used in the codebase yet.
// They're written as an alternative to the previous more complex specs objects
// as a way to instantiate standalone item rewards. It's reasonable to say YAGNI,
// but I've implemented them as they seem very feasible for balance to want at some point.

/**
 * Create a TM reward for a specific move, resolving the appropriate rarity tier.
 * @param moveId - The move to grant
 */
export function createTmReward(moveId: MoveId): TmReward {
  const tier = tmPoolTiers[moveId] ?? RarityTier.COMMON;
  let rewardId: RewardId = RewardId.TM_COMMON;
  if (tier === RarityTier.GREAT) {
    rewardId = RewardId.TM_GREAT;
  } else if (tier === RarityTier.ULTRA) {
    rewardId = RewardId.TM_ULTRA;
  }
  return new TmReward(rewardId, moveId);
}

/**
 * Create a nature mint reward for a specific nature.
 * @param nature - The nature to change to
 */
export function createMintReward(nature: Nature): PokemonNatureChangeReward {
  return new PokemonNatureChangeReward(nature);
}

/**
 * Create a Tera shard reward for a specific Pokemon type.
 * @param teraType - The Tera type to set
 */
export function createTeraShardReward(teraType: PokemonType): ChangeTeraTypeReward {
  return new ChangeTeraTypeReward(teraType);
}

/**
 * Create an evolution item reward for a specific evolution item.
 * @param evolutionItemId - The evolution item to grant
 */
export function createEvolutionItemReward(evolutionItemId: EvolutionItemId): EvolutionItemReward {
  return new EvolutionItemReward(RewardId.EVOLUTION_ITEM, evolutionItemId);
}

/**
 * Create a form change item reward for a specific form change item.
 * @param formChangeItemId - The form change item to grant
 * @param rare - Whether this is a rare form change item
 */
export function createFormChangeItemReward(formChangeItemId: FormChangeItemId, rare = false): FormChangeItemReward {
  const id = rare ? RewardId.RARE_FORM_CHANGE_ITEM : RewardId.FORM_CHANGE_ITEM;
  return new FormChangeItemReward(id, formChangeItemId);
}
