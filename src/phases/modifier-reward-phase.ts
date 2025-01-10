import { globalScene } from "#app/global-scene";
import type { ModifierType, ModifierTypeFunc } from "#app/modifier/modifier-type";
import { getModifierType } from "#app/modifier/modifier-type";
import i18next from "i18next";
import { BattlePhase } from "./battle-phase";

export class ModifierRewardPhase extends BattlePhase {
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
      globalScene.addModifier(newModifier).then(() => {
        globalScene.playSound("item_fanfare");
        globalScene.ui.showText(i18next.t("battle:rewardGain", { modifierName: newModifier?.type.name }), null, () => resolve(), null, true);
      });
    });
  }
}
