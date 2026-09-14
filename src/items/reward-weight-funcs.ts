import { globalScene } from "#app/global-scene";
import { allTrainerItems } from "#data/data-lists";
import { HeldItemId } from "#enums/held-item-id";
import type { TrainerItemId } from "#enums/trainer-item-id";
import type { WeightedRewardWeightFunc } from "#types/rewards";

/**
 * High order function that returns a WeightedRewardWeightFunc that will only be applied on
 * classic and skip an Reward if current wave is greater or equal to the one passed down
 * @param wave - Wave where we should stop showing the modifier
 * @param defaultWeight - Reward default weight
 * @returns A WeightedRewardWeightFunc
 */
export function skipInClassicAfterWave(wave: number, defaultWeight: number): WeightedRewardWeightFunc {
  return () => {
    const gameMode = globalScene.gameMode;
    const currentWave = globalScene.currentBattle.waveIndex;
    return gameMode.isClassic && currentWave >= wave ? 0 : defaultWeight;
  };
}
/**
 * High order function that returns a WeightedRewardWeightFunc that will only be applied on
 * classic and it will skip a Reward if it is the last wave pull.
 * @param defaultWeight Reward default weight
 * @returns A WeightedRewardWeightFunc
 */
export function skipInLastClassicWaveOrDefault(defaultWeight: number): WeightedRewardWeightFunc {
  return skipInClassicAfterWave(199, defaultWeight);
}
/**
 * High order function that returns a WeightedRewardWeightFunc to ensure Lures don't spawn on Classic 199
 * or if the lure still has over 60% of its duration left
 * @param lureId The id of the lure type in question.
 * @param weight The desired weight for the lure when it does spawn
 * @returns A WeightedRewardWeightFunc
 */
export function lureWeightFunc(lureId: TrainerItemId, weight: number): WeightedRewardWeightFunc {
  return () => {
    const lureCount = globalScene.trainerItems.getStack(lureId);
    return !(globalScene.gameMode.isClassic && globalScene.currentBattle.waveIndex === 199)
      && lureCount < allTrainerItems[lureId].maxStackCount * 0.6
      ? weight
      : 0;
  };
}
/**
 * Gets a function to determine weights for Potion rewards based on party members' HP, with a max of `3 * baseWeight`. \
 * A party member is considered in need of this item if it's below both HP thresholds.
 * @param hpThreshold - The amount of HP the mon should be missing to be considered in need of a potion
 * @param hpRatioThreshold - The ratio of `current:max` HP under which the mon is considered in need of a potion
 * @param baseWeight - The standard weight of that potion, multiplied by up to 3 based on who needs it
 * @returns A {@linkcode WeightedRewardWeightFunc} which yields the reward's weight multiplied by the number of mons that need it
 */
export function potionWeightFunc(
  hpThreshold: number,
  hpRatioThreshold: number,
  baseWeight = 1,
): WeightedRewardWeightFunc {
  return () => {
    const party = globalScene.getPlayerParty();
    const thresholdPartyMemberCount = Math.min(
      party.filter(p => p.getInverseHp() >= hpThreshold && p.getHpRatio() <= hpRatioThreshold && !p.isFainted()).length,
      3,
    );
    return thresholdPartyMemberCount * baseWeight;
  };
}
/**
 * Gets a function to determine weights for Ether/Elixir rewards based on party members' PP, with a max of `3 * baseWeight`. \
 * A party member is considered in need of this item if it has a move with a PP of 5 or less, and less than half its max.
 * @param baseWeight - The weight of the reward
 * @returns A {@linkcode WeightedRewardWeightFunc} which yields the reward's weight multiplied by the number of mons that need it
 */
export function etherWeightFunc(baseWeight = 1): WeightedRewardWeightFunc {
  return () => {
    const party = globalScene.getPlayerParty();
    const thresholdPartyMemberCount = Math.min(
      party.filter(
        p =>
          p.hp
          && !p.heldItemManager.hasItem(HeldItemId.LEPPA_BERRY)
          && p
            .getMoveset()
            .some(m => m.ppUsed && m.getMovePp() - m.ppUsed <= 5 && m.ppUsed > Math.floor(m.getMovePp() / 2)),
      ).length,
      3,
    );
    return thresholdPartyMemberCount * baseWeight;
  };
}
/**
 * Gets a function to determine weights for Revive rewards based on number of fainted party members.
 * @param baseWeight - The weight to multiply by the amount of fainted party members
 * @returns A {@linkcode WeightedRewardWeightFunc} which yields the number of fainted party members times base weight
 */
export function reviveWeightFunc(baseWeight = 1): WeightedRewardWeightFunc {
  return () => {
    const party = globalScene.getPlayerParty();
    const faintedPartyMemberCount = Math.min(party.filter(p => p.isFainted()).length, 3);
    return faintedPartyMemberCount * baseWeight;
  };
}
