import { Button } from "#app/enums/buttons";
import overrides from "#app/overrides";
import { EncounterPhase } from "#app/phases/encounter-phase";
import { TitlePhase } from "#app/phases/title-phase";
import SaveSlotSelectUiHandler from "#app/ui/save-slot-select-ui-handler";
import { Mode } from "#app/ui/ui";
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

    await this.game.phaseInterceptor.to(EncounterPhase);

    if (overrides.OPP_HELD_ITEMS_OVERRIDE.length === 0) {
      this.game.removeEnemyHeldItems();
    }
  }
}
