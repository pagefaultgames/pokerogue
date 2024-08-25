import BattleScene from "#app/battle-scene.js";
import { Egg, EGG_SEED } from "#app/data/egg.js";
import { Phase } from "#app/phase.js";
import i18next from "i18next";
import Overrides from "#app/overrides";
import { EggHatchData, EggHatchPhase } from "./egg-hatch-phase";
import { Mode } from "#app/ui/ui.js";
import { achvs } from "#app/system/achv.js";
import { PlayerPokemon } from "#app/field/pokemon.js";
import { EggSummaryPhase } from "./egg-summary-phase";

export class EggLapsePhase extends Phase {

  private eggHatchData: EggHatchData[] = [];
  constructor(scene: BattleScene) {
    super(scene);
  }

  start() {
    super.start();

    const eggsToHatch: Egg[] = this.scene.gameData.eggs.filter((egg: Egg) => {
      return Overrides.EGG_IMMEDIATE_HATCH_OVERRIDE ? true : --egg.hatchWaves < 1;
    });

    let eggsToHatchCount: integer = eggsToHatch.length;
    this.eggHatchData= [];
    if (eggsToHatchCount > 0) {

      if (eggsToHatchCount >= 5) {
        this.scene.ui.showText(i18next.t("battle:eggHatching"), 0, () => {
          // show prompt for skip
          this.scene.ui.showText(i18next.t("battle:eggSkipPrompt"), 0);
          this.scene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
            for (const egg of eggsToHatch) {
              this.hatchEggSilently(egg);
            }

            this.scene.unshiftPhase(new EggSummaryPhase(this.scene, this.eggHatchData));
            this.end();
          }, () => {
            for (const egg of eggsToHatch) {
              this.scene.unshiftPhase(new EggHatchPhase(this.scene, this, egg, eggsToHatchCount));
              eggsToHatchCount--;
            }

            this.scene.unshiftPhase(new EggSummaryPhase(this.scene, this.eggHatchData));
            this.end();
          }
          );
        }, 100, true);
      } else {
        this.scene.queueMessage(i18next.t("battle:eggHatching"));
        for (const egg of eggsToHatch) {
          this.scene.unshiftPhase(new EggHatchPhase(this.scene, this, egg, eggsToHatchCount));
          eggsToHatchCount--;
        }

        this.scene.unshiftPhase(new EggSummaryPhase(this.scene, this.eggHatchData));
        this.end();
      }


      console.log(this.eggHatchData);
    } else {
      this.end();
    }
  }

  hatchEggSilently(egg: Egg) {
    const eggIndex = this.scene.gameData.eggs.findIndex(e => e.id === egg.id);
    if (eggIndex === -1) {
      return this.end();
    }
    this.scene.gameData.eggs.splice(eggIndex, 1);

    const data = this.generatePokemon(egg);
    const pokemon = data.pokemon;
    if (pokemon.fusionSpecies) {
      pokemon.clearFusionSpecies();
    }
    console.log(pokemon);

    pokemon.loadAssets().then(() => {

      if (pokemon.species.subLegendary) {
        this.scene.validateAchv(achvs.HATCH_SUB_LEGENDARY);
      }
      if (pokemon.species.legendary) {
        this.scene.validateAchv(achvs.HATCH_LEGENDARY);
      }
      if (pokemon.species.mythical) {
        this.scene.validateAchv(achvs.HATCH_MYTHICAL);
      }
      if (pokemon.isShiny()) {
        this.scene.validateAchv(achvs.HATCH_SHINY);
      }

    });

  }

  // TODO fix duplicated code neatly
  /**
   * Generates a Pokemon and hatch data to be hatched by the egg
   * @returns the hatched PlayerPokemon
   */
  generatePokemon(egg: Egg): EggHatchData {
    let ret: PlayerPokemon;
    let newHatchData: EggHatchData;
    this.scene.executeWithSeedOffset(() => {
      ret = egg.generatePlayerPokemon(this.scene);
      newHatchData = new EggHatchData(this.scene, ret, egg.eggMoveIndex);
      newHatchData.setDex();
      this.eggHatchData.push(newHatchData);

    }, egg.id, EGG_SEED.toString());
    return newHatchData!;
  }

}
