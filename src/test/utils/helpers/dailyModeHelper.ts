import { Button } from "#app/enums/buttons.js";
import overrides from "#app/overrides.js";
import { EncounterPhase, TitlePhase } from "#app/phases.js";
import SaveSlotSelectUiHandler from "#app/ui/save-slot-select-ui-handler.js";
import { Mode } from "#app/ui/ui.js";
import { GameManagerHelper } from "./gameManagerHelper";

/**
 * Helper to handle daily mode specifics
 */
export class DailyModeHelper extends GameManagerHelper {

  /**
   * Runs the daily game to the summon phase.
   * @returns A promise that resolves when the summon phase is reached.
   */
  async runToSummon() {
    await this.game.runToTitle();

    this.game.onNextPrompt("TitlePhase", Mode.TITLE, () => {
      const titlePhase = new TitlePhase(this.game.scene);
      titlePhase.initDailyRun();
    });

    this.game.onNextPrompt("TitlePhase", Mode.SAVE_SLOT, () => {
      const uihandler = this.game.scene.ui.getHandler<SaveSlotSelectUiHandler>();
      uihandler.processInput(Button.ACTION); // select first slot. that's fine
    });

    await this.game.phaseInterceptor.run(EncounterPhase);

    if (overrides.OPP_HELD_ITEMS_OVERRIDE.length === 0) {
      this.game.removeEnemyHeldItems();
    }
  }
}
