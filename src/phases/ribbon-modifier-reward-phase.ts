import { globalScene } from "#app/global-scene";
import type PokemonSpecies from "#app/data/pokemon-species";
import type { ModifierTypeFunc } from "#app/modifier/modifier-type";
import { UiMode } from "#enums/ui-mode";
import i18next from "i18next";
import { ModifierRewardPhase } from "./modifier-reward-phase";

export class RibbonModifierRewardPhase extends ModifierRewardPhase {
  private species: PokemonSpecies;

  constructor(modifierTypeFunc: ModifierTypeFunc, species: PokemonSpecies) {
    super(modifierTypeFunc);

    this.species = species;
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
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
