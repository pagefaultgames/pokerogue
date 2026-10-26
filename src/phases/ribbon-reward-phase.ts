import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import type { PokemonSpecies } from "#data/pokemon-species";
import type { RewardId } from "#enums/reward-id";
import { UiMode } from "#enums/ui-mode";
import type { Reward } from "#items/reward";
import { RewardPhase } from "#phases/reward-phase";
import i18next from "i18next";

export class RibbonRewardPhase extends RewardPhase {
  public readonly phaseName = "RibbonRewardPhase";
  private species: PokemonSpecies;

  constructor(reward: RewardId | Reward, species: PokemonSpecies) {
    super(reward);

    this.species = species;
  }

  doReward(): void {
    audioManager.playSound("se/level_up_fanfare");
    globalScene.ui.setMode(UiMode.MESSAGE);
    globalScene.ui.showText(
      i18next.t("battle:beatModeFirstTime", {
        speciesName: this.species.name,
        gameMode: globalScene.gameMode.getName(),
        newModifier: this.reward.name,
      }),
      null,
      () => {
        super.doReward();
      },
      null,
      true,
      1500,
    );
  }
}
