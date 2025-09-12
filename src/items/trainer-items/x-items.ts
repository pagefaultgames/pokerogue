import { getStatKey, Stat, type TempBattleStat } from "#enums/stat";
import { TrainerItemEffect } from "#enums/trainer-item-effect";
import { TrainerItemId, TrainerItemNames } from "#enums/trainer-item-id";
import { LapsingTrainerItem } from "#items/trainer-item";
import type { TrainerItemManager } from "#items/trainer-item-manager";
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

export class TempStatStageBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.TEMP_STAT_STAGE_BOOSTER];
  private stat: TempBattleStat;

  constructor(type: TrainerItemId, stat: TempBattleStat, stackCount?: number) {
    super(type, stackCount);

    this.stat = stat;
  }

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

  apply(_manager: TrainerItemManager, params: NumberHolderParams) {
    const statLevel = params.numberHolder;
    const boost = 0.3;
    statLevel.value += boost;
  }
}

export class TempAccuracyBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.TEMP_ACCURACY_BOOSTER];

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

  apply(_manager: TrainerItemManager, params: NumberHolderParams) {
    const statLevel = params.numberHolder;
    const boost = 1;
    statLevel.value += boost;
  }
}

export class TempCritBoosterTrainerItem extends LapsingTrainerItem {
  public effects: TrainerItemEffect[] = [TrainerItemEffect.TEMP_CRIT_BOOSTER];

  get description(): string {
    return i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.description", {
      stat: i18next.t("modifierType:ModifierType.DIRE_HIT.extra.raises"),
      amount: i18next.t("modifierType:ModifierType.TempStatStageBoosterModifierType.extra.stage"),
    });
  }

  apply(_manager: TrainerItemManager, params: NumberHolderParams) {
    const critLevel = params.numberHolder;
    critLevel.value++;
  }
}
