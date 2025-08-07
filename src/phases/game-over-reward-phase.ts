import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import { RewardPhase } from "#phases/reward-phase";
import i18next from "i18next";

export class GameOverRewardPhase extends RewardPhase {
  public readonly phaseName = "GameOverRewardPhase";
  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      globalScene.applyReward(this.reward, {});
      // Sound loaded into game as is
      globalScene.playSound("level_up_fanfare");
      globalScene.ui.setMode(UiMode.MESSAGE);
      globalScene.ui.fadeIn(250).then(() => {
        globalScene.ui.showText(
          i18next.t("battle:rewardGain", {
            modifierName: this.reward.name,
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
