import { globalScene } from "#app/global-scene";
import { ArenaTagType } from "#enums/arena-tag-type";
import { MoneyMultiplierModifier } from "#modifiers/modifier";
import { BattlePhase } from "#phases/battle-phase";
import { NumberHolder } from "#utils/common";
import i18next from "i18next";

export class MoneyRewardPhase extends BattlePhase {
  public readonly phaseName = "MoneyRewardPhase";

  private readonly moneyMultiplier: number;

  constructor(moneyMultiplier: number) {
    super();

    this.moneyMultiplier = moneyMultiplier;
  }

  public override start(): void {
    const moneyAmount = new NumberHolder(globalScene.getWaveMoneyAmount(this.moneyMultiplier));

    globalScene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    if (globalScene.arena.getTag(ArenaTagType.HAPPY_HOUR)) {
      moneyAmount.value *= 2;
    }

    globalScene.addMoney(moneyAmount.value);

    const userLocale = navigator.language || "en-US";
    const formattedMoneyAmount = moneyAmount.value.toLocaleString(userLocale);
    const message = i18next.t("battle:moneyWon", { moneyAmount: formattedMoneyAmount });

    globalScene.ui.showText(message, { callback: () => this.end(), prompt: true });
  }
}
