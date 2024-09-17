import { GameManagerHelper } from "./gameManagerHelper";
import { TitlePhase } from "#app/phases/title-phase";
import { Mode } from "#app/ui/ui";
import { vi } from "vitest";
import { BattleStyle } from "#app/enums/battle-style";
import { CommandPhase } from "#app/phases/command-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";
import { SessionSaveData } from "#app/system/game-data";
import GameManager from "../gameManager";

/**
 * Helper to allow reloading sessions in unit tests.
 */
export class ReloadHelper extends GameManagerHelper {
  sessionData: SessionSaveData;

  constructor(game: GameManager) {
    super(game);

    // Whenever the game saves the session, save it to the reloadHelper instead
    vi.spyOn(game.scene.gameData, "saveAll").mockImplementation((scene) => {
      return new Promise<boolean>((resolve, reject) => {
        this.sessionData = scene.gameData.getSessionSaveData(scene);
        resolve(true);
      });
    });
  }

  /**
   * Simulate reloading the session from the title screen, until reaching the
   * beginning of the first turn (equivalent to running `startBattle()`) for
   * the reloaded session.
   */
  async reloadSession() : Promise<void> {
    const scene = this.game.scene;
    const titlePhase = new TitlePhase(scene);

    scene.clearPhaseQueue();

    // Set the last saved session to the desired session data
    vi.spyOn(scene.gameData, "getSession").mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(this.sessionData);
      })
    );
    scene.unshiftPhase(titlePhase);
    this.game.endPhase(); // End the currently ongoing battle

    titlePhase.loadSaveSlot(-1); // Load the desired session data
    this.game.phaseInterceptor.shift(); // Loading the save slot also ended TitlePhase, clean it up

    // Run through prompts for switching Pokemon, copied from classicModeHelper.ts
    if (this.game.scene.battleStyle === BattleStyle.SWITCH) {
      this.game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
        this.game.setMode(Mode.MESSAGE);
        this.game.endPhase();
      }, () => this.game.isCurrentPhase(CommandPhase) || this.game.isCurrentPhase(TurnInitPhase));

      this.game.onNextPrompt("CheckSwitchPhase", Mode.CONFIRM, () => {
        this.game.setMode(Mode.MESSAGE);
        this.game.endPhase();
      }, () => this.game.isCurrentPhase(CommandPhase) || this.game.isCurrentPhase(TurnInitPhase));
    }

    await this.game.phaseInterceptor.to(CommandPhase);
    console.log("==================[New Turn]==================");
  }
}
