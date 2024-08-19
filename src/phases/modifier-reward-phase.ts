import BattleScene from "#app/battle-scene.js";
import { ModifierType, ModifierTypeFunc, getModifierType } from "#app/modifier/modifier-type.js";
import i18next from "i18next";
import { BattlePhase } from "./battle-phase";

export class ModifierRewardPhase extends BattlePhase {
  protected modifierType: ModifierType;

  constructor(scene: BattleScene, modifierTypeFunc: ModifierTypeFunc) {
    super(scene);

    this.modifierType = getModifierType(modifierTypeFunc);
  }

  start() {
    super.start();

    this.doReward().then(() => this.end());
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      this.scene.addModifier(newModifier).then(() => {
        this.scene.playSound("item_fanfare");
        this.scene.ui.showText(i18next.t("battle:rewardGain", { modifierName: newModifier?.type.name }), null, () => resolve(), null, true);
      });
    });
  }
}
