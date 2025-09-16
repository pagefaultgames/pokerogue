import { globalScene } from "#app/global-scene";
import type { ModifierType } from "#modifiers/modifier-type";
import { BattlePhase } from "#phases/battle-phase";
import type { ModifierTypeFunc } from "#types/modifier-types";
import { getModifierType } from "#utils/modifier-utils";
import i18next from "i18next";

export class ModifierRewardPhase extends BattlePhase {
  // RibbonModifierRewardPhase extends ModifierRewardPhase and to make typescript happy
  // we need to use a union type here
  public readonly phaseName: "ModifierRewardPhase" | "RibbonModifierRewardPhase" | "GameOverModifierRewardPhase" =
    "ModifierRewardPhase";
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
