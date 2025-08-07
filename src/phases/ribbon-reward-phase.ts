import { globalScene } from "#app/global-scene";
import type { PokemonSpecies } from "#data/pokemon-species";
import { UiMode } from "#enums/ui-mode";
import type { Reward, RewardGenerator } from "#items/reward";
import { RewardPhase } from "#phases/reward-phase";
import i18next from "i18next";

export class RibbonRewardPhase extends RewardPhase {
  public readonly phaseName = "RibbonRewardPhase";
  private species: PokemonSpecies;

  constructor(rewardFunc: Reward | RewardGenerator, species: PokemonSpecies) {
    super(rewardFunc);

    this.species = species;
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.reward.newModifier();
      globalScene.addModifier(newModifier);
      globalScene.playSound("level_up_fanfare");
      globalScene.ui.setMode(UiMode.MESSAGE);
      globalScene.ui.showText(
        i18next.t("battle:beatModeFirstTime", {
          speciesName: this.species.name,
          gameMode: globalScene.gameMode.getName(),
          newModifier: newModifier?.type.name,
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
