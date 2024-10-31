import { gScene } from "#app/battle-scene";
import { Egg, EGG_SEED } from "#app/data/egg";
import { Phase } from "#app/phase";
import i18next from "i18next";
import Overrides from "#app/overrides";
import { EggHatchPhase } from "./egg-hatch-phase";
import { Mode } from "#app/ui/ui";
import { achvs } from "#app/system/achv";
import { PlayerPokemon } from "#app/field/pokemon";
import { EggSummaryPhase } from "./egg-summary-phase";
import { EggHatchData } from "#app/data/egg-hatch-data";

/**
 * Phase that handles updating eggs, and hatching any ready eggs
 * Also handles prompts for skipping animation, and calling the egg summary phase
 */
export class EggLapsePhase extends Phase {

  private eggHatchData: EggHatchData[] = [];
  private readonly minEggsToSkip: number = 2;
  constructor() {
    super();
  }

  start() {
    super.start();
    const eggsToHatch: Egg[] = gScene.gameData.eggs.filter((egg: Egg) => {
      return Overrides.EGG_IMMEDIATE_HATCH_OVERRIDE ? true : --egg.hatchWaves < 1;
    });
    const eggsToHatchCount: number = eggsToHatch.length;
    this.eggHatchData = [];

    if (eggsToHatchCount > 0) {
      if (eggsToHatchCount >= this.minEggsToSkip && gScene.eggSkipPreference === 1) {
        gScene.ui.showText(i18next.t("battle:eggHatching"), 0, () => {
          // show prompt for skip, blocking inputs for 1 second
          gScene.ui.showText(i18next.t("battle:eggSkipPrompt"), 0);
          gScene.ui.setModeWithoutClear(Mode.CONFIRM, () => {
            this.hatchEggsSkipped(eggsToHatch);
            this.showSummary();
          }, () => {
            this.hatchEggsRegular(eggsToHatch);
            this.end();
          },
          null, null, null, 1000, true
          );
        }, 100, true);
      } else if (eggsToHatchCount >= this.minEggsToSkip && gScene.eggSkipPreference === 2) {
        gScene.queueMessage(i18next.t("battle:eggHatching"));
        this.hatchEggsSkipped(eggsToHatch);
        this.showSummary();
      } else {
        // regular hatches, no summary
        gScene.queueMessage(i18next.t("battle:eggHatching"));
        this.hatchEggsRegular(eggsToHatch);
        this.end();
      }
    } else {
      this.end();
    }
  }

  /**
   * Hatches eggs normally one by one, showing animations
   * @param eggsToHatch list of eggs to hatch
   */
  hatchEggsRegular(eggsToHatch: Egg[]) {
    let eggsToHatchCount: number = eggsToHatch.length;
    for (const egg of eggsToHatch) {
      gScene.unshiftPhase(new EggHatchPhase(this, egg, eggsToHatchCount));
      eggsToHatchCount--;
    }
  }

  /**
   * Hatches eggs with no animations
   * @param eggsToHatch list of eggs to hatch
   */
  hatchEggsSkipped(eggsToHatch: Egg[]) {
    for (const egg of eggsToHatch) {
      this.hatchEggSilently(egg);
    }
  }

  showSummary() {
    gScene.unshiftPhase(new EggSummaryPhase(this.eggHatchData));
    this.end();
  }

  /**
   * Hatches an egg and stores it in the local EggHatchData array without animations
   * Also validates the achievements for the hatched pokemon and removes the egg
   * @param egg egg to hatch
   */
  hatchEggSilently(egg: Egg) {
    const eggIndex = gScene.gameData.eggs.findIndex(e => e.id === egg.id);
    if (eggIndex === -1) {
      return this.end();
    }
    gScene.gameData.eggs.splice(eggIndex, 1);

    const data = this.generatePokemon(egg);
    const pokemon = data.pokemon;
    if (pokemon.fusionSpecies) {
      pokemon.clearFusionSpecies();
    }

    if (pokemon.species.subLegendary) {
      gScene.validateAchv(achvs.HATCH_SUB_LEGENDARY);
    }
    if (pokemon.species.legendary) {
      gScene.validateAchv(achvs.HATCH_LEGENDARY);
    }
    if (pokemon.species.mythical) {
      gScene.validateAchv(achvs.HATCH_MYTHICAL);
    }
    if (pokemon.isShiny()) {
      gScene.validateAchv(achvs.HATCH_SHINY);
    }

  }

  /**
   * Generates a Pokemon and creates a new EggHatchData instance for the given egg
   * @param egg the egg to hatch
   * @returns the hatched PlayerPokemon
   */
  generatePokemon(egg: Egg): EggHatchData {
    let ret: PlayerPokemon;
    let newHatchData: EggHatchData;
    gScene.executeWithSeedOffset(() => {
      ret = egg.generatePlayerPokemon();
      newHatchData = new EggHatchData(ret, egg.eggMoveIndex);
      newHatchData.setDex();
      this.eggHatchData.push(newHatchData);

    }, egg.id, EGG_SEED.toString());
    return newHatchData!;
  }

}
