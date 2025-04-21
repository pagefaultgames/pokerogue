import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import i18next from "i18next";
import { ModifierRewardPhase } from "./modifier-reward-phase";

export class GameOverModifierRewardPhase extends ModifierRewardPhase {
  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      globalScene.addModifier(newModifier);
      // Sound loaded into game as is
      globalScene.playSound("level_up_fanfare");
      globalScene.ui.setMode(UiMode.MESSAGE);
      globalScene.ui.fadeIn(250).then(() => {
        globalScene.ui.showText(
          i18next.t("battle:rewardGain", {
            modifierName: newModifier?.type.name,
          }),
          null,
          () => {
            globalScene.time.delayedCall(1500, () => globalScene.arenaBg.setVisible(true));
            resolve();
          },
          null,
          true,
          1500,
        );
      });
    });
  }
}
