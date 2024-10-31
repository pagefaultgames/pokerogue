import { gScene } from "#app/battle-scene";
import { ArenaTagType } from "#app/enums/arena-tag-type";
import { MoneyMultiplierModifier } from "#app/modifier/modifier";
import i18next from "i18next";
import * as Utils from "#app/utils";
import { BattlePhase } from "./battle-phase";

export class MoneyRewardPhase extends BattlePhase {
  private moneyMultiplier: number;

  constructor(moneyMultiplier: number) {
    super();

    this.moneyMultiplier = moneyMultiplier;
  }

  start() {
    const moneyAmount = new Utils.IntegerHolder(gScene.getWaveMoneyAmount(this.moneyMultiplier));

    gScene.applyModifiers(MoneyMultiplierModifier, true, moneyAmount);

    if (gScene.arena.getTag(ArenaTagType.HAPPY_HOUR)) {
      moneyAmount.value *= 2;
    }

    gScene.addMoney(moneyAmount.value);

    const userLocale = navigator.language || "en-US";
    const formattedMoneyAmount = moneyAmount.value.toLocaleString(userLocale);
    const message = i18next.t("battle:moneyWon", { moneyAmount: formattedMoneyAmount });

    gScene.ui.showText(message, null, () => this.end(), null, true);
  }
}
