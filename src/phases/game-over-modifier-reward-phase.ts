import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import { ModifierRewardPhase } from "#phases/modifier-reward-phase";
import i18next from "i18next";

export class GameOverModifierRewardPhase extends ModifierRewardPhase {
  public readonly phaseName = "GameOverModifierRewardPhase";

  public override async doReward(): Promise<void> {
    const { promise, resolve } = Promise.withResolvers<void>();

    const newModifier = this.modifierType.newModifier();
    globalScene.addModifier(newModifier);

    audioManager.playSound("se/level_up_fanfare");

    await globalScene.ui.setMode(UiMode.MESSAGE);
    await globalScene.ui.fadeIn(250);
    globalScene.ui.showText(i18next.t("battle:rewardGain", { modifierName: newModifier?.type.name }), {
      callback: () => {
        globalScene.time.delayedCall(1500, () => globalScene.arenaBg.setVisible(true));
        resolve();
      },
      prompt: true,
      promptDelay: 1500,
    });

    return await promise;
  }
}
