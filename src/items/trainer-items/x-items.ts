import { Stat, type TempBattleStat } from "#enums/stat";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemId } from "#enums/trainer-item-id";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { NumberHolderParams } from "#types/trainer-item-parameter";

export const tempStatToTrainerItem = {
  [Stat.ATK]: TrainerItemId.X_ATTACK,
  [Stat.DEF]: TrainerItemId.X_DEFENSE,
  [Stat.SPATK]: TrainerItemId.X_SP_ATK,
  [Stat.SPDEF]: TrainerItemId.X_SP_DEF,
  [Stat.SPD]: TrainerItemId.X_SPEED,
  [Stat.ACC]: TrainerItemId.X_ACCURACY,
} as const satisfies Record<TempBattleStat, TrainerItemId>;

export class StatStageBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.TEMP_STAT_STAGE_BOOSTER> {
  public override readonly effect = TrainerItemEffect.TEMP_STAT_STAGE_BOOSTER;
  private readonly boost: number;

  constructor(_stat: Exclude<TempBattleStat, Stat.ACC>, boost: number) {
    super();

    this.boost = boost;
  }

  public override apply({ numberHolder: statLevel }: NumberHolderParams): void {
    statLevel.value += this.boost;
  }
}

export class AccuracyBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.TEMP_ACCURACY_BOOSTER> {
  public override readonly effect = TrainerItemEffect.TEMP_ACCURACY_BOOSTER;

  public override apply({ numberHolder: statLevel }: NumberHolderParams): void {
    const boost = 1;
    statLevel.value += boost;
  }
}

export class CritBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.TEMP_CRIT_BOOSTER> {
  public override readonly effect = TrainerItemEffect.TEMP_CRIT_BOOSTER;

  public override apply({ numberHolder: critLevel }: NumberHolderParams): void {
    critLevel.value++;
  }
}
