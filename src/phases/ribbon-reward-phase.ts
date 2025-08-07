import { globalScene } from "#app/global-scene";
import type { PokemonSpecies } from "#data/pokemon-species";
import { UiMode } from "#enums/ui-mode";
import { RewardPhase } from "#phases/reward-phase";
import type { SilentReward } from "#types/rewards";
import i18next from "i18next";

export class RibbonRewardPhase extends RewardPhase {
  public readonly phaseName = "RibbonRewardPhase";
  private species: PokemonSpecies;

  constructor(rewardId: SilentReward, species: PokemonSpecies) {
    super(rewardId);

    this.species = species;
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      globalScene.applyReward(this.reward, {});
      globalScene.playSound("level_up_fanfare");
      globalScene.ui.setMode(UiMode.MESSAGE);
      globalScene.ui.showText(
        i18next.t("battle:beatModeFirstTime", {
          speciesName: this.species.name,
          gameMode: globalScene.gameMode.getName(),
          newModifier: this.reward.name,
        }),
        null,
        () => {
          resolve();
        },
        null,
        true,
        1500,
      );
    });
  }
}
