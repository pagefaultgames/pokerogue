/** 
import { globalScene } from "#app/global-scene";
import { isNullOrUndefined, NumberHolder } from "#app/utils/common";
import type { RewardGenerator } from "./reward-generator";
import type { RewardTier } from "./reward-tier";
import Overrides from "#app/overrides";

interface RewardPool {
  [rewardTier: number]: RewardGenerator[];
}

export interface CustomRewardSettings {
  guaranteedModifierTiers?: RewardTier[];
  guaranteedModifierTypeOptions?: ModifierTypeOption[];
  guaranteedModifierTypeFuncs?: ModifierTypeFunc[];
  fillRemaining?: boolean;
  //Set to negative value to disable rerolls completely in shop
  rerollMultiplier?: number;
  allowLuckUpgrades?: boolean;
}

export class RewardPoolManager {
  public rerollCount: number;
  private rewardPool: RewardPool;
  private customRewardSettings?: CustomRewardSettings; //TODO: have a better scheme than just this

  constructor(rewardPool: RewardPool) {
    this.rewardPool = rewardPool;
  }

  getRerollCost(lockRarities: boolean): number {
    let baseValue = 0;
    if (Overrides.WAIVE_ROLL_FEE_OVERRIDE) {
      return baseValue;
    }
    if (lockRarities) {
      const tierValues = [50, 125, 300, 750, 2000];
      for (const opt of this.typeOptions) {
        baseValue += tierValues[opt.type.tier ?? 0];
      }
    } else {
      baseValue = 250;
    }

    let multiplier = 1;
    if (!isNullOrUndefined(this.customRewardSettings?.rerollMultiplier)) {
      if (this.customRewardSettings.rerollMultiplier < 0) {
        // Completely overrides reroll cost to -1 and early exits
        return -1;
      }

      // Otherwise, continue with custom multiplier
      multiplier = this.customRewardSettings.rerollMultiplier;
    }

    const baseMultiplier = Math.min(
      Math.ceil(globalScene.currentBattle.waveIndex / 10) * baseValue * 2 ** this.rerollCount * multiplier,
      Number.MAX_SAFE_INTEGER,
    );

    // Apply Black Sludge to reroll cost
    const modifiedRerollCost = new NumberHolder(baseMultiplier);
    globalScene.applyModifier(HealShopCostModifier, true, modifiedRerollCost);
    return modifiedRerollCost.value;
  }

  getRewardCount(): NumberHolder {
    const modifierCount = new NumberHolder(3);

    // TODO: This code is used by golden and silver pokéball to increase the number of item slots
    // They will become a trainer item, so there will be no .applyModifiers
    globalScene.applyModifiers(ExtraModifierModifier, true, modifierCount);
    globalScene.applyModifiers(TempExtraModifierModifier, true, modifierCount);

    // If custom rewards are specified, overrides default item count
    // TODO: Figure out exactly how and when that would happen
    // Presumably in MEs, but possibly also after rerolls? And at specific waves...
    if (this.customRewardSettings) {
      const newItemCount =
        (this.customRewardSettings.guaranteedModifierTiers?.length || 0) +
        (this.customRewardSettings.guaranteedModifierTypeOptions?.length || 0) +
        (this.customRewardSettings.guaranteedModifierTypeFuncs?.length || 0);
      if (this.customRewardSettings.fillRemaining) {
        const originalCount = modifierCount.value;
        modifierCount.value = originalCount > newItemCount ? originalCount : newItemCount;
      } else {
        modifierCount.value = newItemCount;
      }
    }

    return modifierCount;
  }
}
*/
