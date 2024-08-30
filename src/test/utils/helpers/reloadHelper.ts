import { BattleType } from "#app/battle";
import PokemonData from "#app/system/pokemon-data";
import ArenaData from "#app/system/arena-data";
import PersistentModifierData from "#app/system/modifier-data";
import ChallengeData from "#app/system/challenge-data";
import TrainerData from "#app/system/trainer-data";
import { SessionSaveData } from "#app/system/game-data";
import { GameManagerHelper } from "./gameManagerHelper";
import { TitlePhase } from "#app/phases/title-phase";
import { Mode } from "#app/ui/ui";
import { vi } from "vitest";
import { BattleStyle } from "#app/enums/battle-style";
import { CommandPhase } from "#app/phases/command-phase";
import { TurnInitPhase } from "#app/phases/turn-init-phase";

/**
 * Helper to allow reloading sessions in unit tests.
 */
export class ReloadHelper extends GameManagerHelper {
  /**
   * Return a save data object to be used for reloading the current session.
   * @returns A save data object for the current session.
   */
  getSessionSaveData() : SessionSaveData {
    // Copied from game-data.ts
    const scene = this.game.scene;
    const ret = {
      seed: scene.seed,
      playTime: scene.sessionPlayTime,
      gameMode: scene.gameMode.modeId,
      party: scene.getParty().map(p => new PokemonData(p)),
      enemyParty: scene.getEnemyParty().map(p => new PokemonData(p)),
      modifiers: scene.findModifiers(() => true).map(m => new PersistentModifierData(m, true)),
      enemyModifiers: scene.findModifiers(() => true, false).map(m => new PersistentModifierData(m, false)),
      arena: new ArenaData(scene.arena),
      pokeballCounts: scene.pokeballCounts,
      money: scene.money,
      score: scene.score,
      waveIndex: scene.currentBattle.waveIndex,
      battleType: scene.currentBattle.battleType,
      trainer: scene.currentBattle.battleType === BattleType.TRAINER ? new TrainerData(scene.currentBattle.trainer) : null,
      gameVersion: scene.game.config.gameVersion,
      timestamp: new Date().getTime(),
      challenges: scene.gameMode.challenges.map(c => new ChallengeData(c))
    } as SessionSaveData;
    return ret;
  }

  /**
   * Simulate reloading the session from the title screen, until reaching the
   * beginning of the first turn (equivalent to running `startBattle()`) for
   * the reloaded session.
   */
  async reloadSession() : Promise<void> {
    const scene = this.game.scene;
    const sessionData = this.getSessionSaveData();
    const titlePhase = new TitlePhase(scene);

    scene.clearPhaseQueue();

    // Set the last saved session to the desired session data
    vi.spyOn(scene.gameData, "getSession").mockReturnValue(
      new Promise((resolve, reject) => {
        resolve(sessionData);
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
