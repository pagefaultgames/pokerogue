import { gScene } from "#app/battle-scene";
import { ModifierTypeFunc } from "#app/modifier/modifier-type";
import { Mode } from "#app/ui/ui";
import i18next from "i18next";
import { ModifierRewardPhase } from "./modifier-reward-phase";

export class GameOverModifierRewardPhase extends ModifierRewardPhase {
  constructor(modifierTypeFunc: ModifierTypeFunc) {
    super(modifierTypeFunc);
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      gScene.addModifier(newModifier).then(() => {
        // Sound loaded into game as is
        gScene.playSound("level_up_fanfare");
        gScene.ui.setMode(Mode.MESSAGE);
        gScene.ui.fadeIn(250).then(() => {
          gScene.ui.showText(i18next.t("battle:rewardGain", { modifierName: newModifier?.type.name }), null, () => {
            gScene.time.delayedCall(1500, () => gScene.arenaBg.setVisible(true));
            resolve();
          }, null, true, 1500);
        });
      });
    });
  }
}
