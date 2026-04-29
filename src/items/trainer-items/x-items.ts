import { getStatKey, Stat, type TempBattleStat } from "#enums/stat";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemId, TrainerItemNames } from "#enums/trainer-item-id";
import { TrainerItemAttr } from "#items/trainer-item-attr";
import type { NumberHolderParams } from "#types/trainer-item-parameter";
import i18next from "i18next";

type TempStatToTrainerItemMap = {
  [key in TempBattleStat]: TrainerItemId;
};

export const tempStatToTrainerItem: TempStatToTrainerItemMap = {
  [Stat.ATK]: TrainerItemId.X_ATTACK,
  [Stat.DEF]: TrainerItemId.X_DEFENSE,
  [Stat.SPATK]: TrainerItemId.X_SP_ATK,
  [Stat.SPDEF]: TrainerItemId.X_SP_DEF,
  [Stat.SPD]: TrainerItemId.X_SPEED,
  [Stat.ACC]: TrainerItemId.X_ACCURACY,
};

export class StatStageBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.TEMP_STAT_STAGE_BOOSTER> {
  public override readonly effect = TrainerItemEffect.TEMP_STAT_STAGE_BOOSTER;
  private readonly stat: TempBattleStat;
  private readonly boost: number;

  constructor(stat: TempBattleStat, boost: number) {
    super();

    this.stat = stat;
    this.boost = boost;
  }

  // TODO move to builder
  get name(): string {
    return i18next.t(`modifierType:TempStatStageBoosterItem.${TrainerItemNames[this.type]?.toLowerCase()}`);
  }

  get description(): string {
    console.log();
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t(getStatKey(this.stat)),
      amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.percentage"),
    });
  }

  public override apply({ numberHolder: statLevel }: NumberHolderParams) {
    statLevel.value += this.boost;
  }
}

export class AccuracyBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.TEMP_ACCURACY_BOOSTER> {
  public override readonly effect = TrainerItemEffect.TEMP_ACCURACY_BOOSTER;

  get name(): string {
    return i18next.t(`modifierType:TempStatStageBoosterItem.${TrainerItemNames[this.type]?.toLowerCase()}`);
  }

  get description(): string {
    console.log();
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t(getStatKey(Stat.ACC)),
      amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.percentage"),
    });
  }

  public override apply({ numberHolder: statLevel }: NumberHolderParams) {
    const boost = 1;
    statLevel.value += boost;
  }
}

export class CritBoosterTrainerItemAttr extends TrainerItemAttr<typeof TrainerItemEffect.TEMP_CRIT_BOOSTER> {
  public override readonly effect = TrainerItemEffect.TEMP_CRIT_BOOSTER;

  get description(): string {
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t("modifierType:ModifierType.DIRE_HIT.extra.raises"),
      amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.stage"),
    });
  }

  public override apply({ numberHolder: critLevel }: NumberHolderParams) {
    critLevel.value++;
  }
}
