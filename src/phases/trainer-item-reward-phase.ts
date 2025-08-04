import { globalScene } from "#app/global-scene";
import { type Reward, RewardGenerator } from "#items/reward";
import { BattlePhase } from "#phases/battle-phase";
import type { RewardFunc } from "#types/rewards";
import i18next from "i18next";

export class RewardPhase extends BattlePhase {
  // RibbonRewardPhase extends RewardPhase and to make typescript happy
  // we need to use a union type here
  public readonly phaseName: "RewardPhase" | "RibbonRewardPhase" | "GameOverRewardPhase" = "RewardPhase";
  protected reward: Reward;

  constructor(rewardFunc: RewardFunc) {
    super();

    const reward = rewardFunc();
    this.reward = reward instanceof RewardGenerator ? reward.generateReward() : reward;
  }

  start() {
    super.start();

    this.doReward().then(() => this.end());
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      globalScene.applyReward(this.reward);
      globalScene.playSound("item_fanfare");
      globalScene.ui.showText(
        i18next.t("battle:rewardGain", {
          modifierName: this.reward.name,
        }),
        null,
        () => resolve(),
        null,
        true,
      );
    });
  }
}
