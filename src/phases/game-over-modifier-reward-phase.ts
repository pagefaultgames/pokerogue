import BattleScene from "#app/battle-scene.js";
import { ModifierTypeFunc } from "#app/modifier/modifier-type.js";
import { Mode } from "#app/ui/ui.js";
import i18next from "i18next";
import { ModifierRewardPhase } from "./modifier-reward-phase";

export class GameOverModifierRewardPhase extends ModifierRewardPhase {
  constructor(scene: BattleScene, modifierTypeFunc: ModifierTypeFunc) {
    super(scene, modifierTypeFunc);
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      this.scene.addModifier(newModifier).then(() => {
        // Sound loaded into game as is
        this.scene.playSound("level_up_fanfare");
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.fadeIn(250).then(() => {
          this.scene.ui.showText(i18next.t("battle:rewardGain", { modifierName: newModifier?.type.name }), null, () => {
            this.scene.time.delayedCall(1500, () => this.scene.arenaBg.setVisible(true));
            resolve();
          }, null, true, 1500);
        });
      });
    });
  }
}
