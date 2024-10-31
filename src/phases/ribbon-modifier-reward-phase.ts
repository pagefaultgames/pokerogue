import { gScene } from "#app/battle-scene";
import PokemonSpecies from "#app/data/pokemon-species";
import { ModifierTypeFunc } from "#app/modifier/modifier-type";
import { Mode } from "#app/ui/ui";
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
      gScene.addModifier(newModifier).then(() => {
        gScene.playSound("level_up_fanfare");
        gScene.ui.setMode(Mode.MESSAGE);
        gScene.ui.showText(i18next.t("battle:beatModeFirstTime", {
          speciesName: this.species.name,
          gameMode: gScene.gameMode.getName(),
          newModifier: newModifier?.type.name
        }), null, () => {
          resolve();
        }, null, true, 1500);
      });
    });
  }
}
