import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { TrainerItemManager } from "#items/trainer-item-manager";
import type { NumberHolderParams } from "#types/trainer-item-parameter";
import i18next from "i18next";

export class ExpBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.EXP_BOOSTER> {
  public override readonly effect = TrainerItemEffect.EXP_BOOSTER;
  private readonly boostPercent: number;

  constructor(boostPercent: number) {
    super();

    this.boostPercent = boostPercent;
  }

  public get description(): string {
    return i18next.t("modifierType:ModifierType.ExpBoosterModifierType.description", {
      boostPercent: this.boostPercent,
    });
  }

  public override apply({ numberHolder: boost }: NumberHolderParams, manager: TrainerItemManager): void {
    const stack = manager.getStack(this.type);
    boost.value = Math.floor(boost.value * (1 + stack * this.boostPercent * 0.01));
  }
}
