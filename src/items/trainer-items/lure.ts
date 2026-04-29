import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { NumberHolderParams } from "#types/trainer-item-parameter";
import i18next from "i18next";

export class DoubleBattleChanceBoosterTrainerItemAttr extends TrainerItemAttr<
  typeof TrainerItemEffect.DOUBLE_BATTLE_CHANCE_BOOSTER
> {
  public override readonly effect = TrainerItemEffect.DOUBLE_BATTLE_CHANCE_BOOSTER;

  // todo move to builder
  get description(): string {
    return i18next.t("modifierType:ModifierType.DoubleBattleChanceBoosterModifierType.description", {
      battleCount: this.getMaxStackCount(),
    });
  }

  public override apply({ numberHolder: doubleBattleChanceThreshold }: NumberHolderParams) {
    // This is divided because the chance is generated as a number from 0 to doubleBattleChance.value using randSeedInt
    // A double battle will initiate if the generated number is 0
    // TODO: This is emphatically a very dumb way to do this and should be reworked (alongside similar effects) later
    doubleBattleChanceThreshold.value /= 4;
  }
}
