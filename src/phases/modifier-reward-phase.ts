import { gScene } from "#app/battle-scene";
import { ModifierType, ModifierTypeFunc, getModifierType } from "#app/modifier/modifier-type";
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
      gScene.addModifier(newModifier).then(() => {
        gScene.playSound("item_fanfare");
        gScene.ui.showText(i18next.t("battle:rewardGain", { modifierName: newModifier?.type.name }), null, () => resolve(), null, true);
      });
    });
  }
}
