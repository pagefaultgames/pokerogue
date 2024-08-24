import { Species } from "#app/enums/species";
import overrides from "#app/overrides";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { Mode } from "#app/ui/ui";
import { generateStarter } from "../gameManagerUtils";
import { GameManagerHelper } from "./gameManagerHelper";
import { Challenge } from "#app/data/challenge";

/**
 * Helper to handle Challenge mode specifics
 */
export class ChallengeModeHelper extends GameManagerHelper {

  /**
   * Runs the Challenge game to the summon phase.
   * @param species - Optional array of species to summon.
   * @param gameMode - Optional game mode to set.
   * @returns A promise that resolves when the summon phase is reached.
   */
  async runToSummon(challenges: Challenge[], species?: Species[]) {
    await this.game.runToTitle();

    this.game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      this.game.scene.gameMode.challenges = challenges;
      const starters = generateStarter(this.game.scene, species);
      const selectStarterPhase = new SelectStarterPhase(this.game.scene);
      this.game.scene.pushPhase(new EncounterPhase(this.game.scene, false));
      selectStarterPhase.initBattle(starters);
    });

    await this.game.phaseInterceptor.run(EncounterPhase);
    if (overrides.OPP_HELD_ITEMS_OVERRIDE.length === 0) {
      this.game.removeEnemyHeldItems();
    }
  }
}
