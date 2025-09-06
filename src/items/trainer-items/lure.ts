import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { LapsingTrainerItem } from "#items/trainer-item";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { NumberHolderParams } from "#types/trainer-item-parameter";
import i18next from "i18next";

export class DoubleBattleChanceBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.DOUBLE_BATTLE_CHANCE_BOOSTER];

  get description(): string {
    return i18next.t("modifierType:ModifierType.DoubleBattleChanceBoosterModifierType.description", {
      battleCount: this.getMaxStackCount(),
    });
  }

  apply(_manager: TrainerItemManager, params: NumberHolderParams) {
    const doubleBattleChance = params.numberHolder;
    // This is divided because the chance is generated as a number from 0 to doubleBattleChance.value using randSeedInt
    // A double battle will initiate if the generated number is 0
    doubleBattleChance.value /= 4;
  }
}
