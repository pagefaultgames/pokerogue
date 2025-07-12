import { globalScene } from "#app/global-scene";
import { TrainerItemReward, type ModifierType } from "#app/modifier/modifier-type";
import type { ModifierTypeFunc } from "#app/@types/modifier-types";
import { getModifierType } from "#app/utils/modifier-utils";
import i18next from "i18next";
import { BattlePhase } from "./battle-phase";

export class RewardPhase extends BattlePhase {
  // RibbonRewardPhase extends RewardPhase and to make typescript happy
  // we need to use a union type here
  public readonly phaseName: "RewardPhase" | "RibbonRewardPhase" | "GameOverRewardPhase" = "RewardPhase";
  protected modifierType: ModifierType;

  constructor(modifierTypeFunc: ModifierTypeFunc) {
    super();

    this.modifierType = getModifierType(modifierTypeFunc);
  }

  start() {
    super.start();

    this.doReward().then(() => this.end());
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      if (this.modifierType instanceof TrainerItemReward) {
        this.modifierType.apply();
      } else {
        const newModifier = this.modifierType.newModifier();
        globalScene.addModifier(newModifier);
      }
      globalScene.playSound("item_fanfare");
      globalScene.ui.showText(
        i18next.t("battle:rewardGain", {
          modifierName: this.modifierType.name,
        }),
        null,
        () => resolve(),
        null,
        true,
      );
    });
  }
}
