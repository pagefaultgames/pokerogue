import { TitlePhase } from "#phases/title-phase";
import type { GameManager } from "#test/test-utils/game-manager";
import { GameManagerHelper } from "#test/test-utils/helpers/game-manager-helper";
import type { SessionSaveData } from "#types/save-data";
import { vi } from "vitest";

/**
 * Helper to allow reloading sessions in unit tests.
 */
export class ReloadHelper extends GameManagerHelper {
  private sessionData: SessionSaveData;

  constructor(game: GameManager) {
    super(game);

    // Whenever the game saves the session, save it to the reloadHelper instead
    vi.spyOn(game.scene.gameData, "saveAll").mockImplementation(async () => {
      this.sessionData = game.scene.gameData.getSessionSaveData();
      return true;
    });
  }

  /**
   * Simulate reloading the session from the title screen, until reaching the
   * beginning of the first turn (equivalent to running `startBattle()`) for
   * the reloaded session.
   * @returns A Promise that resolves once the reloading process completes.
   *
   * @remarks
   * After reloading, all references to player/enemy Pokemon will no longer be correct
   * (due to initializing new `Pokemon` instances).
   */
  public async reloadSession(): Promise<void> {
    const scene = this.game.scene;
    const titlePhase = new TitlePhase();

    scene.phaseManager.clearPhaseQueue();

    // Set the last saved session to the desired session data
    vi.spyOn(scene.gameData, "getSession").mockReturnValue(Promise.resolve(this.sessionData));
    scene.phaseManager.unshiftPhase(titlePhase);
    this.game.endPhase(); // End the currently ongoing battle

    // remove all persistent mods before loading
    // TODO: Look into why these aren't removed before load
    if (this.game.scene.modifiers.length > 0) {
      console.log(
        "Removing %d modifiers from scene on load...",
        this.game.scene.modifiers.length,
        this.game.scene.modifiers,
      );
      this.game.scene.modifiers = [];
    }
    await titlePhase["loadSaveSlot"](0); // Load the desired session data

    await this.game.phaseInterceptor.to("CommandPhase");
    console.log("==================[New Turn (Reloaded)]==================");
  }
}
