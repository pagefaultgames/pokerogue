import { audioManager } from "#app/global-audio-manager";
import { globalScene } from "#app/global-scene";
import type { PokemonSpecies } from "#data/pokemon-species";
import { UiMode } from "#enums/ui-mode";
import { ModifierRewardPhase } from "#phases/modifier-reward-phase";
import type { ModifierTypeFunc } from "#types/modifier-types";
import i18next from "i18next";

export class RibbonModifierRewardPhase extends ModifierRewardPhase {
  public readonly phaseName = "RibbonModifierRewardPhase";

  private readonly species: PokemonSpecies;

  constructor(modifierTypeFunc: ModifierTypeFunc, species: PokemonSpecies) {
    super(modifierTypeFunc);

    this.species = species;
  }

  public override async doReward(): Promise<void> {
    const newModifier = this.modifierType.newModifier();
    globalScene.addModifier(newModifier);

    audioManager.playSound("se/level_up_fanfare");

    await globalScene.ui.setMode(UiMode.MESSAGE);

    await globalScene.ui.showTextPromise(
      i18next.t("battle:beatModeFirstTime", {
        speciesName: this.species.name,
        gameMode: globalScene.gameMode.getName(),
        newModifier: newModifier?.type.name,
      }),
      { promptDelay: 1500 },
    );
  }
}
