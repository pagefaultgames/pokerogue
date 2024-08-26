import { Species } from "#app/enums/species";
import { GameModes, getGameMode } from "#app/game-mode";
import overrides from "#app/overrides";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { SelectStarterPhase } from "#app/phases/select-starter-phase";
import { Mode } from "#app/ui/ui";
import { generateStarter } from "../gameManagerUtils";
import { GameManagerHelper } from "./gameManagerHelper";

/**
 * Helper to handle classic mode specifics
 */
export class ClassicModeHelper extends GameManagerHelper {

  /**
   * Runs the classic game to the summon phase.
   * @param species - Optional array of species to summon.
   * @returns A promise that resolves when the summon phase is reached.
   */
  async runToSummon(species?: Species[]) {
    await this.game.runToTitle();

    this.game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      this.game.scene.gameMode = getGameMode(GameModes.CLASSIC);
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
