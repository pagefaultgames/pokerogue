import { globalScene } from "#app/global-scene";
import type { Reward } from "#modifiers/modifier-type";
import { BattlePhase } from "#phases/battle-phase";
import type { RewardFunc } from "#types/modifier-types";
import { getReward } from "#utils/modifier-utils";
import i18next from "i18next";

export class RewardPhase extends BattlePhase {
  // RibbonRewardPhase extends RewardPhase and to make typescript happy
  // we need to use a union type here
  public readonly phaseName: "RewardPhase" | "RibbonRewardPhase" | "GameOverRewardPhase" = "RewardPhase";
  protected modifierType: Reward;

  constructor(modifierTypeFunc: RewardFunc) {
    super();

    this.modifierType = getReward(modifierTypeFunc);
  }

  start() {
    super.start();

    this.doReward().then(() => this.end());
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      globalScene.addModifier(newModifier);
      globalScene.playSound("item_fanfare");
      globalScene.ui.showText(
        i18next.t("battle:rewardGain", {
          modifierName: newModifier?.type.name,
        }),
        null,
        () => resolve(),
        null,
        true,
      );
    });
  }
}
