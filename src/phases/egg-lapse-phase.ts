import { globalScene } from "#app/global-scene";
import Overrides from "#app/overrides";
import { Phase } from "#app/phase";
import type { Egg } from "#data/egg";
import { EGG_SEED } from "#data/egg";
import { EggHatchData } from "#data/egg-hatch-data";
import { UiMode } from "#enums/ui-mode";
import type { PlayerPokemon } from "#field/pokemon";
import { achvs } from "#system/achv";
import i18next from "i18next";

/**
 * Phase that handles updating eggs, and hatching any ready eggs
 * Also handles prompts for skipping animation, and calling the egg summary phase
 */
export class EggLapsePhase extends Phase {
  public readonly phaseName = "EggLapsePhase";
  private eggHatchData: EggHatchData[] = [];
  private readonly minEggsToSkip: number = 2;

  start() {
    super.start();
    const eggsToHatch: Egg[] = globalScene.gameData.eggs.filter((egg: Egg) => {
      return Overrides.EGG_IMMEDIATE_HATCH_OVERRIDE ? true : --egg.hatchWaves < 1;
    });
    const eggsToHatchCount: number = eggsToHatch.length;
    this.eggHatchData = [];

    if (eggsToHatchCount > 0) {
      if (eggsToHatchCount >= this.minEggsToSkip && globalScene.eggSkipPreference === 1) {
        globalScene.ui.showText(
          i18next.t("battle:eggHatching"),
          0,
          () => {
            // show prompt for skip, blocking inputs for 1 second
            globalScene.ui.showText(
              i18next.t("battle:eggSkipPrompt", {
                eggsToHatch: eggsToHatchCount,
              }),
              0,
            );
            globalScene.ui.setModeWithoutClear(
              UiMode.CONFIRM,
              () => {
                this.hatchEggsSkipped(eggsToHatch);
                this.showSummary();
              },
              () => {
                this.hatchEggsRegular(eggsToHatch);
                this.end();
              },
              null,
              null,
              null,
              1000,
              true,
            );
          },
          100,
          true,
        );
      } else if (eggsToHatchCount >= this.minEggsToSkip && globalScene.eggSkipPreference === 2) {
        globalScene.phaseManager.queueMessage(i18next.t("battle:eggHatching"));
        this.hatchEggsSkipped(eggsToHatch);
        this.showSummary();
      } else {
        // regular hatches, no summary
        globalScene.phaseManager.queueMessage(i18next.t("battle:eggHatching"));
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
      globalScene.phaseManager.unshiftNew("EggHatchPhase", this, egg, eggsToHatchCount);
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
    globalScene.phaseManager.unshiftNew("EggSummaryPhase", this.eggHatchData);
    this.end();
  }

  /**
   * Hatches an egg and stores it in the local EggHatchData array without animations
   * Also validates the achievements for the hatched pokemon and removes the egg
   * @param egg egg to hatch
   */
  hatchEggSilently(egg: Egg) {
    const eggIndex = globalScene.gameData.eggs.findIndex(e => e.id === egg.id);
    if (eggIndex === -1) {
      return this.end();
    }
    globalScene.gameData.eggs.splice(eggIndex, 1);

    const data = this.generatePokemon(egg);
    const pokemon = data.pokemon;
    if (pokemon.fusionSpecies) {
      pokemon.clearFusionSpecies();
    }

    if (pokemon.species.subLegendary) {
      globalScene.validateAchv(achvs.HATCH_SUB_LEGENDARY);
    }
    if (pokemon.species.legendary) {
      globalScene.validateAchv(achvs.HATCH_LEGENDARY);
    }
    if (pokemon.species.mythical) {
      globalScene.validateAchv(achvs.HATCH_MYTHICAL);
    }
    if (pokemon.isShiny()) {
      globalScene.validateAchv(achvs.HATCH_SHINY);
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
    globalScene.executeWithSeedOffset(
      () => {
        ret = egg.generatePlayerPokemon();
        newHatchData = new EggHatchData(ret, egg.eggMoveIndex);
        newHatchData.setDex();
        this.eggHatchData.push(newHatchData);
      },
      egg.id,
      EGG_SEED.toString(),
    );
    return newHatchData!;
  }
}
