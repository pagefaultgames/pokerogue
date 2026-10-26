import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import { UiMode } from "#enums/ui-mode";
import { PokemonReward, Reward } from "#items/reward";
import { generateRewardOptionFromId } from "#items/reward-utils";
import { BattlePhase } from "#phases/battle-phase";
import type { SilentReward } from "#types/rewards";
import type { ConfirmModeConfig } from "#types/ui-types";
import i18next from "i18next";

export class RewardPhase extends BattlePhase {
  // RibbonRewardPhase extends RewardPhase and to make typescript happy
  // we need to use a union type here
  public readonly phaseName: "RewardPhase" | "RibbonRewardPhase" | "GameOverRewardPhase" = "RewardPhase";
  protected reward: Reward;

  constructor(reward: SilentReward | Reward) {
    super();

    this.reward = reward instanceof Reward ? reward : generateRewardOptionFromId(reward)?.type;
  }

  start() {
    super.start();

    this.doReward();
  }

  doReward(): void {
    audioManager.playSound("item_fanfare");
    globalScene.ui.showText(
      i18next.t("battle:rewardGain", {
        modifierName: this.reward.name,
      }),
      null,
      () => {
        if (this.reward instanceof PokemonReward) {
          this.reward.openParty(
            () => {
              globalScene.ui.setMode(UiMode.MESSAGE);
              console.log("Ending here");
              this.end();
            },
            () => {
              const confirmMenuConfig: ConfirmModeConfig = {
                yesHandler: () => {
                  globalScene.ui.setMode(UiMode.MESSAGE);
                  this.end();
                  return true;
                },
                noHandler: () => {
                  globalScene.phaseManager.unshiftPhase(this.copy());
                  globalScene.ui.setMode(UiMode.MESSAGE);
                  this.end();
                  return true;
                },
              };
              globalScene.ui.setMode(UiMode.CONFIRM, confirmMenuConfig);
              globalScene.ui.showText("Do you want to skip this reward?");
            },
            this,
          );
        } else {
          this.reward.apply({});
          globalScene.updateItemBar(true);
          this.end();
        }
      },
      null,
      true,
    );
  }

  copy(): RewardPhase {
    return globalScene.phaseManager.create("RewardPhase", this.reward);
  }
}
