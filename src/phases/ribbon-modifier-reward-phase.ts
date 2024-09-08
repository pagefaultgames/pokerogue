import BattleScene from "#app/battle-scene.js";
import PokemonSpecies from "#app/data/pokemon-species.js";
import { ModifierTypeFunc } from "#app/modifier/modifier-type.js";
import { Mode } from "#app/ui/ui.js";
import i18next from "i18next";
import { ModifierRewardPhase } from "./modifier-reward-phase";

export class RibbonModifierRewardPhase extends ModifierRewardPhase {
  private species: PokemonSpecies;

  constructor(scene: BattleScene, modifierTypeFunc: ModifierTypeFunc, species: PokemonSpecies) {
    super(scene, modifierTypeFunc);

    this.species = species;
  }

  doReward(): Promise<void> {
    return new Promise<void>(resolve => {
      const newModifier = this.modifierType.newModifier();
      this.scene.addModifier(newModifier).then(() => {
        this.scene.playSound("level_up_fanfare");
        this.scene.ui.setMode(Mode.MESSAGE);
        this.scene.ui.showText(i18next.t("battle:beatModeFirstTime", {
          speciesName: this.species.name,
          gameMode: this.scene.gameMode.getName(),
          newModifier: newModifier?.type.name
        }), null, () => {
          resolve();
        }, null, true, 1500);
      });
    });
  }
}
